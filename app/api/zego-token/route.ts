import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Server-side ZegoCloud token generation
// Based on: https://www.zegocloud.com/docs/uikit/callkit-react/quick-start-(with-call-invitation)

export async function POST(request: NextRequest) {
    try {
        const { roomID, userID, userName } = await request.json();

        if (!roomID || !userID || !userName) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID!);
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET!;

        if (!appID || !serverSecret) {
            console.error('[ZEGO TOKEN] Missing credentials');
            return NextResponse.json(
                { success: false, error: 'ZegoCloud credentials not configured' },
                { status: 500 }
            );
        }

        // Generate token using ZegoCloud algorithm
        const token = generateToken04(appID, userID, serverSecret, 3600, '');

        console.log('[ZEGO TOKEN] Generated token for:', { roomID, userID, userName });

        return NextResponse.json({
            success: true,
            token,
            appID,
            userID,
            userName,
            roomID,
        });
    } catch (error: any) {
        console.error('[ZEGO TOKEN] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ZegoCloud Token Generation Algorithm (Token04)
// Reference: https://www.zegocloud.com/docs/uikit/callkit-react/authentication-and-kit-token
function generateToken04(
    appId: number,
    userId: string,
    secret: string,
    effectiveTimeInSeconds: number,
    payload: string
): string {
    // Create header
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };

    // Create payload
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenPayload = {
        app_id: appId,
        user_id: userId,
        nonce: Math.floor(Math.random() * 2147483647),
        ctime: currentTime,
        expire: currentTime + effectiveTimeInSeconds,
        payload: payload || '',
    };

    // Encode header and payload
    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(tokenPayload));

    // Create signature
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(signatureInput)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    // Combine to create token
    const token = `${headerEncoded}.${payloadEncoded}.${signature}`;

    return token;
}

function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
