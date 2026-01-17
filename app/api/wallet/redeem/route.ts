// app/api/wallet/redeem/route.ts - CONFLICTS RESOLVED
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { verifyIdToken } from "@/lib/firebase-admin";
import { User, Transaction } from "@/models/User";
import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    points: { type: Number, required: true },
    category: { type: String, required: true },
    icon: { type: String, default: "FaGift" },
    color: { type: String, default: "#FF8C00" },
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

const Reward = mongoose.models.Reward || mongoose.model("Reward", rewardSchema);

export async function POST(req: NextRequest) {
    try {
        console.log("=== Processing Reward Redemption ===");

        // Verify authentication
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json(
                { error: "No authorization header" },
                { status: 401 },
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;

        await connectDb();

        // Get request body
        const { rewardId } = await req.json();

        if (!rewardId) {
            return NextResponse.json(
                { error: "Reward ID is required" },
                { status: 400 },
            );
        }

        // Find the reward
        const reward = await Reward.findById(rewardId);
        if (!reward) {
            return NextResponse.json({ error: "Reward not found" }, { status: 404 });
        }

        if (!reward.isActive) {
            return NextResponse.json(
                { error: "Reward is not available" },
                { status: 400 },
            );
        }

        if (reward.stock <= 0) {
            return NextResponse.json(
                { error: "Reward is out of stock" },
                { status: 400 },
            );
        }

        // Find user
        const user = await User.findOne({ firebaseUid: userId });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has already redeemed this reward
        const alreadyRedeemed = user.redeemedCoupons?.some(
            (c: any) => c.rewardId.toString() === rewardId
        );

        if (alreadyRedeemed) {
            return NextResponse.json(
                { error: "You have already redeemed this reward" },
                { status: 400 },
            );
        }

        // Check if user has enough points
        if (user.totalPoints < reward.points) {
            return NextResponse.json(
                {
                    error: "Insufficient points",
                    required: reward.points,
                    current: user.totalPoints,
                },
                { status: 400 },
            );
        }

        // Generate Coupon Code
        const couponCode = `JJ-${reward.category.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        let discountType: "fixed" | "percentage" = "fixed";
        let discountValue = 0;

        // Intelligent Parsing Logic
        const textToScan = `${reward.name} ${reward.description}`;

        // 1. Check for Percentage (e.g. "25% off", "50% Discount")
        const percentageMatch = textToScan.match(/(\d+)%\s*(?:off|discount|mega)/i);
        if (percentageMatch) {
            discountType = "percentage";
            discountValue = parseInt(percentageMatch[1]);
        }
        // 2. Check for Fixed Amount (e.g. "₹500 off", "Rs. 100")
        else {
            const amountMatch = textToScan.match(/(?:₹|Rs\.?|INR)\s*(\d+)/i);
            if (amountMatch) {
                discountType = "fixed";
                discountValue = parseInt(amountMatch[1]);
            } else {
                // 3. Fallback: 10 points = 1 INR
                discountValue = Math.floor(reward.points / 10);
                if (discountValue < 50) discountValue = 50; // Minimum fallback
            }
        }

        // Update User: Deduct points and Add Coupon atomically
        // Using findOneAndUpdate without transaction for better compatibility with non-replica set clusters (like simplified MongoDB Atlas free tier)
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: userId },
            {
                $inc: {
                    totalPoints: -reward.points,
                    walletBalance: -reward.points
                },
                $push: {
                    redeemedCoupons: {
                        rewardId: reward._id,
                        code: couponCode,
                        name: reward.name,
                        description: reward.description,
                        discountType: discountType,
                        discountValue: discountValue,
                        // Compatibility fields
                        discountAmount: discountValue,
                        minOrderAmount: 0,
                        isUsed: false,
                        status: 'available',
                        redeemedAt: new Date(),
                        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days validity
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error("Failed to update user data");
        }

        console.log("✅ User updated. New balance:", updatedUser.totalPoints);
        console.log("✅ New coupon count:", updatedUser.redeemedCoupons?.length || 0);

        // Decrease reward stock
        reward.stock -= 1;
        await reward.save();

        // Create transaction record
        try {
            await Transaction.create({
                userId: user._id, // Use _id for internal linkage if preferred, or ensure firebaseUid is consistent
                type: "redeem",
                amount: -reward.points,
                description: `Redeemed: ${reward.name}`,
                metadata: {
                    rewardId: reward._id,
                    rewardName: reward.name,
                    rewardCategory: reward.category,
                    couponCode: couponCode,
                },
                balanceAfter: updatedUser.totalPoints,
            });
        } catch (txError) {
            console.error("Failed to create transaction record:", txError);
            // Don't fail the request if just the log fails
        }

        console.log(
            `Redemption successful - User: ${user.email}, Reward: ${reward.name}, Code: ${couponCode}`,
        );

        return NextResponse.json({
            success: true,
            message: "Reward redeemed successfully",
            newBalance: updatedUser.totalPoints,
            couponCode: couponCode,
            reward: {
                name: reward.name,
                description: reward.description,
                code: couponCode, // Return code to frontend
            },
        });
    } catch (error: any) {
        console.error("Error redeeming reward:", error);
        return NextResponse.json(
            { error: error.message || "Failed to redeem reward" },
            { status: 500 },
        );
    }
}
