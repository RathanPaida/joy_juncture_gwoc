export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { Setting } from "@/models/Setting";

const DEFAULT_SETTINGS = [
    { key: "siteName", value: "Joy Juncture", label: "Site Name", type: "text", category: "General" },
    { key: "supportEmail", value: "support@joyjuncture.com", label: "Support Email", type: "email", category: "General" },
    { key: "maintenanceMode", value: false, label: "Maintenance Mode", type: "boolean", description: "Enable to show maintenance page to users", category: "System" },
    { key: "maxDailyPoints", value: 50, label: "Max Daily Points", type: "number", description: "Maximum points a user can earn per day", category: "Gamification" }
];

export async function GET(req: NextRequest) {
    try {
        await connectDb();

        // Seed if empty
        const count = await Setting.countDocuments();
        if (count === 0) {
            await Setting.insertMany(DEFAULT_SETTINGS);
        }

        const settings = await Setting.find({}).sort({ category: 1, key: 1 });
        return NextResponse.json(settings);

    } catch (error: any) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectDb();
        const body = await req.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 });
        }

        const updated = await Setting.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true } // upsert just in case, though usually we update
        );

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error("Error updating setting:", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
