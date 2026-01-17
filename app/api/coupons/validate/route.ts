// app/api/coupons/validate/route.ts
import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import connectDb from '@/lib/mongodb';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);

        await connectDb();
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if code exists in user's redeemed coupons
        const coupon = user.redeemedCoupons?.find((c: any) => c.code === code);

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
        }

        if (coupon.status !== 'available') {
            return NextResponse.json({ error: 'Coupon already used' }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            discount: coupon.discountAmount || 10, // Default to 10 if not set, or calculated from points
            type: 'fixed', // or percentage
            coupon: {
                code: coupon.code,
                name: coupon.name
            }
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
