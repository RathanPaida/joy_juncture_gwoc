
import { NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { User } from "@/models/User";

// You can call this with ?email=your_email@example.com to promote a user
export async function GET(request: Request) {
    try {
        await connectDb();
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            // List all admins if no email provided
            const admins = await User.find({ role: { $in: ["admin", "super_admin"] } }).select("email role name");
            return NextResponse.json({
                message: "Provide ?email=... to promote a user",
                currentAdmins: admins
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
        }

        user.role = "admin";
        await user.save();

        return NextResponse.json({
            success: true,
            message: `User ${email} is now an admin`,
            user: {
                email: user.email,
                role: user.role
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
