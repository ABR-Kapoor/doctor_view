import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
    request: NextRequest,
    { params }: { params: { aid: string } }
) {
    try {
        const { aid } = params;
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if already started
        const { data: appointment } = await supabase
            .from('appointments')
            .select('call_started_at, status')
            .eq('aid', aid)
            .single();

        if (appointment?.call_started_at) {
            return NextResponse.json({
                success: true,
                message: 'Call already started',
                data: appointment
            });
        }

        // Update appointment status and start time
        const { data, error } = await supabase
            .from('appointments')
            .update({
                call_started_at: new Date().toISOString(),
                status: 'in_progress',
                updated_at: new Date().toISOString(),
            })
            .eq('aid', aid)
            .select()
            .single();

        if (error) {
            console.error('[API] Error starting call:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Call started successfully',
        });
    } catch (error: any) {
        console.error('[API] Start call error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
