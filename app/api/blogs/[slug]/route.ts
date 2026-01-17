import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Blog } from "@/models/Blog";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> },
) {
    try {
        const params = await context.params;
        await connectDb();

        // Fetch blog by slug - Do NOT exclude content here!
        const blog = await Blog.findOne({
            slug: params.slug,
            status: 'published'
        }).lean();

        if (!blog) {
            return NextResponse.json(
                { success: false, error: "Blog not found" },
                { status: 404 },
            );
        }

        // Increment views (optional, but good practice)
        await Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } });

        return NextResponse.json({
            success: true,
            blog: JSON.parse(JSON.stringify(blog)),
        });
    } catch (error: any) {
        console.error("Error fetching blog:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 },
        );
    }
}
