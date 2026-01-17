import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { Gallery } from "@/models/Gallery";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDb();

        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        // Build query
        const query: any = {};
        if (category) {
            query.category = category;
        }

        // Fetch images matching query, sorted by newest first
        const images = await Gallery.find(query).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: images,
        });
    } catch (error: any) {
        console.error("Gallery Fetch Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch gallery images" },
            { status: 500 }
        );
    }
}
