import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        console.log('=== Database Connection Test (Neon) ===');
        const users = await sql`SELECT uid, name, email FROM users LIMIT 5`;
        const doctors = await sql`SELECT did, uid FROM doctors LIMIT 5`;
        const patients = await sql`SELECT pid, uid FROM patients LIMIT 5`;

        return NextResponse.json({
            success: true, message: 'Database connection successful!',
            tests: { db_initialized: true, users_count: users?.length || 0, doctors_count: doctors?.length || 0, patients_count: patients?.length || 0 },
            sample_data: { users: users || [], doctors: doctors || [], patients: patients || [] },
        });
    } catch (error: any) {
        console.error('Database test error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Unknown error occurred' }, { status: 500 });
    }
}
