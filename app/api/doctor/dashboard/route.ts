import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const [doctor] = await sql`SELECT * FROM doctors WHERE uid = ${uid}`;

        if (!doctor) {
            return NextResponse.json({
                success: true, totalPatients: 0, todayAppointments: 0,
                pendingApprovals: 0, monthlyRevenue: 0, appointmentsData: [], patientsData: [],
            });
        }

        const allAppointments = await sql`SELECT * FROM appointments WHERE did = ${doctor.did}`;

        const now = new Date();
        const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayAppointments = allAppointments?.filter(apt => apt.scheduled_date === todayString).length || 0;

        const pendingApprovals = allAppointments?.filter(apt => apt.status === 'scheduled').length || 0;
        const uniquePatients = new Set(allAppointments?.map(apt => apt.pid));
        const totalPatients = uniquePatients.size;

        const thisMonth = now.getMonth();
        const monthlyRevenue = allAppointments
            ?.filter(apt => new Date(apt.scheduled_date).getMonth() === thisMonth && apt.status === 'completed')
            .reduce((sum) => sum + (Number(doctor.consultation_fee) || 0), 0) || 0;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = now.getMonth();
        const appointmentsData = [];
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            const count = allAppointments?.filter(apt => new Date(apt.scheduled_date).getMonth() === monthIndex).length || 0;
            appointmentsData.push({ month: monthNames[monthIndex], count });
        }

        const patientsData = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            const weekPatients = new Set(
                allAppointments?.filter(apt => { const d = new Date(apt.scheduled_date); return d >= weekStart && d < weekEnd; }).map(apt => apt.pid)
            );
            patientsData.push({ date: `Week ${4 - i}`, patients: weekPatients.size });
        }

        return NextResponse.json({
            success: true, totalPatients, todayAppointments, pendingApprovals,
            monthlyRevenue, appointmentsData, patientsData,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
