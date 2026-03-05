import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { prescription_id: string } }) {
    try {
        const { prescription_id } = params;
        if (!prescription_id) return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 });

        const [data] = await sql`
            UPDATE prescriptions SET sent_to_patient = true, sent_at = ${new Date().toISOString()}
            WHERE prescription_id = ${prescription_id}
            RETURNING *
        `;

        return NextResponse.json({ success: true, prescription: data, message: 'Prescription sent to patient successfully' });
    } catch (error: any) {
        console.error('[API] Send prescription error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
