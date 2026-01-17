// app/api/blogs/interactions/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    await connectDb();

    let user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json({
        success: true,
        likedBlogs: [],
        bookmarkedBlogs: [],
      });
    }

    return NextResponse.json({
      success: true,
      likedBlogs: user.likedBlogs || [],
      bookmarkedBlogs: user.bookmarkedBlogs || [],
    });
  } catch (error: any) {
    console.error("Error fetching interactions:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
