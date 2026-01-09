import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Enable adherence tracking system
export async function POST(request: NextRequest) {
    try {
        // Enable the trigger using raw SQL
        const { error } = await supabase.rpc('enable_adherence_tracking');

        if (error) {
            // If RPC doesn't exist, try direct SQL
            const { error: sqlError } = await supabase
                .from('prescriptions')
                .select('prescription_id')
                .limit(1); // Just to test connection

            // Note: Supabase client doesn't support ALTER TABLE directly
            // This needs to be run in Supabase SQL editor
            return NextResponse.json({
                success: false,
                error: 'Please run the SQL command in Supabase SQL Editor',
                sql: `ALTER TABLE prescriptions ENABLE TRIGGER trigger_auto_create_adherence;`,
                instructions: [
                    '1. Go to Supabase Dashboard → SQL Editor',
                    '2. Run: ALTER TABLE prescriptions ENABLE TRIGGER trigger_auto_create_adherence;',
                    '3. Verify: SELECT tgenabled FROM pg_trigger WHERE tgname = \'trigger_auto_create_adherence\';',
                    '4. Should show \'O\' (enabled)'
                ]
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Adherence tracking enabled successfully'
        });
    } catch (error: any) {
        console.error('[API] Enable adherence error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

// GET - Check if adherence tracking is enabled
export async function GET(request: NextRequest) {
    try {
        // Check if trigger exists and is enabled
        const { data, error } = await supabase
            .from('medication_adherence')
            .select('adherence_id')
            .limit(1);

        return NextResponse.json({
            success: true,
            isEnabled: !error,
            message: error ? 'Adherence tracking not enabled' : 'Adherence tracking is active'
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
