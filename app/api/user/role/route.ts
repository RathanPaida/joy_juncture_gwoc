// app/api/user/role/route.ts
export const dynamic = 'force-dynamic';
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

    // Fetch user role from MongoDB
    const user = await User.findOne({ firebaseUid: userId })
      .select("role")
      .lean();

    return NextResponse.json({
      success: true,
      role: user?.role || "user",
      userId: userId,
    });
  } catch (error: any) {
    console.error("❌ Error fetching user role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role", details: error.message },
      { status: 500 },
    );
  }
}
