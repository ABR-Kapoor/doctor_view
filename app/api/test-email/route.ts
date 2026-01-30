import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/shared/notifications/email';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('=== Email Test Started ===');
        console.log('Resend API Key exists:', !!process.env.RESEND_API_KEY);
        console.log('API Key (first 10 chars):', process.env.RESEND_API_KEY?.substring(0, 10));

        // Send a test email
        const result = await sendEmail({
            to: 'test@example.com', // Replace with your actual email to test
            subject: '🧪 Test Email from AuraSutra Doctor Portal',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Email System Working!</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>Success!</strong> Your email notification system is configured correctly.
              </div>
              <p>This is a test email from the AuraSutra notification system.</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>From:</strong> Doctor Portal (Port 3001)</p>
              <p>If you received this email, your notification system is working perfectly! 🎉</p>
            </div>
          </div>
        </body>
        </html>
      `
        });

        console.log('Email send result:', result);

        return NextResponse.json({
            success: result.success,
            message: result.success ? 'Test email sent successfully!' : 'Failed to send test email',
            details: result,
            instructions: 'Check your email inbox (and spam folder) for the test email. If using test@example.com, replace with your real email address in the code.'
        });

    } catch (error: any) {
        console.error('Email test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error',
            stack: error.stack
        }, { status: 500 });
    }
}
