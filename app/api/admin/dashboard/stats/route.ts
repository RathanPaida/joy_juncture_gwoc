export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { User, Transaction } from "@/models/User";
import { startOfMonth, subMonths, format, subDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
    try {
        await connectDb();

        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        const sevenDaysAgo = subDays(now, 7);

        // 1. Basic Stats
        const totalUsers = await User.countDocuments({});

        // Active users: Users who logged in within the last 30 days
        // Fallback to checking updated at if lastLogin is not populated for some legacy users
        const activeUsers = await User.countDocuments({
            $or: [
                { lastLogin: { $gte: thirtyDaysAgo } },
                { updatedAt: { $gte: thirtyDaysAgo } }
            ]
        });

        const newUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // 2. User Growth (Last 6 months)
        const userGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const nextMonthStart = startOfMonth(subMonths(now, i - 1));

            const count = await User.countDocuments({
                createdAt: { $lt: nextMonthStart }
            });

            userGrowth.push({
                name: format(monthStart, "MMM"),
                users: count
            });
        }

        // 3. User Activity (Daily Logins/Claims for last 7 days)
        // We'll use 'daily' transactions as a proxy for active engagement
        const activityData = [];
        for (let i = 6; i >= 0; i--) {
            const day = subDays(now, i);
            const start = startOfDay(day);
            const end = endOfDay(day);

            const dailyLogins = await Transaction.countDocuments({
                type: "daily",
                createdAt: { $gte: start, $lte: end }
            });

            // Also count users created that day as "activity"
            const newSignups = await User.countDocuments({
                createdAt: { $gte: start, $lte: end }
            });

            activityData.push({
                name: format(day, "EEE"), // Mon, Tue, etc.
                active: dailyLogins + newSignups // Composite score of engagement
            });
        }

        // 4. Role Distribution
        const roles = await User.aggregate([
            { $group: { _id: "$role", value: { $sum: 1 } } }
        ]);

        const roleData = roles.map(r => ({
            name: r._id.charAt(0).toUpperCase() + r._id.slice(1),
            value: r.value
        }));

        return NextResponse.json({
            summary: {
                totalUsers,
                activeUsers,
                newUsers
            },
            userGrowth,
            activityData,
            roleData
        });

    } catch (error: any) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}
