
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { User, Transaction } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        await connectDb();

        const { couponId } = await request.json();

        if (!couponId) {
            return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
        }

        // 1. Get User
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2. Get Coupon
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
        }

        // 3. Validation
        if (!coupon.isActive) {
            return NextResponse.json({ error: "Coupon is inactive" }, { status: 400 });
        }
        if (new Date() > coupon.expiryDate) {
            return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
        }
        if (coupon.coinsRequired === undefined || coupon.coinsRequired === null || coupon.coinsRequired <= 0) {
            return NextResponse.json({
                error: `This coupon cannot be redeemed with points (Cost: ${coupon.coinsRequired})`
            }, { status: 400 });
        }

        // Check if user already redeemed
        const alreadyRedeemed = user.redeemedCoupons?.some(
            (c: any) => c.rewardId === coupon._id.toString()
        );

        if (alreadyRedeemed) {
            // NOTE: Depending on business rules, we might allow multiple redemptions.
            // For now, let's assume one unique coupon per user via redemption to keep it simple,
            // or check usagePerUser limit.
            // actually, usagePerUser is for USAGE at checkout. Redemption might be allowed multiple times if we generate unique codes,
            // but here we are using a static code. So one redemption per user makes sense for static codes.
            return NextResponse.json({ error: "You have already redeemed this coupon" }, { status: 400 });
        }

        // Check points
        if (user.totalPoints < coupon.coinsRequired) {
            return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
        }

        // 4. Execute Redemption
        // Deduct points
        user.totalPoints -= coupon.coinsRequired;

        // Add to redeemed list
        user.redeemedCoupons.push({
            rewardId: coupon._id.toString(),
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            discountAmount: coupon.discountValue,
            status: 'available',
            redeemedAt: new Date()
        });

        await user.save();

        // Log transaction
        await Transaction.create({
            userId: user._id,
            type: "redeem",
            amount: -coupon.coinsRequired,
            description: `Redeemed coupon: ${coupon.name}`,
            balanceAfter: user.totalPoints,
            status: "completed",
            metadata: {
                couponId: coupon._id,
                couponCode: coupon.code
            }
        });

        return NextResponse.json({
            success: true,
            message: "Coupon redeemed successfully",
            coupon: {
                code: coupon.code,
                name: coupon.name,
                description: coupon.description
            },
            newBalance: user.totalPoints
        });

    } catch (error: any) {
        console.error("Redemption error:", error);
        return NextResponse.json({ error: error.message || "Redemption failed" }, { status: 500 });
    }
}
