import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
    try {
        const { patientId } = params;

        const [patient] = await sql`
            SELECT p.pid, p.uid, p.date_of_birth, p.gender, p.blood_group, p.allergies, p.chronic_conditions, p.current_medications,
                   u.name, u.email, u.phone, u.profile_image_url
            FROM patients p
            JOIN users u ON p.uid = u.uid
            WHERE p.pid = ${patientId}
        `;

        if (!patient) {
            return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
        }

        const appointments = await sql`
            SELECT aid, scheduled_date, scheduled_time, mode, status, chief_complaint, duration_minutes
            FROM appointments WHERE pid = ${patientId}
            ORDER BY scheduled_date DESC
        `;

        return NextResponse.json({
            success: true,
            patient: {
                ...patient,
                user: { name: patient.name, email: patient.email, phone: patient.phone, profile_image_url: patient.profile_image_url },
            },
            appointments: appointments || [],
        });
    } catch (error: any) {
        console.error('[API] Patient detail error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
