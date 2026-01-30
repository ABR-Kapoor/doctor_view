import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET: List all clinics for doctor selection
 * Public endpoint - doctors can see all available clinics
 */
export async function GET() {
  try {
    const { data: clinics, error } = await supabaseAdmin
      .from('clinics')
      .select('clinic_id, clinic_name, city, state, country, is_verified')
      .order('clinic_name', { ascending: true });

    if (error) {
      console.error('Error fetching clinics:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      clinics: clinics || [] 
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
