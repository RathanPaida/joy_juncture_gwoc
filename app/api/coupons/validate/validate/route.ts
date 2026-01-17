// app/api/coupons/validate/route.ts - UPDATED
import { NextResponse } from 'next/server';
import { Coupon } from '@/models/Coupon';
import connectDb from '@/lib/mongodb';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { code, amount } = await request.json();
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;

        await connectDb();

        // Find coupon in Coupon collection
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
        }

        // Check if coupon is valid
        if (!coupon.isValid()) {
            if (!coupon.isActive) {
                return NextResponse.json({ error: 'Coupon is inactive' }, { status: 400 });
            }
            if (new Date() > coupon.expiryDate) {
                return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
            }
            if (coupon.usedCount >= coupon.usageLimit) {
                return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
            }
        }

        // Check if user can use this coupon
        if (!coupon.canUserUse(userId)) {
            const userUsage = coupon.usedBy.find((u: any) => u.userId === userId);
            return NextResponse.json({
                error: `You have already used this coupon ${userUsage?.usedCount || 0} time(s). Maximum usage per user is ${coupon.usagePerUser}.`
            }, { status: 400 });
        }

        // Check minimum purchase amount
        if (amount && amount < (coupon.minPurchaseAmount || 0)) {
            return NextResponse.json({
                error: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`
            }, { status: 400 });
        }

        // Calculate discount
        const discount = amount ? coupon.calculateDiscount(amount) : 0;

        return NextResponse.json({
            valid: true,
            discount,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscountAmount,
            minPurchase: coupon.minPurchaseAmount,
            coupon: {
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
                expiryDate: coupon.expiryDate,
                remainingUses: coupon.usageLimit - coupon.usedCount,
                userRemainingUses: coupon.usagePerUser - (coupon.usedBy.find((u: any) => u.userId === userId)?.usedCount || 0)
            }
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}