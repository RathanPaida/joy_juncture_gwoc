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

    // Get last daily claim date at midnight
    // Use lastDailyClaim if available, otherwise fallback to lastLogin for backward compatibility (one-time)
    // But since we want strict checking now, we primarily check lastDailyClaim.
    // If lastDailyClaim is missing, it means the user hasn't claimed under the new system yet.
    // However, to prevent double claiming if they just claimed under the old system (lastLogin == today), we check that too.

    const lastClaim = user.lastDailyClaim ? new Date(user.lastDailyClaim) : null;
    const lastClaimMidnight = lastClaim ? new Date(lastClaim) : null;
    if (lastClaimMidnight) {
      lastClaimMidnight.setHours(0, 0, 0, 0);
    }

    // Check legacy claim (lastLogin) strictly for abuse prevention
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const lastLoginMidnight = lastLogin ? new Date(lastLogin) : null;
    if (lastLoginMidnight) lastLoginMidnight.setHours(0, 0, 0, 0);

    console.log("Current time:", now);
    console.log("Today midnight:", todayMidnight);
    console.log("Last claim:", lastClaim);
    console.log("Last claim midnight:", lastClaimMidnight);

    // Check if user already claimed today's reward
    // Condition 1: lastDailyClaim exists and is today
    const claimedWithNewSystem = lastClaimMidnight && lastClaimMidnight.getTime() === todayMidnight.getTime();

    // Condition 2: lastDailyClaim doesn't exist, but lastLogin was today (Legacy protection)
    // We only care about this if we want to block them from claiming again if they just logged in.
    // But wait, the syncing logic updates lastLogin on every page load!
    // So `lastLogin === today` is almost ALWAYS true if they utilize the app.
    // This was the original bug.
    // FIX: We ONLY check `lastDailyClaim`. If it's undefined, they can claim.
    // The only edge case is: user claimed "today" before this code deploy.
    // If they claimed "today" before deploy, their `lastLogin` was set to today.
    // But `lastDailyClaim` is undefined. So they could claim again ONE more time today.
    // This is acceptable to fix the bug permanently.

    if (claimedWithNewSystem) {
      console.log("❌ Already claimed today (New System)");

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

    // For streak calculation, we look at the PREVIOUS successful claim or login.
    // We prefer lastDailyClaim, but fall back to lastLogin if lastDailyClaim is missing (migration).
    const effectiveLastDate = user.lastDailyClaim || user.lastLogin;
    const effectiveLastDateMidnight = effectiveLastDate ? new Date(effectiveLastDate) : null;
    if (effectiveLastDateMidnight) effectiveLastDateMidnight.setHours(0, 0, 0, 0);

    if (effectiveLastDateMidnight) {
      // Check if last effective claim was yesterday (consecutive day)
      if (effectiveLastDateMidnight.getTime() === yesterdayMidnight.getTime()) {
        newStreak = (user.streak || 0) + 1;
        streakMessage = ` 🔥 ${newStreak} day streak!`;
        console.log("✅ Consecutive login! New streak:", newStreak);
      } else {
        // Streak broken - reset to 1
        // Note: If effectiveLastDate is today (shouldn't happen due to check above) or older than yesterday
        streakMessage = " ⚠️ Streak reset!";
        console.log("🔄 Streak reset to 1");
      }
    } else {
      // First time claiming ever
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
    user.lastDailyClaim = now; // Save NEW daily claim time
    // We do NOT update lastLogin here, as that's for auth sync.
    // user.lastLogin = now; // Optional: keep keeping it in sync if desired, but separate field is key.
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

    const lastClaim = user.lastDailyClaim ? new Date(user.lastDailyClaim) : null;
    const lastClaimMidnight = lastClaim ? new Date(lastClaim) : null;
    if (lastClaimMidnight) {
      lastClaimMidnight.setHours(0, 0, 0, 0);
    }

    const canClaim =
      !lastClaimMidnight ||
      lastClaimMidnight.getTime() !== todayMidnight.getTime();

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
      lastClaim: lastClaim,
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
