import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const { getUser, isAuthenticated } = getKindeServerSession();

        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const kindeUser = await getUser();

        if (!kindeUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user exists in Supabase
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', kindeUser.id)
            .single();

        if (existingUser) {
            // Update last_login
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('uid', existingUser.uid);

            return NextResponse.json({ user: existingUser });
        }

        // Create new user in Supabase with doctor role
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                auth_id: kindeUser.id,
                email: kindeUser.email || '',
                name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || 'Doctor',
                role: 'doctor', // Doctor role for this portal
                is_verified: true,
                last_login: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        return NextResponse.json({ user: newUser, isNew: true });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
