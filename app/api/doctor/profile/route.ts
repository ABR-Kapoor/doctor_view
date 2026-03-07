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

        return NextResponse.json({ success: true, user, doctor: doctorWithImage }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
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
            try {
                await sql`
                    UPDATE users
                    SET name = ${user.name ?? null},
                        phone = ${user.phone ?? null},
                        profile_image_url = ${user.profile_image_url && user.profile_image_url.trim() ? user.profile_image_url : null}
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
                            specialization = ${doctor.specialization !== undefined ? doctor.specialization : null},
                            custom_specializations = ${doctor.custom_specializations !== undefined ? doctor.custom_specializations : null},
                            qualification = ${doctor.qualification !== undefined ? doctor.qualification : null},
                            registration_number = ${regNum !== undefined ? regNum : null},
                            years_of_experience = ${doctor.years_of_experience !== undefined ? doctor.years_of_experience : null},
                            consultation_fee = ${doctor.consultation_fee !== undefined ? doctor.consultation_fee : null},
                            bio = ${doctor.bio !== undefined ? doctor.bio : null},
                            clinic_id = ${doctor.clinic_id !== undefined ? doctor.clinic_id : null},
                            clinic_name = ${!doctor.clinic_id ? (doctor.clinic_name !== undefined ? doctor.clinic_name : null) : null},
                            address_line1 = ${doctor.address_line1 !== undefined ? doctor.address_line1 : null},
                            address_line2 = ${doctor.address_line2 !== undefined ? doctor.address_line2 : null},
                            city = ${doctor.city !== undefined ? doctor.city : null},
                            state = ${doctor.state !== undefined ? doctor.state : null},
                            postal_code = ${doctor.postal_code !== undefined ? doctor.postal_code : null},
                            languages = ${doctor.languages !== undefined ? doctor.languages : null}
                        WHERE uid = ${uid}
                    `;
                } else {
                    await sql`
                        INSERT INTO doctors (uid, specialization, custom_specializations, qualification, registration_number, years_of_experience, consultation_fee, bio, clinic_id, clinic_name, address_line1, address_line2, city, state, postal_code, languages)
                        VALUES (${uid}, ${doctor.specialization !== undefined ? doctor.specialization : null}, ${doctor.custom_specializations !== undefined ? doctor.custom_specializations : null}, ${doctor.qualification !== undefined ? doctor.qualification : null}, ${regNum !== undefined ? regNum : null}, ${doctor.years_of_experience !== undefined ? doctor.years_of_experience : null}, ${doctor.consultation_fee !== undefined ? doctor.consultation_fee : null}, ${doctor.bio !== undefined ? doctor.bio : null}, ${doctor.clinic_id !== undefined ? doctor.clinic_id : null}, ${!doctor.clinic_id ? (doctor.clinic_name !== undefined ? doctor.clinic_name : null) : null}, ${doctor.address_line1 !== undefined ? doctor.address_line1 : null}, ${doctor.address_line2 !== undefined ? doctor.address_line2 : null}, ${doctor.city !== undefined ? doctor.city : null}, ${doctor.state !== undefined ? doctor.state : null}, ${doctor.postal_code !== undefined ? doctor.postal_code : null}, ${doctor.languages !== undefined ? doctor.languages : null})
                    `;
                }
            } catch (e: any) {
                if (e.code === '23505' && e.message?.includes('registration_number')) {
                    return NextResponse.json({ error: 'This registration number is already registered to another doctor.' }, { status: 400 });
                }
                throw e;
            }
        }

        return NextResponse.json({ success: true, message: 'Profile updated successfully' }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
    }
}
