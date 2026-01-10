// app/api/wallet/daily-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { User, Transaction } from "@/models/User";
import { calculateLevel } from "@/lib/levelHelper"; // Import level calculator

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Daily login request received");

    await connectDb();
    console.log("✅ Database connected");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ No auth header");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);
    console.log("✅ Token verified for user:", decodedToken.uid);

    // Find user by Firebase UID or email
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.findOne({ email: decodedToken.email?.toLowerCase() });
    }

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Wallet not found. Please refresh the page." },
        { status: 404 },
      );
    }

    // Get current date at midnight (start of today)
    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    // Get tomorrow midnight (when reward resets)
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

    // Get last login date at midnight
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const lastLoginMidnight = lastLogin ? new Date(lastLogin) : null;
    if (lastLoginMidnight) {
      lastLoginMidnight.setHours(0, 0, 0, 0);
    }

    console.log("Current time:", now);
    console.log("Today midnight:", todayMidnight);
    console.log("Last login:", lastLogin);
    console.log("Last login midnight:", lastLoginMidnight);

    // Check if user already claimed today's reward
    // User can only claim once per calendar day (from 12:00 AM to 11:59 PM)
    if (
      lastLoginMidnight &&
      lastLoginMidnight.getTime() === todayMidnight.getTime()
    ) {
      console.log("❌ Already claimed today");

      // Calculate time until next claim (tomorrow at midnight)
      const timeUntilNextClaim = tomorrowMidnight.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeUntilNextClaim / (1000 * 60 * 60));
      const minutesLeft = Math.floor(
        (timeUntilNextClaim % (1000 * 60 * 60)) / (1000 * 60),
      );

      return NextResponse.json(
        {
          success: false,
          error: `Daily reward already claimed today! Come back in ${hoursLeft}h ${minutesLeft}m`,
          canClaimAt: tomorrowMidnight,
          alreadyClaimed: true,
          timeRemaining: {
            hours: hoursLeft,
            minutes: minutesLeft,
            milliseconds: timeUntilNextClaim,
          },
        },
        { status: 400 },
      );
    }

    // Calculate streak
    // Get yesterday's midnight
    const yesterdayMidnight = new Date(todayMidnight);
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

    let newStreak = 1;
    let streakMessage = "";

    if (lastLoginMidnight) {
      // Check if last login was yesterday (consecutive day)
      if (lastLoginMidnight.getTime() === yesterdayMidnight.getTime()) {
        newStreak = (user.streak || 0) + 1;
        streakMessage = ` 🔥 ${newStreak} day streak!`;
        console.log("✅ Consecutive login! New streak:", newStreak);
      } else {
        // Streak broken - reset to 1
        streakMessage = " ⚠️ Streak reset!";
        console.log("🔄 Streak reset to 1");
      }
    } else {
      // First time claiming
      streakMessage = " 🎉 First daily login!";
      console.log("🎊 First daily login for user");
    }

    // Calculate points (base + streak bonus)
    const basePoints = 10;
    const streakBonus = Math.min(Math.floor(newStreak / 5) * 10, 50); // 10 bonus per 5 days, max 50
    const totalPoints = basePoints + streakBonus;

    console.log("Points calculation:", {
      basePoints,
      streakBonus,
      totalPoints,
      newStreak,
    });

    // Update user points, streak, last login, and LEVEL
    const newTotalPoints = (user.totalPoints || 0) + totalPoints;
    const newLevel = calculateLevel(newTotalPoints);
    const leveledUp = newLevel > (user.level || 1);

    user.totalPoints = newTotalPoints;
    user.level = newLevel; // Auto-update level
    user.streak = newStreak;
    user.lastLogin = now; // Save actual login time
    user.lastActivity = now;

    await user.save();

    // Create transaction log
    const transaction = new Transaction({
      userId: user._id,
      type: "daily",
      amount: totalPoints,
      description: `Daily login reward (Day ${newStreak})${streakBonus > 0 ? ` +${streakBonus} streak bonus` : ""}${streakMessage}${leveledUp ? ` 🎉 LEVEL UP to ${newLevel}!` : ""}`,
      metadata: {
        streak: newStreak,
        basePoints: basePoints,
        streakBonus: streakBonus,
        leveledUp: leveledUp,
        newLevel: newLevel,
        claimedAt: now,
        nextClaimAt: tomorrowMidnight,
      },
      balanceAfter: user.totalPoints,
      status: "completed",
    });

    await transaction.save();

    console.log("✅ Daily reward claimed successfully");

    return NextResponse.json({
      success: true,
      message: `🎁 Daily reward claimed! +${totalPoints} points!${streakMessage}${leveledUp ? `\n\n🎉 LEVEL UP! You reached Level ${newLevel}!` : ""}`,
      points: totalPoints,
      streak: newStreak,
      newBalance: user.totalPoints,
      level: newLevel,
      leveledUp: leveledUp,
      nextClaimAt: tomorrowMidnight,
      transaction: {
        _id: transaction._id,
        amount: totalPoints,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Error claiming daily reward:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to claim daily reward",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check if user can claim daily reward
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);

    // Find user
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.findOne({ email: decodedToken.email?.toLowerCase() });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if can claim
    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const lastLoginMidnight = lastLogin ? new Date(lastLogin) : null;
    if (lastLoginMidnight) {
      lastLoginMidnight.setHours(0, 0, 0, 0);
    }

    const canClaim =
      !lastLoginMidnight ||
      lastLoginMidnight.getTime() !== todayMidnight.getTime();

    let timeRemaining = null;
    if (!canClaim) {
      const timeUntilNextClaim = tomorrowMidnight.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeUntilNextClaim / (1000 * 60 * 60));
      const minutesLeft = Math.floor(
        (timeUntilNextClaim % (1000 * 60 * 60)) / (1000 * 60),
      );

      timeRemaining = {
        hours: hoursLeft,
        minutes: minutesLeft,
        milliseconds: timeUntilNextClaim,
        nextClaimAt: tomorrowMidnight,
      };
    }

    return NextResponse.json({
      success: true,
      canClaim: canClaim,
      currentStreak: user.streak || 0,
      lastClaim: lastLogin,
      nextClaimAt: canClaim ? null : tomorrowMidnight,
      timeRemaining: timeRemaining,
      userStats: {
        points: user.totalPoints || 0,
        level: user.level || 1,
        streak: user.streak || 0,
      },
    });
  } catch (error: any) {
    console.error("Error checking daily reward status:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
