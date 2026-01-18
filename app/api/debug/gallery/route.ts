
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { Gallery } from "@/models/Gallery";
import mongoose from "mongoose";


export async function GET() {
    try {
        await connectDb();
        const recentImages = await Gallery.find().sort({ createdAt: -1 }).limit(10);
        return NextResponse.json({
            success: true,
            count: recentImages.length,
            data: recentImages
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await connectDb();
        if (!mongoose.connection.db) {
            throw new Error("Database connection not established");
        }
        const collection = mongoose.connection.db.collection("galleries");
        const res = await collection.deleteMany({ category: { $exists: false } });
        return NextResponse.json({ success: true, deletedCount: res.deletedCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
