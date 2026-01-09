import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
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

        // Update prescription as sent
        const { data, error } = await supabase
            .from('prescriptions')
            .update({
                sent_to_patient: true,
                sent_at: new Date().toISOString(),
            })
            .eq('prescription_id', prescription_id)
            .select('*, patients(user:users(name))')
            .single();

        if (error) {
            console.error('[API] Error sending prescription:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log('[API] Prescription sent to patient:', prescription_id);

        return NextResponse.json({
            success: true,
            prescription: data,
            message: 'Prescription sent to patient successfully',
        });
    } catch (error: any) {
        console.error('[API] Send prescription error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
