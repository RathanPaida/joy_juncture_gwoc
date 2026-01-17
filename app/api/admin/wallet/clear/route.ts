import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { User, Transaction } from "@/models/User";

export async function POST(request: NextRequest) {
    try {
        // 1. Admin Authentication
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Check if user is admin (you might want to add a specific admin check here if 'admin' claim exists)
        // For now, assuming access to this route is protected by middleware or the admin panel logic.

        const { targetUserId, targetUserEmail } = await request.json();

        if (!targetUserId && !targetUserEmail) {
            return NextResponse.json(
                { error: "Target User ID or Email is required" },
                { status: 400 }
            );
        }

        await connectDb();

        // 2. Find the user
        const query = targetUserId
            ? { _id: targetUserId }
            : { email: targetUserEmail };

        const user = await User.findOne(query);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const oldBalance = user.walletBalance || 0;
        const oldPoints = user.totalPoints || 0;

        // 3. Update User (Clear Wallet)
        user.walletBalance = 0;
        user.totalPoints = 0;
        await user.save();

        // 4. Log Transaction (Adjustment)
        // Using user._id because the Transaction schema expects an ObjectId (ref: User)
        await Transaction.create({
            userId: user._id,
            type: 'redeem',
            amount: -oldBalance,
            description: `Admin cleared wallet (Reset from ${oldBalance})`,
            balanceAfter: 0,
            status: 'completed',
            metadata: {
                adminId: decodedToken.uid,
                reason: 'Admin Reset',
                previousPoints: oldPoints
            }
        });

        return NextResponse.json({
            success: true,
            message: `Wallet cleared for user ${user.email}`,
            previousBalance: oldBalance
        });

    } catch (error: any) {
        console.error("❌ Error clearing wallet:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
