// app/api/admin/check-access/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    console.log("Checking admin access for:", { userId, userEmail });

    // Connect to MongoDB
    await connectDb();

    // Check user role in MongoDB
    const user = await User.findOne({ firebaseUid: userId }).lean();

    if (!user) {
      // User not in MongoDB yet - check if they're the admin email
      const isAdminEmail = userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (isAdminEmail) {
        return NextResponse.json({
          success: true,
          role: "admin",
          email: userEmail,
          message: "Admin access granted (by email)",
        });
      }

      return NextResponse.json(
        {
          error: "User not found in database. Please sync your account by logging in again.",
          needsSync: true
        },
        { status: 404 }
      );
    }

    // Check if user has admin privileges
    const allowedRoles = ["admin", "super_admin", "editor"];
    const hasAdminAccess = allowedRoles.includes(user.role);

    // Also check if it's the admin email (fallback)
    const isAdminEmail = userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!hasAdminAccess && !isAdminEmail) {
      return NextResponse.json(
        {
          error: "Access denied. Admin privileges required.",
          role: user.role,
          requiredRoles: allowedRoles
        },
        { status: 403 }
      );
    }

    // Access granted
    return NextResponse.json({
      success: true,
      role: user.role,
      email: userEmail,
      name: user.name,
      userId: userId,
      message: "Admin access granted",
    });

  } catch (error: any) {
    console.error("Error checking admin access:", error);
    return NextResponse.json(
      {
        error: "Failed to check admin access",
        details: error.message
      },
      { status: 500 }
    );
  }
}