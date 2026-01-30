import { NextResponse } from 'next/server';
import { supabase } from '@/lib/shared/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Log environment variables (without exposing full keys)
        console.log('=== Database Connection Test ===');
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

        // Test 1: Check if Supabase client is initialized
        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase client not initialized',
            }, { status: 500 });
        }

        // Test 2: Try to query the users table
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('uid, name, email')
            .limit(5);

        if (usersError) {
            console.error('Users query error:', usersError);
            return NextResponse.json({
                success: false,
                test: 'users_query',
                error: usersError.message,
                details: usersError,
            }, { status: 500 });
        }

        // Test 3: Try to query the doctors table
        const { data: doctors, error: doctorsError } = await supabase
            .from('doctors')
            .select('did, uid')
            .limit(5);

        if (doctorsError) {
            console.error('Doctors query error:', doctorsError);
        }

        // Test 4: Try to query the patients table
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('pid, uid')
            .limit(5);

        if (patientsError) {
            console.error('Patients query error:', patientsError);
        }

        return NextResponse.json({
            success: true,
            message: 'Database connection successful!',
            tests: {
                supabase_initialized: true,
                users_count: users?.length || 0,
                doctors_count: doctors?.length || 0,
                patients_count: patients?.length || 0,
            },
            sample_data: {
                users: users || [],
                doctors: doctors || [],
                patients: patients || [],
            },
            errors: {
                doctors: doctorsError?.message || null,
                patients: patientsError?.message || null,
            }
        });

    } catch (error: any) {
        console.error('Database test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error occurred',
            stack: error.stack,
        }, { status: 500 });
    }
}
