import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: { aid: string } }) {
    try {
        const { aid } = params;
        const body = await request.json();
        const { start_time, end_time, duration_minutes } = body;

        if (!start_time || !end_time || duration_minutes === undefined) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const [data] = await sql`
            UPDATE appointments SET start_time = ${start_time}, end_time = ${end_time}, duration_minutes = ${duration_minutes}, status = 'completed'
            WHERE aid = ${aid} RETURNING *
        `;

        console.log(`[API] Updated call duration for appointment ${aid}: ${duration_minutes} minutes`);
        return NextResponse.json({ success: true, data, message: 'Call duration updated successfully' });
    } catch (error: any) {
        console.error('[API] Call duration update error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
