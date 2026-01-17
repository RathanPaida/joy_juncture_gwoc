// app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";
import { verifyIdToken } from "@/lib/firebase-admin";
import { User } from "@/models/User";

// GET - List all coupons
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);

    await connectDb();

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const query: any = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (status === "expired") query.expiryDate = { $lt: new Date() };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(query),
    ]);

    return NextResponse.json({
      coupons,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);

    await connectDb();

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.code || !data.name || !data.discountType || !data.discountValue || !data.expiryDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      ...data,
      code: data.code.toUpperCase(),
      createdBy: decodedToken.uid,
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: "Coupon created successfully",
    });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

// PUT - Update coupon
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);

    await connectDb();

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      coupon,
      message: "Coupon updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE - Delete coupon
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyIdToken(token);

    await connectDb();

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}