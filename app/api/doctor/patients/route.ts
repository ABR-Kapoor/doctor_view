import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function GET(request: Request) {
    try {
        const { getUser } = getKindeServerSession();
        const kindeUser = await getUser();

        if (!kindeUser || !kindeUser.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get user from database
        const { data: user } = await supabase
            .from('users')
            .select('uid')
            .eq('auth_id', kindeUser.id)
            .single();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Get doctor record
        const { data: doctor } = await supabase
            .from('doctors')
            .select('did')
            .eq('uid', user.uid)
            .single();

        if (!doctor) {
            return NextResponse.json(
                { success: false, error: 'Doctor record not found' },
                { status: 404 }
            );
        }

        // Get patients from doctor_patient_relationships
        const { data: relationships, error: relError } = await supabase
            .from('doctor_patient_relationships')
            .select(`
        pid,
        total_appointments,
        last_appointment_date,
        first_appointment_date
      `)
            .eq('did', doctor.did)
            .eq('relationship_status', 'active');

        if (relError) {
            console.error('[API] Error fetching relationships:', relError);
            return NextResponse.json(
                { success: false, error: relError.message },
                { status: 500 }
            );
        }

        if (!relationships || relationships.length === 0) {
            return NextResponse.json({
                success: true,
                patients: [],
            });
        }

        // Get patient details for each relationship
        const patientIds = relationships.map(r => r.pid);

        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select(`
        pid,
        uid,
        date_of_birth,
        gender,
        blood_group,
        allergies,
        chronic_conditions,
        users (
          name,
          email,
          phone,
          profile_image_url
        )
      `)
            .in('pid', patientIds);

        if (patientsError) {
            console.error('[API] Error fetching patients:', patientsError);
            return NextResponse.json(
                { success: false, error: patientsError.message },
                { status: 500 }
            );
        }

        // Merge relationship data with patient data
        const enrichedPatients = patients?.map(patient => {
            const relationship = relationships.find(r => r.pid === patient.pid);
            return {
                ...patient,
                user: Array.isArray(patient.users) ? patient.users[0] : patient.users,
                total_appointments: relationship?.total_appointments || 0,
                last_appointment_date: relationship?.last_appointment_date,
                first_appointment_date: relationship?.first_appointment_date,
                // Mock adherence for now (will be calculated from prescriptions later)
                adherenceRate: 85,
                recentAdherence: [],
            };
        });

        return NextResponse.json({
            success: true,
            patients: enrichedPatients || [],
        });
    } catch (error: any) {
        console.error('[API] Patients fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
