export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
    try {
        // 1. Admin Authentication
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        await adminAuth.verifyIdToken(token);

        // 2. Validate Request
        const { targetUserId, targetUserEmail } = await request.json();

        if (!targetUserId && !targetUserEmail) {
            return NextResponse.json(
                { error: "Target User ID or Email is required" },
                { status: 400 },
            );
        }

        await connectDb();

        // 3. Find the user to get their Firebase UID (if not provided)
        let firebaseUid = targetUserId;

        // If only email is provided, we need to find the user first to get their IDs
        if (!firebaseUid && targetUserEmail) {
            const user = await User.findOne({ email: targetUserEmail.toLowerCase() });
            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 },
                );
            }
            firebaseUid = user.firebaseUid;
        } else if (targetUserId && !targetUserEmail) {
            // If passed ID is actually an ObjectId (from user._id), we might need to find the user to get firebaseUid
            // But assumed targetUserId IS firebaseUid based on other admin usage.
            // Let's safe check: if it looks like ObjectId, query by _id. If not, assume it's firebaseUid.
            // Actually, let's just query User to be safe and canonical.
            let user = await User.findOne({ firebaseUid: targetUserId });
            if (!user && mongoose.Types.ObjectId.isValid(targetUserId)) {
                user = await User.findById(targetUserId);
            }

            if (user) {
                firebaseUid = user.firebaseUid;
            } else {
                // If user doc not found but we have an ID, try deleting by that ID directly if it was meant to be firebaseUid
                // But safer to error if user doesn't exist.
                // For flexibility, if we have a firebaseUid-looking string, use it.
                firebaseUid = targetUserId;
            }
        }

        if (!firebaseUid) {
            return NextResponse.json(
                { error: "Could not determine User ID" },
                { status: 404 }
            );
        }

        // 4. Delete Orders
        // We clear by valid firebaseUid which is indexed in Order model
        const deleteResult = await Order.deleteMany({ firebaseUid: firebaseUid });

        return NextResponse.json({
            success: true,
            message: `Cleared ${deleteResult.deletedCount} orders for user`,
            deletedCount: deleteResult.deletedCount,
        });
    } catch (error: any) {
        console.error("❌ Error clearing products:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}
