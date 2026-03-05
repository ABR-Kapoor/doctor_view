import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();

        if (!kindeUser || !kindeUser.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const [user] = await sql`SELECT uid FROM users WHERE auth_id = ${kindeUser.id}`;
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const [doctor] = await sql`SELECT did FROM doctors WHERE uid = ${user.uid}`;
        if (!doctor) {
            return NextResponse.json({ success: false, error: 'Doctor record not found' }, { status: 404 });
        }

        // Get patients from doctor_patient_relationships
        const relationships = await sql`
            SELECT pid, total_appointments, last_appointment_date, first_appointment_date
            FROM doctor_patient_relationships
            WHERE did = ${doctor.did} AND relationship_status = 'active'
        `;

        if (!relationships || relationships.length === 0) {
            return NextResponse.json({ success: true, patients: [] });
        }

        const patientIds = relationships.map(r => r.pid);

        // Get patient details with user info
        const patients = await sql`
            SELECT p.pid, p.uid, p.date_of_birth, p.gender, p.blood_group, p.allergies, p.chronic_conditions,
                   u.name, u.email, u.phone, u.profile_image_url
            FROM patients p
            JOIN users u ON p.uid = u.uid
            WHERE p.pid = ANY(${patientIds}::uuid[])
        `;

        // Enrich with adherence and prescription data
        const enrichedPatients = await Promise.all(patients.map(async (patient) => {
            const relationship = relationships.find(r => r.pid === patient.pid);

            const [prescriptionCount] = await sql`
                SELECT count(*)::int as count FROM prescriptions
                WHERE pid = ${patient.pid} AND did = ${doctor.did}
            `;

            const adherenceRecords = await sql`
                SELECT is_taken, is_skipped FROM medication_adherence
                WHERE pid = ${patient.pid}
            `;

            let adherenceRate = 0;
            if (adherenceRecords && adherenceRecords.length > 0) {
                const takenCount = adherenceRecords.filter(r => r.is_taken).length;
                adherenceRate = Math.round((takenCount / adherenceRecords.length) * 100);
            }

            return {
                ...patient,
                user: { name: patient.name, email: patient.email, phone: patient.phone, profile_image_url: patient.profile_image_url },
                total_appointments: relationship?.total_appointments || 0,
                last_appointment_date: relationship?.last_appointment_date,
                first_appointment_date: relationship?.first_appointment_date,
                adherenceRate,
                prescriptionCount: prescriptionCount?.count || 0,
                recentAdherence: adherenceRecords?.slice(-7) || [],
            };
        }));

        return NextResponse.json({ success: true, patients: enrichedPatients });
    } catch (error: any) {
        console.error('[API] Patients fetch error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
