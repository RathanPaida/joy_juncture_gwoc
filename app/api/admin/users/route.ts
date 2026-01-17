import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        await connectDb();

        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get("query") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        let filter = {};
        if (query) {
            filter = {
                $or: [
                    { name: { $regex: query, $options: "i" } },
                    { email: { $regex: query, $options: "i" } }
                ]
            };
        }

        const users = await User.find(filter)
            .select("name email role createdAt lastLogin totalPoints")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(filter);

        return NextResponse.json({
            users,
            pagination: {
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error: any) {
        console.error("Error fetching admin users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
