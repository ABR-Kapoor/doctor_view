import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pid, did, aid, diagnosis, symptoms, medicines, instructions, diet_advice, follow_up_date } = body;

        if (!pid || !did || !diagnosis || !medicines || medicines.length === 0) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const [data] = await sql`
            INSERT INTO prescriptions (pid, did, aid, diagnosis, symptoms, medicines, instructions, diet_advice, follow_up_date, ai_generated, is_active)
            VALUES (${pid}, ${did}, ${aid || null}, ${diagnosis}, ${symptoms || []}, ${JSON.stringify(medicines)}, ${instructions || null}, ${diet_advice || null}, ${follow_up_date || null}, false, true)
            RETURNING *
        `;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/notifications/send`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'prescription_created', data: { patientId: pid, doctorId: did, diagnosis, medicines, instructions } })
            });
        } catch (notifError) { console.error('Failed to send notification:', notifError); }

        return NextResponse.json({ success: true, prescription: data, message: 'Prescription created successfully' });
    } catch (error: any) {
        console.error('[API] Prescription creation error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const did = searchParams.get('did');

        if (!did) {
            return NextResponse.json({ success: false, error: 'Doctor ID required' }, { status: 400 });
        }

        const prescriptions = await sql`
            SELECT p.prescription_id, p.diagnosis, p.medicines, p.created_at, p.sent_to_patient, p.sent_at,
                   pat.pid, pat.city, pat.state, u.name, u.email, u.profile_image_url
            FROM prescriptions p
            JOIN patients pat ON p.pid = pat.pid
            JOIN users u ON pat.uid = u.uid
            WHERE p.did = ${did} AND p.is_active = true
            ORDER BY p.created_at DESC
        `;

        const formatted = prescriptions.map(p => ({
            prescription_id: p.prescription_id, diagnosis: p.diagnosis, medicines: p.medicines,
            created_at: p.created_at, sent_to_patient: p.sent_to_patient, sent_at: p.sent_at,
            patients: { pid: p.pid, city: p.city, state: p.state, users: { name: p.name, email: p.email, profile_image_url: p.profile_image_url } }
        }));

        return NextResponse.json({ success: true, prescriptions: formatted });
    } catch (error: any) {
        console.error('[API] Prescriptions fetch error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
