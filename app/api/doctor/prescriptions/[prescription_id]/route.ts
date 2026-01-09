import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
    request: NextRequest,
    { params }: { params: { prescription_id: string } }
) {
    try {
        const { prescription_id } = params;

        if (!prescription_id) {
            return NextResponse.json(
                { success: false, error: 'Prescription ID required' },
                { status: 400 }
            );
        }

        // Soft delete - just mark as inactive
        const { error } = await supabase
            .from('prescriptions')
            .update({ is_active: false })
            .eq('prescription_id', prescription_id);

        if (error) {
            console.error('[API] Error deleting prescription:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log('[API] Prescription deleted:', prescription_id);

        return NextResponse.json({
            success: true,
            message: 'Prescription deleted successfully',
        });
    } catch (error: any) {
        console.error('[API] Delete prescription error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { prescription_id: string } }
) {
    try {
        const { prescription_id } = params;
        const body = await request.json();

        if (!prescription_id) {
            return NextResponse.json(
                { success: false, error: 'Prescription ID required' },
                { status: 400 }
            );
        }

        const {
            diagnosis,
            symptoms,
            medicines,
            instructions,
            diet_advice,
            follow_up_date,
        } = body;

        // Update prescription
        const { data, error } = await supabase
            .from('prescriptions')
            .update({
                diagnosis,
                symptoms: symptoms || [],
                medicines,
                instructions: instructions || null,
                diet_advice: diet_advice || null,
                follow_up_date: follow_up_date || null,
                updated_at: new Date().toISOString(),
            })
            .eq('prescription_id', prescription_id)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating prescription:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        console.log('[API] Prescription updated:', prescription_id);

        return NextResponse.json({
            success: true,
            prescription: data,
            message: 'Prescription updated successfully',
        });
    } catch (error: any) {
        console.error('[API] Update prescription error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
