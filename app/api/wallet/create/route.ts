// app/api/wallet/create/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const body = await req.json();
    const { email, name, firebaseUid, picture } = body;
    const authHeader = req.headers.get("authorization");

    // If Firebase token is provided, verify it
    let verifiedFirebaseUid = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await verifyIdToken(token);
        verifiedFirebaseUid = decodedToken.uid;
        // Use verified UID from token, not from body
        if (verifiedFirebaseUid !== firebaseUid) {
          console.warn("Firebase UID mismatch:", {
            verified: verifiedFirebaseUid,
            body: firebaseUid,
          });
        }
      } catch (firebaseError) {
        console.error("Firebase token verification failed:", firebaseError);
        // Continue without Firebase verification
      }
    }

    const uidToUse = verifiedFirebaseUid || firebaseUid;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists by Firebase UID
    if (uidToUse) {
      const existingByUid = await User.findOne({ firebaseUid: uidToUse });
      if (existingByUid) {
        return NextResponse.json(
          {
            success: true,
            message: "User already exists",
            user: {
              _id: existingByUid._id,
              email: existingByUid.email,
              name: existingByUid.name,
              totalPoints: existingByUid.totalPoints || 100,
              level: existingByUid.level || 1,
              streak: existingByUid.streak || 0,
              referralCode: existingByUid.referralCode,
              avatar: existingByUid.avatar,
            },
          },
          { status: 200 },
        );
      }
    }

    // Check if user exists by email
    const existingByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
      // Link Firebase UID if provided
      if (uidToUse && !existingByEmail.firebaseUid) {
        existingByEmail.firebaseUid = uidToUse;
        await existingByEmail.save();
      }

      return NextResponse.json(
        {
          success: true,
          message: "User already exists",
          user: {
            _id: existingByEmail._id,
            email: existingByEmail.email,
            name: existingByEmail.name,
            totalPoints: existingByEmail.totalPoints || 100,
            level: existingByEmail.level || 1,
            streak: existingByEmail.streak || 0,
            referralCode: existingByEmail.referralCode,
            avatar: existingByEmail.avatar,
          },
        },
        { status: 200 },
      );
    }

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      firebaseUid: uidToUse,
      authProvider: uidToUse ? "firebase" : "local",
      role: "viewer",
      totalPoints: 100,
      level: 1,
      streak: 0,
      lastActivity: new Date(),
      achievements: [],
      walletBalance: 0,
      isActive: true,
      emailVerified: uidToUse ? true : false,
      avatar: picture,
    });

    await newUser.save();

    return NextResponse.json(
      {
        success: true,
        message: "Wallet created successfully",
        user: {
          _id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          totalPoints: newUser.totalPoints,
          level: newUser.level,
          streak: newUser.streak,
          referralCode: newUser.referralCode,
          avatar: newUser.avatar,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { error: "Failed to create wallet", details: error.message },
      { status: 500 },
    );
  }
}
