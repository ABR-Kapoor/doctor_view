import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const [user] = await sql`SELECT * FROM users WHERE uid = ${uid}`;

        const [doctor] = await sql`
            SELECT d.*, c.clinic_id as c_clinic_id, c.clinic_name as c_clinic_name, c.city as c_city, c.state as c_state
            FROM doctors d
            LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
            WHERE d.uid = ${uid}
        `;

        const doctorWithImage = doctor ? {
            ...doctor,
            profile_image_url: user?.profile_image_url || null,
            clinic_name: doctor.c_clinic_name || doctor.clinic_name || '',
            clinics: doctor.c_clinic_id ? { clinic_id: doctor.c_clinic_id, clinic_name: doctor.c_clinic_name, city: doctor.c_city, state: doctor.c_state } : null
        } : null;

        return NextResponse.json({ success: true, user, doctor: doctorWithImage });
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

        if (user) {
            const phone = user.phone && user.phone.trim() !== '' ? user.phone : null;
            try {
                await sql`
                    UPDATE users
                    SET name = ${user.name},
                        phone = COALESCE(${phone}, phone),
                        profile_image_url = COALESCE(${user.profile_image_url ?? null}, profile_image_url)
                    WHERE uid = ${uid}
                `;
            } catch (e: any) {
                if (e.code === '23505' && e.message?.includes('phone')) {
                    return NextResponse.json({ error: 'This phone number is already registered to another user.' }, { status: 400 });
                }
                throw e;
            }
        }

        if (doctor) {
            const [existingDoctor] = await sql`SELECT did FROM doctors WHERE uid = ${uid}`;
            const regNum = doctor.registration_number && doctor.registration_number.trim() !== '' ? doctor.registration_number : null;

            try {
                if (existingDoctor) {
                    await sql`
                        UPDATE doctors SET
                            specialization = ${doctor.specialization || null},
                            custom_specializations = ${doctor.custom_specializations || null},
                            qualification = ${doctor.qualification || null},
                            registration_number = ${regNum},
                            years_of_experience = ${doctor.years_of_experience || null},
                            consultation_fee = ${doctor.consultation_fee || null},
                            bio = ${doctor.bio || null},
                            clinic_id = ${doctor.clinic_id || null},
                            clinic_name = ${!doctor.clinic_id ? (doctor.clinic_name || null) : null},
                            address_line1 = ${doctor.address_line1 || null},
                            address_line2 = ${doctor.address_line2 || null},
                            city = ${doctor.city || null},
                            state = ${doctor.state || null},
                            postal_code = ${doctor.postal_code || null},
                            languages = ${doctor.languages || null}
                        WHERE uid = ${uid}
                    `;
                } else {
                    await sql`
                        INSERT INTO doctors (uid, specialization, custom_specializations, qualification, registration_number, years_of_experience, consultation_fee, bio, clinic_id, clinic_name, address_line1, address_line2, city, state, postal_code, languages)
                        VALUES (${uid}, ${doctor.specialization || null}, ${doctor.custom_specializations || null}, ${doctor.qualification || null}, ${regNum}, ${doctor.years_of_experience || null}, ${doctor.consultation_fee || null}, ${doctor.bio || null}, ${doctor.clinic_id || null}, ${doctor.clinic_name || null}, ${doctor.address_line1 || null}, ${doctor.address_line2 || null}, ${doctor.city || null}, ${doctor.state || null}, ${doctor.postal_code || null}, ${doctor.languages || null})
                    `;
                }
            } catch (e: any) {
                if (e.code === '23505' && e.message?.includes('registration_number')) {
                    return NextResponse.json({ error: 'This registration number is already registered to another doctor.' }, { status: 400 });
                }
                throw e;
            }
        }

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
    }
}
