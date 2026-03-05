import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const clinics = await sql`SELECT * FROM clinics ORDER BY clinic_name ASC`;

    return NextResponse.json({
      success: true,
      clinics: clinics || [],
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache', 'Expires': '0', 'Surrogate-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: error.message, clinics: [] }, { status: 500 });
  }
}
