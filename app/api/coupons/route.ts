import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { verifyIdToken } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    console.log("API: /api/coupons HIT");
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        await verifyIdToken(token); // Just verify auth, no role check needed

        await connectDb();

        // Fetch active coupons that have coinsRequired > 0
        // Or just all active coupons if we want to show generic ones too?
        // For now, let's fetch active coupons.

        // Check search params if needed, but for wallet page we just want active ones
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const query: any = {};
        // if (status === "active") query.isActive = true;

        // We only want coupons that haven't expired
        // query.expiryDate = { $gt: new Date() }; // Temporarily disabled

        console.log("API: Querying coupons (ALL):", query);

        const coupons = await Coupon.find(query)
            .sort({ coinsRequired: -1, createdAt: -1 }) // Show high value first? Or match UI sort
            .lean();

        console.log(`API: Found ${coupons.length} coupons`);

        return NextResponse.json({ coupons });

    } catch (error) {
        console.error("Error fetching coupons:", error);
        return NextResponse.json(
            { error: "Failed to fetch coupons" },
            { status: 500 }
        );
    }
}
