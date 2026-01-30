import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Use service role key for prescriptions to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            pid,
            did,
            aid,
            diagnosis,
            symptoms,
            medicines,
            instructions,
            diet_advice,
            follow_up_date,
        } = body;

        if (!pid || !did || !diagnosis || !medicines || medicines.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('[API] Creating prescription with medicines:', JSON.stringify(medicines, null, 2));

        // Create prescription
        const { data, error } = await supabase
            .from('prescriptions')
            .insert({
                pid,
                did,
                aid: aid || null,
                diagnosis,
                symptoms: symptoms || [],
                medicines,
                instructions: instructions || null,
                diet_advice: diet_advice || null,
                follow_up_date: follow_up_date || null,
                ai_generated: false,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('[API] Error creating prescription:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log('[API] Prescription created:', data.prescription_id);

        // Send notifications to patient and doctor
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/notifications/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'prescription_created',
                    data: {
                        patientId: pid,
                        doctorId: did,
                        diagnosis,
                        medicines,
                        instructions,
                    }
                })
            });
        } catch (notifError) {
            console.error('Failed to send notification:', notifError);
            // Don't fail the prescription creation if notification fails
        }

        return NextResponse.json({
            success: true,
            prescription: data,
            message: 'Prescription created successfully',
        });
    } catch (error: any) {
        console.error('[API] Prescription creation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const did = searchParams.get('did');

        if (!did) {
            return NextResponse.json(
                { success: false, error: 'Doctor ID required' },
                { status: 400 }
            );
        }

        const { data: prescriptions, error } = await supabase
            .from('prescriptions')
            .select(`
        prescription_id,
        diagnosis,
        medicines,
        created_at,
        sent_to_patient,
        sent_at,
        patients (
          pid,
          city,
          state,
          users (
            name,
            email,
            profile_image_url
          )
        )
      `)
            .eq('did', did)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching prescriptions:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            prescriptions: prescriptions || [],
        });
    } catch (error: any) {
        console.error('[API] Prescriptions fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
