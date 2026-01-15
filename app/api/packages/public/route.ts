import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { Package } from "@/models/Package";

export async function GET(req: NextRequest) {
  try {
    console.log("📦 GET /api/packages/public - Fetching public packages");

    await connectDb();

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Build query
    let query: any = {};
    if (category) {
      query.category = category;
    }

    const packages = await Package.find(query)
      .select("-createdBy -createdByEmail -updatedBy -updatedByEmail")
      .sort({ createdAt: -1 });

    console.log(
      `✅ GET /api/packages/public - Found ${packages.length} packages`,
    );

    return NextResponse.json({
      success: true,
      data: packages,
    });
  } catch (e: any) {
    console.error("❌ GET /api/packages/public error:", e);

    // For production, don't expose error details
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? e.message
        : "Failed to fetch packages";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

// Optional: GET single package by ID
export async function GET_SINGLE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Package ID is required" },
        { status: 400 },
      );
    }

    await connectDb();

    const pkg = await Package.findById(id).select(
      "-createdBy -createdByEmail -updatedBy -updatedByEmail",
    );

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: pkg,
    });
  } catch (e: any) {
    console.error("GET single package error:", e);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch package",
      },
      { status: 500 },
    );
  }
}
