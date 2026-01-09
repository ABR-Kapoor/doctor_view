import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { aid: string } }
) {
    try {
        const { aid } = params;
        const body = await request.json();
        const { start_time, end_time, duration_minutes } = body;

        if (!start_time || !end_time || duration_minutes === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Update appointment with call duration
        const { data, error } = await supabase
            .from('appointments')
            .update({
                start_time,
                end_time,
                duration_minutes,
                status: 'completed', // Mark as completed after call
                updated_at: new Date().toISOString(),
            })
            .eq('aid', aid)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating call duration:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log(`[API] Updated call duration for appointment ${aid}: ${duration_minutes} minutes`);

        return NextResponse.json({
            success: true,
            data,
            message: 'Call duration updated successfully',
        });
    } catch (error: any) {
        console.error('[API] Call duration update error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
