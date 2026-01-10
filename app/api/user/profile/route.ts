// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDb();

    // Get user from MongoDB
    const user = await User.findOne({ firebaseUid: userId }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get Firebase user data
    const firebaseUser = await adminAuth.getUser(userId);

    const profile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: user.name || firebaseUser.displayName,
      photoURL: user.avatar || firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      role: user.role,
      totalPoints: user.totalPoints || 0,
      walletBalance: user.walletBalance || 0,
      level: user.level || 1,
      streak: user.streak || 0,
      createdAt: firebaseUser.metadata.creationTime,
      lastLogin: user.lastActivity || firebaseUser.metadata.lastSignInTime,
    };

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("❌ Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { displayName, photoURL, phoneNumber } = body;

    await connectDb();

    // Update MongoDB
    const updateData: any = {};
    if (displayName) updateData.name = displayName;
    if (photoURL) updateData.avatar = photoURL;

    await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: updateData },
      { new: true },
    );

    // Update Firebase Auth
    const firebaseUpdateData: any = {};
    if (displayName) firebaseUpdateData.displayName = displayName;
    if (photoURL) firebaseUpdateData.photoURL = photoURL;
    if (phoneNumber) firebaseUpdateData.phoneNumber = phoneNumber;

    if (Object.keys(firebaseUpdateData).length > 0) {
      await adminAuth.updateUser(userId, firebaseUpdateData);
    }

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error: any) {
    console.error("❌ Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 },
    );
  }
}
