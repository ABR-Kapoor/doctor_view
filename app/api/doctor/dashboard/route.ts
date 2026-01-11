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
            .select('*')
            .eq('uid', uid)
            .single();

        if (!doctor) {
            return NextResponse.json({
                success: true,
                totalPatients: 0,
                todayAppointments: 0,
                pendingApprovals: 0,
                monthlyRevenue: 0,
                appointmentsData: [],
                patientsData: [],
            });
        }

        // Get all appointments for this doctor
        const { data: allAppointments } = await supabase
            .from('appointments')
            .select('*')
            .eq('did', doctor.did);

        // Today's appointments
        // Today's appointments (Timezone Safe)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        const todayAppointments = allAppointments?.filter(
            (apt) => apt.scheduled_date === todayString
        ).length || 0;

        // Pending approvals (scheduled but not confirmed)
        const pendingApprovals = allAppointments?.filter(
            (apt) => apt.status === 'scheduled'
        ).length || 0;

        // Get unique patients
        const uniquePatients = new Set(allAppointments?.map((apt) => apt.pid));
        const totalPatients = uniquePatients.size;

        // Calculate monthly revenue
        const thisMonth = new Date().getMonth();
        const monthlyRevenue = allAppointments
            ?.filter((apt) => {
                const aptMonth = new Date(apt.scheduled_date).getMonth();
                return aptMonth === thisMonth && apt.status === 'completed';
            })
            .reduce((sum, apt) => sum + (Number(doctor.consultation_fee) || 0), 0) || 0;

        // Appointments per month data (last 6 months)
        const appointmentsData = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const count = allAppointments?.filter((apt) => {
                const aptMonth = new Date(apt.scheduled_date).getMonth();
                return aptMonth === monthIndex;
            }).length || 0;

            appointmentsData.push({
                month: monthNames[monthIndex],
                count,
            });
        }

        // Patient growth (last 4 weeks)
        const patientsData = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const weekPatients = new Set(
                allAppointments
                    ?.filter((apt) => {
                        const aptDate = new Date(apt.scheduled_date);
                        return aptDate >= weekStart && aptDate < weekEnd;
                    })
                    .map((apt) => apt.pid)
            );

            patientsData.push({
                date: `Week ${4 - i}`,
                patients: weekPatients.size,
            });
        }

        return NextResponse.json({
            success: true,
            totalPatients,
            todayAppointments,
            pendingApprovals,
            monthlyRevenue,
            appointmentsData,
            patientsData,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
