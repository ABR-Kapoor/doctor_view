import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const uid = request.nextUrl.searchParams.get('uid');
        if (!uid) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        const [doctor] = await sql`SELECT did FROM doctors WHERE uid = ${uid}`;
        if (!doctor) return NextResponse.json({ success: true, appointments: { pending: [], confirmed: [], today: [] } });

        const allAppointments = await sql`
            SELECT * FROM appointments WHERE did = ${doctor.did}
            ORDER BY scheduled_date ASC, scheduled_time ASC
        `;

        if (!allAppointments || allAppointments.length === 0) {
            return NextResponse.json({ success: true, appointments: { pending: [], confirmed: [], today: [] } });
        }

        const patientIds = [...new Set(allAppointments.map(apt => apt.pid))];

        const patients = await sql`
            SELECT p.pid, p.uid, u.name, u.email, u.phone, u.profile_image_url
            FROM patients p JOIN users u ON p.uid = u.uid
            WHERE p.pid = ANY(${patientIds}::uuid[])
        `;

        const enrichedAppointments = allAppointments.map((apt: any) => ({
            ...apt, complaint_description: apt.chief_complaint, payment_status: 'pending',
            patient: (() => {
                const p = patients?.find(pat => pat.pid === apt.pid);
                return p ? { pid: p.pid, uid: p.uid, user: { name: p.name, email: p.email, phone: p.phone, profile_image_url: p.profile_image_url } } : null;
            })()
        }));

        const now = new Date();
        const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        return NextResponse.json({
            success: true,
            appointments: {
                pending: enrichedAppointments.filter((a: any) => a.status === 'scheduled'),
                confirmed: enrichedAppointments.filter((a: any) => a.status === 'confirmed' && a.scheduled_date !== todayString),
                today: enrichedAppointments.filter((a: any) => a.scheduled_date === todayString && ['confirmed', 'in_progress', 'scheduled'].includes(a.status)),
                completed: enrichedAppointments.filter((a: any) => a.status === 'completed'),
                cancelled: enrichedAppointments.filter((a: any) => a.status === 'cancelled'),
            },
        });
    } catch (error) {
        console.error('Appointments API error:', error);
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { aid, status } = await request.json();
        if (!aid || !status) return NextResponse.json({ error: 'Appointment ID and status required' }, { status: 400 });

        const [data] = await sql`UPDATE appointments SET status = ${status} WHERE aid = ${aid} RETURNING *`;
        return NextResponse.json({ success: true, appointment: data });
    } catch (error) {
        console.error('Update appointment error:', error);
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const aid = request.nextUrl.searchParams.get('aid');
        if (!aid) return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });

        await sql`DELETE FROM appointments WHERE aid = ${aid}`;
        return NextResponse.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
    }
}
