export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { connectDb } from "@/lib/mongodb";
import { Gallery } from "@/models/Gallery";
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

// Helper to save file
async function saveFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'gallery');

    try {
        await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
        // Ignore if exists
    }

    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    return `/uploads/gallery/${filename}`;
}

export async function POST(req: NextRequest) {
    try {
        const { authorized, error } = await checkAdminAccess(req);
        if (!authorized) {
            return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
        }

        await connectDb();
        const formData = await req.formData();

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const imageFile = formData.get('image') as File | null;

        console.log("📸 [Gallery Upload] Received FormData:", {
            title,
            description,
            category,
            hasImage: !!imageFile,
            imageName: imageFile?.name
        });

        if (!title || !description || !imageFile || !category) {
            return NextResponse.json(
                { success: false, error: "Missing required fields (including category)" },
                { status: 400 }
            );
        }

        const imageUrl = await saveFile(imageFile);

        const newImage = await Gallery.create({
            title,
            description,
            category,
            url: imageUrl
        });

        return NextResponse.json({
            success: true,
            data: newImage,
            message: "Image added to gallery"
        }, { status: 201 });

    } catch (err: any) {
        console.error("Gallery Upload Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to upload image" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        const query = category ? { category } : {};
        const images = await Gallery.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: images });
    } catch (error) {
        console.error("Gallery Fetch Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch images" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { authorized, error } = await checkAdminAccess(req);
        if (!authorized) {
            return NextResponse.json({ error: error || "Unauthorized" }, { status: 403 });
        }

        await connectDb();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
        }

        const image = await Gallery.findById(id);
        if (!image) {
            return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
        }

        // Try to delete file from disk
        try {
            const filePath = path.join(process.cwd(), 'public', image.url);
            await unlink(filePath);
        } catch (fileErr) {
            console.warn("Failed to delete file from disk:", fileErr);
            // Continue to delete from DB even if file doesn't exist
        }

        await Gallery.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Image deleted successfully" });

    } catch (err: any) {
        console.error("Gallery Delete Error:", err);
        return NextResponse.json(
            { success: false, error: "Failed to delete image" },
            { status: 500 }
        );
    }
}
