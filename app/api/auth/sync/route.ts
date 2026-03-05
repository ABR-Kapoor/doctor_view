import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();
    if (!kindeUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [existingUserByAuthId] = await sql`SELECT uid, email, role FROM users WHERE auth_id = ${kindeUser.id}`;
    if (existingUserByAuthId) {
      return NextResponse.json({ success: true, user: existingUserByAuthId, message: 'User already synced' });
    }

    const [existingUserByEmail] = await sql`SELECT uid, email, name, role, auth_id FROM users WHERE email = ${kindeUser.email}`;

    if (existingUserByEmail) {
      if (existingUserByEmail.auth_id) {
        return NextResponse.json({ error: 'This email is already linked to another authentication account' }, { status: 409 });
      }
      if (existingUserByEmail.role !== 'doctor') {
        return NextResponse.json({ error: `This email is registered as ${existingUserByEmail.role}. Please use the ${existingUserByEmail.role} portal.` }, { status: 400 });
      }

      const [linkedUser] = await sql`UPDATE users SET auth_id = ${kindeUser.id} WHERE uid = ${existingUserByEmail.uid} RETURNING *`;
      return NextResponse.json({ success: true, user: linkedUser, message: 'Doctor account linked successfully. Welcome!' });
    }

    const [newUser] = await sql`
      INSERT INTO users (auth_id, email, name, role, is_active, is_verified)
      VALUES (${kindeUser.id}, ${kindeUser.email || ''}, ${`${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || kindeUser.email || 'Doctor'}, 'doctor', true, false)
      RETURNING *
    `;

    const [doctorProfile] = await sql`SELECT did, clinic_id FROM doctors WHERE uid = ${newUser.uid}`;

    return NextResponse.json({ success: true, user: newUser, doctor: doctorProfile || null, message: 'Doctor account created successfully' });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
