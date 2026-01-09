import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch adherence statistics for a prescription
export async function GET(
    request: NextRequest,
    { params }: { params: { prescription_id: string } }
) {
    try {
        const { prescription_id } = params;

        if (!prescription_id) {
            return NextResponse.json(
                { success: false, error: 'Prescription ID required' },
                { status: 400 }
            );
        }

        // Fetch prescription details to get patient info
        const { data: prescription, error: presError } = await supabase
            .from('prescriptions')
            .select(`
                *,
                patients (
                    pid,
                    users (
                        name,
                        profile_image_url
                    )
                )
            `)
            .eq('prescription_id', prescription_id)
            .single();

        if (presError) {
            console.error('[API] Error fetching prescription details:', presError);
        }

        // Fetch all adherence records for this prescription
        const { data: adherenceRecords, error } = await supabase
            .from('medication_adherence')
            .select('*')
            .eq('prescription_id', prescription_id)
            .order('scheduled_date', { ascending: true });

        if (error) {
            console.error('[API] Error fetching adherence stats:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        if (!adherenceRecords || adherenceRecords.length === 0) {
            return NextResponse.json({
                success: true,
                stats: {
                    total_doses: 0,
                    taken: 0,
                    skipped: 0,
                    pending: 0,
                    adherence_rate: 0,
                    daily_breakdown: [],
                    medicine_breakdown: []
                }
            });
        }

        // Calculate statistics
        const total = adherenceRecords.length;
        const taken = adherenceRecords.filter(r => r.is_taken).length;
        const skipped = adherenceRecords.filter(r => r.is_skipped).length;
        const pending = total - taken - skipped;
        const adherence_rate = total > 0 ? ((taken / total) * 100).toFixed(1) : 0;

        // Daily breakdown
        const dailyMap = new Map();
        adherenceRecords.forEach(record => {
            const date = record.scheduled_date;
            if (!dailyMap.has(date)) {
                dailyMap.set(date, { date, taken: 0, skipped: 0, pending: 0 });
            }
            const day = dailyMap.get(date);
            if (record.is_taken) day.taken++;
            else if (record.is_skipped) day.skipped++;
            else day.pending++;
        });
        const daily_breakdown = Array.from(dailyMap.values());

        // Medicine-wise breakdown
        const medicineMap = new Map();
        adherenceRecords.forEach(record => {
            const name = record.medicine_name;
            if (!medicineMap.has(name)) {
                medicineMap.set(name, { medicine_name: name, total: 0, taken: 0, adherence_rate: 0 });
            }
            const med = medicineMap.get(name);
            med.total++;
            if (record.is_taken) med.taken++;
        });
        const medicine_breakdown = Array.from(medicineMap.values()).map(m => ({
            ...m,
            adherence_rate: m.total > 0 ? ((m.taken / m.total) * 100).toFixed(1) : 0
        }));

        // Recent activity (last 10 entries that are taken or skipped)
        const recent_activity = adherenceRecords
            .filter(r => r.is_taken || r.is_skipped)
            .sort((a, b) => {
                const dateA = new Date(a.taken_at || a.skipped_at || 0).getTime();
                const dateB = new Date(b.taken_at || b.skipped_at || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, 10);

        return NextResponse.json({
            success: true,
            stats: {
                total_doses: total,
                taken,
                skipped,
                pending,
                adherence_rate: Number(adherence_rate),
                daily_breakdown,
                medicine_breakdown,
                recent_activity,
                patient: prescription?.patients?.users || null
            }
        });
    } catch (error: any) {
        console.error('[API] Adherence stats error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
