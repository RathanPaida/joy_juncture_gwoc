import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { Gallery } from "@/models/Gallery";

export async function GET(req: NextRequest) {
    try {
        await connectDb();

        // Fetch all images, sorted by newest first
        const images = await Gallery.find({}).sort({ createdAt: -1 });

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
