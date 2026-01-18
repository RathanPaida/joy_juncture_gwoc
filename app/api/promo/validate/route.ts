export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyIdToken } from "@/lib/firebase-admin";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const { code, amount } = await req.json();

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const authHeader = req.headers.get("authorization");
        // Optional: allow creating validation without auth (e.g. generic promos), 
        // but for "User Coupons" we need to check the specific user's coupons.
        // However, if the code is unique globally, we could search all users? 
        // No, coupons are tied to the user who redeemed them usually. 
        // BUT generic promos (e.g. SAVE20) are stored elsewhere.

        // For now, checks User's specific coupons if auth provided.

        let userId = null;
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.replace("Bearer ", "");
            try {
                const decoded = await verifyIdToken(token);
                userId = decoded.uid;
            } catch (e) {
                // Invalid token
            }
        }

        await connectDb();

        // Check generic promos here (hardcoded for now as fallback)
        if (code.toUpperCase() === "WELCOME50") {
            return NextResponse.json({
                success: true,
                discount: 50,
                type: "fixed",
                message: "Welcome bonus applied!"
            });
        }

        if (!userId) {
            return NextResponse.json({ error: "Please login to use personal coupons" }, { status: 401 });
        }

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find coupon in user's inventory to verify ownership/usage
        // We match by code.
        const userCouponEntry = user.redeemedCoupons?.find((c: any) => c.code === code && !c.isUsed);

        // Also check if it's a generic public coupon (not in redeemed list)
        // If not found in user list, check Coupon collection directly for public coupons?
        // But for "Exclusive" (redeemed) coupons, it MUST be in user list.

        let couponDoc = null;

        if (userCouponEntry) {
            // It's a redeemed coupon. Fetch fresh data from Coupon collection using rewardId
            // This fixes issues where redeemed data has missing fields (like discountType or discountValue)
            if (userCouponEntry.rewardId) {
                const { Coupon } = require("@/models/Coupon"); // Lazy load model
                couponDoc = await Coupon.findById(userCouponEntry.rewardId);
            }

            // If rewardId lookup failed (old data?), try finding by code
            if (!couponDoc) {
                const { Coupon } = require("@/models/Coupon");
                couponDoc = await Coupon.findOne({ code: code });
            }
        } else {
            // Not in user list. Check if it's a general public coupon.
            const { Coupon } = require("@/models/Coupon");
            couponDoc = await Coupon.findOne({ code: code, category: { $ne: 'exclusive' } });
            // Assuming 'exclusive' or similar marks point-redeemed coupons. 
            // Actually, simply checking if it requires coins > 0 might be enough?
            // If it requires coins and is NOT in user list, fail.

            if (couponDoc && couponDoc.coinsRequired > 0) {
                return NextResponse.json({
                    error: `This coupon must be redeemed with ${couponDoc.coinsRequired} Joy Points first.`
                }, { status: 400 });
            }
        }

        if (!couponDoc) {
            return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });
        }

        // Validate Validation Logic using Coupon Model methods
        if (!couponDoc.isValid()) {
            // Specific error messages
            if (!couponDoc.isActive) return NextResponse.json({ error: "Coupon is inactive" }, { status: 400 });
            if (new Date() > couponDoc.expiryDate) return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
            if (couponDoc.usedCount >= couponDoc.usageLimit) return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
        }

        // Check user usage limit (if public) or if userCouponEntry (if redeemed)
        // If redeemed, we already checked !isUsed on the entry.
        // But we should also check usagePerUser on the doc just in case.
        if (!couponDoc.canUserUse(userId)) {
            return NextResponse.json({ error: "Usage limit exceeded for this coupon" }, { status: 400 });
        }

        // Valid! Calculate discount.
        // Amount is already destructured at the top.

        console.log(`[PromoValidate] Code: ${code}, Type: ${couponDoc.discountType}, Value: ${couponDoc.discountValue}, Amount: ${amount}`);

        let discount = 0;
        if (amount !== undefined && amount !== null) {
            discount = couponDoc.calculateDiscount(amount);
        } else {
            // If no amount passed, return just value (if fixed) or 0? 
            // Frontend expects a discount value to display.
            // If it's fixed, we can return it. If percentage, we need amount.
            if (couponDoc.discountType === 'fixed') {
                discount = couponDoc.discountValue;
            } else {
                // Return 0 or maybe a 'preview' like "10%"?
                // Current frontend logic expects specific number.
                // We will fix frontend to send amount.
                discount = 0;
            }
        }

        return NextResponse.json({
            success: true,
            discount: discount,
            type: couponDoc.discountType,
            discountValue: couponDoc.discountValue, // Passing raw value too for UI reference
            message: `Coupon applied: ${couponDoc.name}`,
            couponId: couponDoc._id
        });

    } catch (error: any) {
        console.error("Promo validation error:", error);
        return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
}
