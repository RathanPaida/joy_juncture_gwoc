// app/api/user/addCoins/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDb } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  console.log("🔵 POST /api/user/addCoins - Request received");

  try {
    const authHeader = req.headers.get("authorization");
    console.log("🔑 Authorization header present:", !!authHeader);

    await connectDb();
    console.log("✅ Database connected");

    const body = await req.json();
    console.log("📥 Request body:", body);

    const { userId, coinsToAdd } = body;

    if (!userId || typeof coinsToAdd !== "number") {
      console.error("❌ Invalid parameters:", { userId, coinsToAdd, typeOfCoins: typeof coinsToAdd });
      return NextResponse.json({
        success: false,
        error: "Missing or invalid parameters. Expected userId (string) and coinsToAdd (number)"
      }, { status: 400 });
    }

    console.log("🔍 Looking for user with ID:", userId);
    const user = await User.findById(userId);

    if (!user) {
      console.error("❌ User not found with ID:", userId);
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }

    console.log("✅ User found:", {
      id: user._id,
      name: user.name,
      currentTotalPoints: user.totalPoints,
      currentUserPoints: user.userPoints
    });

    // UPDATE: Use totalPoints to match daily login behavior
    const oldPoints = user.totalPoints || 0;
    user.totalPoints = oldPoints + coinsToAdd;
    user.lastActivity = new Date(); // Also update last activity

    console.log("💰 Updating user points:", {
      oldPoints,
      coinsToAdd,
      newPoints: user.totalPoints
    });

    await user.save();
    console.log("✅ User saved successfully");

    // Fetch the user again to verify the save
    const verifyUser = await User.findById(userId);
    console.log("🔍 Verification - User after save:", {
      totalPoints: verifyUser?.totalPoints,
      userPoints: verifyUser?.userPoints
    });

    return NextResponse.json({
      success: true,
      totalPoints: user.totalPoints,  // Return totalPoints
      userPoints: user.totalPoints,   // Also return as userPoints for compatibility
      coinsAdded: coinsToAdd,
      previousPoints: oldPoints
    });
  } catch (err: any) {
    console.error("❌ Error in addCoins API:", err);
    console.error("Error stack:", err.stack);
    return NextResponse.json({
      success: false,
      error: err.message || "Internal server error"
    }, { status: 500 });
  }
}