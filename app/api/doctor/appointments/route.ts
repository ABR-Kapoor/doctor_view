import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Get doctor record
        const { data: doctor } = await supabase
            .from('doctors')
            .select('did')
            .eq('uid', uid)
            .single();

        if (!doctor) {
            return NextResponse.json({ success: true, appointments: { pending: [], confirmed: [], today: [] } });
        }

        const today = new Date().toISOString().split('T')[0];

        // Get all appointments for this doctor
        const { data: allAppointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('did', doctor.did)
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true });

        if (appointmentsError) throw appointmentsError;

        if (!allAppointments || allAppointments.length === 0) {
            return NextResponse.json({
                success: true,
                appointments: { pending: [], confirmed: [], today: [] }
            });
        }

        // Get all unique patient IDs
        const patientIds = [...new Set(allAppointments.map(apt => apt.pid))];

        // Fetch patient details with user info
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select(`
                pid,
                uid,
                user:users(name, email, phone, profile_image_url)
            `)
            .in('pid', patientIds);

        if (patientsError) {
            console.error('Patients error:', patientsError);
        }

        // Map patient data to appointments and transform field names
        const enrichedAppointments = allAppointments.map(apt => ({
            ...apt,
            complaint_description: apt.chief_complaint, // Map chief_complaint to complaint_description
            payment_status: 'pending', // Default payment status
            patient: patients?.find(pat => pat.pid === apt.pid) || null
        }));

        // Categorize appointments
        // Logic that respects local timezone for 'today'
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        // Categorize appointments
        const pending = enrichedAppointments.filter((apt) => apt.status === 'scheduled') || [];
        const confirmed = enrichedAppointments.filter(
            (apt) => apt.status === 'confirmed' && apt.scheduled_date !== todayString
        ) || [];
        const todayAppts = enrichedAppointments.filter(
            (apt) => apt.scheduled_date === todayString && (['confirmed', 'in_progress', 'scheduled'].includes(apt.status))
        ) || [];
        const completed = enrichedAppointments.filter((apt) => apt.status === 'completed') || [];
        const cancelled = enrichedAppointments.filter((apt) => apt.status === 'cancelled') || [];

        return NextResponse.json({
            success: true,
            appointments: {
                pending,
                confirmed,
                today: todayAppts,
                completed,
                cancelled,
            },
        });
    } catch (error) {
        console.error('Appointments API error:', error);
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}

// Update appointment status
export async function PATCH(request: NextRequest) {
    try {
        const { aid, status } = await request.json();

        if (!aid || !status) {
            return NextResponse.json({ error: 'Appointment ID and status required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('aid', aid)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, appointment: data });
    } catch (error) {
        console.error('Update appointment error:', error);
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }
}

// Delete appointment
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const aid = searchParams.get('aid');

        if (!aid) {
            return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('aid', aid);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
    }
}
