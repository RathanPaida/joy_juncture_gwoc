// app/api/user/me/route.ts
import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User"; // Change this to named import

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split(" ")[1];

    // Verify Firebase token
    const decodedToken = await getAuth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Find user in database
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
          redirect: "/create-profile"
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          totalPoints: user.totalPoints || 0,
          totalCoins: user.totalPoints || 0, // Added for backward compatibility
          level: user.level || 1,
          streak: user.streak || 0,
          lastActivity: user.lastActivity || new Date().toISOString(),
          gamesPlayed: user.gamesPlayed || []
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in /api/user/me:", error);

    if (error.code === "auth/id-token-expired") {
      return new Response(
        JSON.stringify({ success: false, error: "Token expired" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}