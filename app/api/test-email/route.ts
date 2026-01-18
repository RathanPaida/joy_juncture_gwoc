export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const toEmail = searchParams.get('to') || 'paidarajarathan@gmail.com';

        const result = await sendEmail({
            to: toEmail,
            subject: 'Test Email from Joy Juncture',
            html: '<h1>It Works!</h1><p>If you are reading this, your email configuration is correct.</p>'
        });

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Email sent successfully!', messageId: result.messageId });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
