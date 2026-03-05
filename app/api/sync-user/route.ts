import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import sql from '@/lib/db';

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

        const [existingUser] = await sql`SELECT * FROM users WHERE auth_id = ${kindeUser.id}`;

        if (existingUser) {
            await sql`
                UPDATE users SET last_login = ${new Date().toISOString()}, role = 'doctor'
                WHERE uid = ${existingUser.uid}
            `;

            const [updatedUser] = await sql`SELECT * FROM users WHERE uid = ${existingUser.uid}`;
            return NextResponse.json({ user: updatedUser || existingUser });
        }

        const [newUser] = await sql`
            INSERT INTO users (auth_id, email, name, role, is_verified, last_login)
            VALUES (${kindeUser.id}, ${kindeUser.email || ''}, ${`${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || 'Doctor'}, 'doctor', true, ${new Date().toISOString()})
            RETURNING *
        `;

        return NextResponse.json({ user: newUser, isNew: true });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
