import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function DELETE(request: NextRequest, { params }: { params: { prescription_id: string } }) {
    try {
        const { prescription_id } = params;
        if (!prescription_id) return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 });

        await sql`UPDATE prescriptions SET is_active = false WHERE prescription_id = ${prescription_id}`;
        return NextResponse.json({ success: true, message: 'Prescription deleted successfully' });
    } catch (error: any) {
        console.error('[API] Delete prescription error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { prescription_id: string } }) {
    try {
        const { prescription_id } = params;
        const body = await request.json();
        if (!prescription_id) return NextResponse.json({ success: false, error: 'Prescription ID required' }, { status: 400 });

        const { diagnosis, symptoms, medicines, instructions, diet_advice, follow_up_date } = body;

        const [data] = await sql`
            UPDATE prescriptions SET
                diagnosis = ${diagnosis}, symptoms = ${symptoms || []}, medicines = ${JSON.stringify(medicines)},
                instructions = ${instructions || null}, diet_advice = ${diet_advice || null},
                follow_up_date = ${follow_up_date || null}, updated_at = ${new Date().toISOString()}
            WHERE prescription_id = ${prescription_id}
            RETURNING *
        `;

        return NextResponse.json({ success: true, prescription: data, message: 'Prescription updated successfully' });
    } catch (error: any) {
        console.error('[API] Update prescription error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
