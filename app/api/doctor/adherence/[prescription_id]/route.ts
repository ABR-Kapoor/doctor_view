import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { prescription_id: string } }) {
    try {
        const { prescription_id } = params;
        if (!prescription_id) return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 });

        // Fetch prescription with patient info
        const [prescription] = await sql`
            SELECT p.*, u.name as patient_name, u.profile_image_url as patient_image
            FROM prescriptions p
            JOIN patients pat ON p.pid = pat.pid
            JOIN users u ON pat.uid = u.uid
            WHERE p.prescription_id = ${prescription_id}
        `;

        const adherenceRecords = await sql`
            SELECT * FROM medication_adherence
            WHERE prescription_id = ${prescription_id}
            ORDER BY scheduled_date ASC
        `;

        if (!adherenceRecords || adherenceRecords.length === 0) {
            return NextResponse.json({
                success: true,
                stats: { total_doses: 0, taken: 0, skipped: 0, pending: 0, adherence_rate: 0, daily_breakdown: [], medicine_breakdown: [] }
            });
        }

        const total = adherenceRecords.length;
        const taken = adherenceRecords.filter(r => r.is_taken).length;
        const skipped = adherenceRecords.filter(r => r.is_skipped).length;
        const pending = total - taken - skipped;
        const adherence_rate = total > 0 ? ((taken / total) * 100).toFixed(1) : 0;

        const dailyMap = new Map();
        adherenceRecords.forEach(record => {
            const date = record.scheduled_date;
            if (!dailyMap.has(date)) dailyMap.set(date, { date, taken: 0, skipped: 0, pending: 0 });
            const day = dailyMap.get(date);
            if (record.is_taken) day.taken++; else if (record.is_skipped) day.skipped++; else day.pending++;
        });

        const medicineMap = new Map();
        adherenceRecords.forEach(record => {
            const name = record.medicine_name;
            if (!medicineMap.has(name)) medicineMap.set(name, { medicine_name: name, total: 0, taken: 0 });
            const med = medicineMap.get(name);
            med.total++; if (record.is_taken) med.taken++;
        });

        const recent_activity = adherenceRecords
            .filter(r => r.is_taken || r.is_skipped)
            .sort((a, b) => new Date(b.taken_at || b.skipped_at || 0).getTime() - new Date(a.taken_at || a.skipped_at || 0).getTime())
            .slice(0, 10);

        return NextResponse.json({
            success: true,
            stats: {
                total_doses: total, taken, skipped, pending, adherence_rate: Number(adherence_rate),
                daily_breakdown: Array.from(dailyMap.values()),
                medicine_breakdown: Array.from(medicineMap.values()).map(m => ({ ...m, adherence_rate: m.total > 0 ? ((m.taken / m.total) * 100).toFixed(1) : 0 })),
                recent_activity,
                patient: prescription ? { name: prescription.patient_name, profile_image_url: prescription.patient_image } : null
            }
        });
    } catch (error: any) {
        console.error('[API] Adherence stats error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
