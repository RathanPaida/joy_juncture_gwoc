export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        console.log(`🔐 Sending OTP to ${email}`);

        const emailSent = await sendOTPEmail(email, otp);

        if (emailSent) {
            return NextResponse.json({ success: true, message: 'OTP sent successfully' });
        } else {
            console.error('❌ Failed to send OTP email (sendOTPEmail returned false)');
            return NextResponse.json(
                { error: 'Failed to send OTP email' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('❌ Error in /api/auth/send-otp:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
