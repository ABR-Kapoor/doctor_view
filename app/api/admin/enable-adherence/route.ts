import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        try {
            await sql`SELECT enable_adherence_tracking()`;
            return NextResponse.json({ success: true, message: 'Adherence tracking enabled successfully' });
        } catch {
            return NextResponse.json({
                success: false,
                error: 'Please run the SQL command in Neon SQL Editor',
                sql: `ALTER TABLE prescriptions ENABLE TRIGGER trigger_auto_create_adherence;`,
                instructions: [
                    '1. Go to Neon Console → SQL Editor',
                    '2. Run: ALTER TABLE prescriptions ENABLE TRIGGER trigger_auto_create_adherence;',
                    '3. Verify: SELECT tgenabled FROM pg_trigger WHERE tgname = \'trigger_auto_create_adherence\';',
                    '4. Should show \'O\' (enabled)'
                ]
            });
        }
    } catch (error: any) {
        console.error('[API] Enable adherence error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const records = await sql`SELECT adherence_id FROM medication_adherence LIMIT 1`;
        return NextResponse.json({ success: true, isEnabled: true, message: 'Adherence tracking is active' });
    } catch (error: any) {
        return NextResponse.json({ success: false, isEnabled: false, error: error.message }, { status: 500 });
    }
}
