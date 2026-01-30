import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Get user and doctor data
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('uid', uid)
            .single();

        const { data: doctor } = await supabase
            .from('doctors')
            .select('*')
            .eq('uid', uid)
            .single();

        // Combine user's profile_image_url with doctor data
        const doctorWithImage = doctor ? {
            ...doctor,
            profile_image_url: user?.profile_image_url || null
        } : null;

        return NextResponse.json({
            success: true,
            user,
            doctor: doctorWithImage,
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { uid, user, doctor } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Update user table
        if (user) {
            // Build update object dynamically to avoid unnecessary updates
            const updateData: any = {
                name: user.name,
            };

            // Only include phone if provided and not empty
            if (user.phone && user.phone.trim() !== '') {
                updateData.phone = user.phone;
            }

            // Only include profile_image_url if provided
            if (user.profile_image_url !== undefined) {
                updateData.profile_image_url = user.profile_image_url;
            }

            const { error: userError } = await supabase
                .from('users')
                .update(updateData)
                .eq('uid', uid);

            if (userError) {
                // Handle duplicate phone error with friendly message
                if (userError.code === '23505' && userError.message.includes('phone')) {
                    return NextResponse.json({ 
                        error: 'This phone number is already registered to another user.' 
                    }, { status: 400 });
                }
                throw userError;
            }
        }

        // Update or create doctor record
        if (doctor) {
            const { data: existingDoctor } = await supabase
                .from('doctors')
                .select('did')
                .eq('uid', uid)
                .single();

            if (existingDoctor) {
                // Update existing doctor
                const { error: doctorError } = await supabase
                    .from('doctors')
                    .update({
                        specialization: doctor.specialization, // Array of specializations
                        custom_specializations: doctor.custom_specializations, // Custom SEO keywords
                        qualification: doctor.qualification,
                        registration_number: doctor.registration_number,
                        years_of_experience: doctor.years_of_experience,
                        consultation_fee: doctor.consultation_fee,
                        bio: doctor.bio,
                        clinic_id: doctor.clinic_id, // Allow doctors to select/change their clinic
                        clinic_name: doctor.clinic_name,
                        address_line1: doctor.address_line1,
                        address_line2: doctor.address_line2,
                        city: doctor.city,
                        state: doctor.state,
                        postal_code: doctor.postal_code,
                        languages: doctor.languages,
                    })
                    .eq('uid', uid);

                if (doctorError) throw doctorError;
            } else {
                // Create new doctor record
                const { error: createError } = await supabase
                    .from('doctors')
                    .insert({
                        uid,
                        ...doctor,
                    });

                if (createError) throw createError;
            }
        }

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
