// app/api/blogs/bookmark/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import connectDb from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
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

    const { blogId, action } = await request.json();

    if (!blogId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDb();

    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({
        firebaseUid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        authProvider: "firebase",
        likedBlogs: [],
        bookmarkedBlogs: [],
      });
    }

    if (action === "add") {
      if (!user.bookmarkedBlogs.includes(blogId)) {
        user.bookmarkedBlogs.push(blogId);
      }
    } else if (action === "remove") {
      user.bookmarkedBlogs = user.bookmarkedBlogs.filter(
        (id: string) => id !== blogId,
      );
    }

    await user.save();

    return NextResponse.json({
      success: true,
      bookmarkedBlogs: user.bookmarkedBlogs,
      action,
    });
  } catch (error: any) {
    console.error("Error handling bookmark:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
