import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { createNhostClient, withAdminSession } from '@nhost/nhost-js';

const NHOST_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!;

const nhost = createNhostClient({
    subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'ynwkhelqhehjlxlhhjfj',
    region: process.env.NEXT_PUBLIC_NHOST_REGION || 'ap-south-1',
    configure: [
        withAdminSession({
            adminSecret: NHOST_ADMIN_SECRET,
            role: 'admin'
        })
    ]
});

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

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const nhostFile = new File([buffer], fileName, { type: file.type });

        // Upload to Nhost Storage using the Nhost client v4 API
        const { body } = await nhost.storage.uploadFiles({
            'file[]': [nhostFile],
            'bucket-id': 'avatars',
        });

        const fileMetadata = body.processedFiles[0];

        if (!fileMetadata) {
            return NextResponse.json({ error: 'Failed to upload file to Nhost Storage' }, { status: 500 });
        }

        const fileId = fileMetadata.id;
        const storageUrl = nhost.storage.baseURL;
        const publicUrl = `${storageUrl}/files/${fileId}`;

        // Update user's profile_image_url in Nhost Postgres (via postgres.js)
        await sql`UPDATE users SET profile_image_url = ${publicUrl} WHERE uid = ${uid}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            message: 'Profile picture updated successfully',
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error.body?.error?.message || error.message || 'Failed to upload profile picture';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
