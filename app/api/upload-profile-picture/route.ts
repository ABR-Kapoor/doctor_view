import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sql from '@/lib/db';

// Keep Supabase client ONLY for Storage (S3 bucket) operations
const supabaseStorage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const uid = formData.get('uid') as string;

        if (!file || !uid) {
            return NextResponse.json({ error: 'File and UID required' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${uid}-${Date.now()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage (S3 bucket - kept as-is)
        const { data: uploadData, error: uploadError } = await supabaseStorage.storage
            .from('avatars')
            .upload(filePath, buffer, { contentType: file.type, upsert: true });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
        }

        const { data: urlData } = supabaseStorage.storage.from('avatars').getPublicUrl(filePath);
        const publicUrl = urlData.publicUrl;

        // Update user's profile_image_url using postgres.js (Neon)
        await sql`UPDATE users SET profile_image_url = ${publicUrl} WHERE uid = ${uid}`;

        return NextResponse.json({ success: true, url: publicUrl, message: 'Profile picture updated successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
    }
}
