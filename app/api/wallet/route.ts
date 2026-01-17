// app/api/wallet/route.ts - FIXED VERSION (No auto-points on refresh)
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { User, Transaction } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    console.log("=== Wallet GET Request Started ===");
    await connectDb();
    console.log("Database connected");

    let user = null;
    const authHeader = req.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      console.log("Firebase token found, verifying...");

      try {
        const decodedToken = await verifyIdToken(token);
        console.log("Token verified for user:", decodedToken.email);

        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email || "unknown@email.com";
        const name = decodedToken.name || email.split("@")[0];
        const picture = decodedToken.picture;

        // Find user by Firebase UID
        // use .lean() to ensure we get the raw data including redeemedCoupons
        user = await User.findOne({ firebaseUid }).lean();
        console.log("User found by Firebase UID:", !!user);

        // If not found by UID, try by email
        if (!user) {
          console.log("User not found by UID, searching by email:", email);
          user = await User.findOne({ email: email.toLowerCase() });
          console.log("User found by email:", !!user);

          // Link the Firebase UID
          if (user) {
            console.log(
              "⚠️ IMPORTANT: User found by email but missing firebaseUid. Linking now...",
            );
            user.authProvider = "firebase"; // Update local object
            const updateFields: any = { firebaseUid: firebaseUid, authProvider: "firebase" };

            if (picture && !user.avatar) updateFields.avatar = picture;
            if (name && user.name !== name) updateFields.name = name;

            if (Object.keys(updateFields).length > 0) {
              await User.updateOne({ _id: user._id }, { $set: updateFields });
              console.log("✅ Firebase UID linked successfully to existing user");
              // Refresh user object
              user = await User.findOne({ _id: user._id }).lean();
            }
          }
        }

        // If still no user found, return 401
        if (!user) {
          console.log("❌ User not found by UID or email - returning 401");
          return NextResponse.json(
            {
              error: "User not found",
              message: "Please create your wallet first",
              firebaseUid,
              email,
              hint: "This will trigger automatic wallet creation",
            },
            { status: 401 },
          );
        }

        // Update lastActivity without fetching the whole document
        await User.updateOne({ firebaseUid }, { $set: { lastActivity: new Date() } });
        // user.lastActivity = new Date();
        // await user.save();
      } catch (firebaseError: any) {
        console.error("❌ Firebase auth error:", firebaseError.message);
        return NextResponse.json(
          {
            error: "Invalid authentication token",
            details: firebaseError.message,
          },
          { status: 401 },
        );
      }
    } else {
      console.log("⚠️ No Firebase token found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!user) {
      console.log("❌ No authentication method found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    console.log("✅ User authenticated:", user.email);
    console.log("Fetching transactions for user ID:", user._id);

    // Get recent transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log("✅ Transactions found:", transactions.length);

    const responseData = {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        totalPoints: user.totalPoints || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        walletBalance: user.walletBalance || 0,
        achievements: user.achievements || [],
        referralCode: user.referralCode,
        avatar: user.avatar,
        authProvider: user.authProvider,
        lastActivity: user.lastActivity,
        lastLogin: user.lastLogin,
        firebaseUid: user.firebaseUid,
        redeemedCoupons: user.redeemedCoupons || [],
      },
      transactions,
    };

    console.log("🔍 WALLET API - Returning redeemedCoupons count:", responseData.user.redeemedCoupons.length);
    console.log("🔍 WALLET API - Redeemed Coupons:", JSON.stringify(responseData.user.redeemedCoupons));

    console.log("=== ✅ Wallet GET Request Success ===");
    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("=== ❌ Wallet GET Request Error ===");
    console.error("Error details:", error);
    console.error("Stack:", error.stack);

    return NextResponse.json(
      {
        error: "Server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Method not allowed. Use POST /api/wallet/create to create a wallet.",
    },
    { status: 405 },
  );
}
