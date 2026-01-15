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

    console.log("🔍 Fetching profile for user:", userId);

    // Get Firebase Auth user data first
    const firebaseUser = await adminAuth.getUser(userId);

    // Try to get user from MongoDB
    await connectDb();
    const mongoUser = await User.findOne({ firebaseUid: userId }).lean();

    if (!mongoUser) {
      console.warn("⚠️ User not found in MongoDB:", userId);
      return NextResponse.json({ 
        error: "User not found", 
        message: "Please log out and log in again to sync your profile" 
      }, { status: 404 });
    }

    console.log("✅ User found in MongoDB:", mongoUser.email);

    // Build profile from MongoDB data + Firebase Auth data
    const profile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || mongoUser.email,
      displayName: mongoUser.name || firebaseUser.displayName,
      username: mongoUser.username || firebaseUser.email?.split('@')[0],
      photoURL: mongoUser.avatar || firebaseUser.photoURL,
      phoneNumber: mongoUser.phone || firebaseUser.phoneNumber,
      occupation: mongoUser.occupation || null,
      dob: mongoUser.dob || null,
      gender: mongoUser.gender || null,
      role: mongoUser.role || 'user',
      status: mongoUser.status || 'active',
      theme: mongoUser.theme || 'dark',
      reminders: mongoUser.reminders ?? true,
      isProfileComplete: mongoUser.isProfileComplete || false,
      emailVerified: mongoUser.emailVerified || firebaseUser.emailVerified,
      totalPoints: mongoUser.totalPoints || 0,
      walletBalance: mongoUser.walletBalance || 0,
      level: mongoUser.level || 1,
      streak: mongoUser.streak || 0,
      createdAt: mongoUser.createdAt || firebaseUser.metadata.creationTime,
      lastLogin: mongoUser.lastLogin || firebaseUser.metadata.lastSignInTime,
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
    const { 
      displayName, 
      photoURL, 
      phoneNumber,
      username,
      occupation,
      dob,
      gender,
      theme,
      reminders
    } = body;

    console.log("📝 Updating profile for user:", userId);

    // Update MongoDB
    await connectDb();
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (displayName !== undefined) updateData.name = displayName;
    if (photoURL !== undefined) updateData.avatar = photoURL;
    if (phoneNumber !== undefined) updateData.phone = phoneNumber;
    if (username !== undefined) updateData.username = username;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (theme !== undefined) updateData.theme = theme;
    if (reminders !== undefined) updateData.reminders = reminders;

    // Check if profile is complete
    const user = await User.findOne({ firebaseUid: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const requiredFields = ['name', 'username', 'phone', 'occupation', 'dob', 'gender'];
    const allFieldsPresent = requiredFields.every(field => {
      const currentValue = user[field as keyof typeof user];
      const newValue = updateData[field];
      const value = newValue !== undefined ? newValue : currentValue;
      return value !== null && value !== undefined && value !== '';
    });

    if (allFieldsPresent) {
      updateData.isProfileComplete = true;
    }

    // Update in MongoDB
    await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: updateData },
      { new: true }
    );

    console.log("✅ MongoDB profile updated");

    // Update Firebase Auth profile
    const firebaseUpdateData: any = {};
    if (displayName) firebaseUpdateData.displayName = displayName;
    if (photoURL) firebaseUpdateData.photoURL = photoURL;
    if (phoneNumber) firebaseUpdateData.phoneNumber = phoneNumber;

    if (Object.keys(firebaseUpdateData).length > 0) {
      await adminAuth.updateUser(userId, firebaseUpdateData);
      console.log("✅ Firebase Auth profile updated");
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