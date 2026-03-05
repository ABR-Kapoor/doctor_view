import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { aid: string } }) {
    try {
        const { aid } = params;

        const [appointment] = await sql`SELECT call_started_at, status FROM appointments WHERE aid = ${aid}`;

        if (appointment?.call_started_at) {
            return NextResponse.json({ success: true, message: 'Call already started', data: appointment });
        }

        const [data] = await sql`
            UPDATE appointments SET call_started_at = ${new Date().toISOString()}, status = 'in_progress'
            WHERE aid = ${aid} RETURNING *
        `;

        return NextResponse.json({ success: true, data, message: 'Call started successfully' });
    } catch (error: any) {
        console.error('[API] Start call error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
