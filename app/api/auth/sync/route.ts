import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Sync Kinde user to our database for doctor_view app
 * Handles both new doctor signups and linking existing doctor records
 */
export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();
    
    if (!kindeUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists by auth_id
    const { data: existingUserByAuthId } = await supabaseAdmin
      .from('users')
      .select('uid, email, role')
      .eq('auth_id', kindeUser.id)
      .maybeSingle();

    if (existingUserByAuthId) {
      // User already synced
      return NextResponse.json({ 
        success: true, 
        user: existingUserByAuthId,
        message: 'User already synced'
      });
    }

    // Check if user exists by email (created by clinic but not yet linked)
    const { data: existingUserByEmail } = await supabaseAdmin
      .from('users')
      .select('uid, email, name, role, auth_id')
      .eq('email', kindeUser.email)
      .maybeSingle();

    if (existingUserByEmail) {
      // User exists with this email
      if (existingUserByEmail.auth_id) {
        // Already linked to different auth account
        console.warn('User exists with different auth_id:', existingUserByEmail);
        return NextResponse.json({ 
          error: 'This email is already linked to another authentication account' 
        }, { status: 409 });
      }

      // Check if this user is a doctor
      if (existingUserByEmail.role !== 'doctor') {
        return NextResponse.json({ 
          error: `This email is registered as ${existingUserByEmail.role}. Please use the ${existingUserByEmail.role} portal.` 
        }, { status: 400 });
      }

      // Link the Kinde auth_id to existing doctor user
      const { data: linkedUser, error: linkError } = await supabaseAdmin
        .from('users')
        .update({ auth_id: kindeUser.id })
        .eq('uid', existingUserByEmail.uid)
        .select()
        .single();

      if (linkError) {
        console.error('Error linking auth_id:', linkError);
        return NextResponse.json({ error: linkError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        user: linkedUser,
        message: 'Doctor account linked successfully. Welcome!'
      });
    }

    // No existing user - create new doctor user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: kindeUser.id,
        email: kindeUser.email || '',
        name: `${kindeUser.given_name || ''} ${kindeUser.family_name || ''}`.trim() || kindeUser.email || 'Doctor',
        role: 'doctor',
        is_active: true,
        is_verified: false
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Doctor profile should be auto-created by database trigger
    // Check if it was created
    const { data: doctorProfile } = await supabaseAdmin
      .from('doctors')
      .select('did, clinic_id')
      .eq('uid', newUser.uid)
      .maybeSingle();

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      doctor: doctorProfile,
      message: 'Doctor account created successfully'
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
