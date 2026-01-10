// app/api/auth/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { email, name, avatar } = body;

    await connectDb();

    // Check if user exists in MongoDB
    let user = await User.findOne({ firebaseUid: userId });

    if (!user) {
      // Create new user in MongoDB
      user = await User.create({
        firebaseUid: userId,
        email: email || decodedToken.email,
        name: name || decodedToken.name || email?.split("@")[0] || "User",
        avatar: avatar || decodedToken.picture || null,
        role: "user",
        totalPoints: 0,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      console.log("✅ New user created in MongoDB:", userId);
    } else {
      // Update last login
      user.lastLogin = new Date();
      if (name && name !== user.name) user.name = name;
      if (avatar && avatar !== user.avatar) user.avatar = avatar;
      await user.save();

      console.log("✅ User synced in MongoDB:", userId);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        totalPoints: user.totalPoints,
      },
    });
  } catch (error: any) {
    console.error("❌ Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user", details: error.message },
      { status: 500 },
    );
  }
}
