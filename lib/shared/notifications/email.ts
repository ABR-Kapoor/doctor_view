import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

export async function sendEmail(options: EmailOptions) {
    try {
        // Using verified domain for sending emails
        const { to, subject, html, from = 'AuraSutra <noreply@sends.kapoorabeer.me>' } = options;

        const { data, error } = await resend.emails.send({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });

        if (error) {
            console.error('Email sending error:', error);
            return { success: false, error: error.message };
        }

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error: any) {
        console.error('Email sending exception:', error);
        return { success: false, error: error.message || 'Failed to send email' };
    }
}

export async function sendBulkEmails(emails: EmailOptions[]) {
    const results = await Promise.allSettled(
        emails.map(email => sendEmail(email))
    );

    return results.map((result, index) => ({
        email: emails[index].to,
        ...(result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' })
    }));
}
