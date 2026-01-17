export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyIdToken } from "@/lib/firebase-admin";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

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

        // Find coupon in user's inventory
        const coupon = user.redeemedCoupons?.find((c: any) => c.code === code && !c.isUsed);

        if (!coupon) {
            return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 400 });
        }

        // Check expiry
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            discount: coupon.discountValue,
            type: coupon.discountType,
            message: `Coupon applied: ${coupon.name}`,
            couponId: coupon._id // Pass back to use when placing order
        });

    } catch (error: any) {
        console.error("Promo validation error:", error);
        return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
}
