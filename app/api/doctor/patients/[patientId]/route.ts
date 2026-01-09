import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
    request: NextRequest,
    { params }: { params: { patientId: string } }
) {
    try {
        const { patientId } = params;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get patient details with user info
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select(`
        pid,
        uid,
        date_of_birth,
        gender,
        blood_group,
        allergies,
        chronic_conditions,
        current_medications,
        users (
          name,
          email,
          phone,
          profile_image_url
        )
      `)
            .eq('pid', patientId)
            .single();

        if (patientError || !patient) {
            return NextResponse.json(
                { success: false, error: 'Patient not found' },
                { status: 404 }
            );
        }

        // Get appointment history for this patient with this doctor
        const { data: appointments, error: apptsError } = await supabase
            .from('appointments')
            .select(`
        aid,
        scheduled_date,
        scheduled_time,
        mode,
        status,
        chief_complaint,
        duration_minutes
      `)
            .eq('pid', patientId)
            .order('scheduled_date', { ascending: false });

        return NextResponse.json({
            success: true,
            patient: {
                ...patient,
                user: Array.isArray(patient.users) ? patient.users[0] : patient.users,
            },
            appointments: appointments || [],
        });
    } catch (error: any) {
        console.error('[API] Patient detail error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
