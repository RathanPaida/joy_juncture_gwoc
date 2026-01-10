import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { checkAdminAccess } from "@/lib/admin-middleware";
import { Booking } from "@/models/Booking";

/* ========== GET ALL BOOKINGS (ADMIN ONLY) ========== */
export async function GET(req: NextRequest) {
  try {
    console.log("📅 GET /api/bookings - Admin fetching bookings");

    // Check admin access
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      console.log(`❌ Admin access denied: ${error}`);
      return NextResponse.json(
        {
          success: false,
          error: error || "Unauthorized access",
        },
        { status: 401 },
      );
    }

    console.log(`✅ Admin access granted: ${admin?.email}`);

    await connectDb();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    // Build query
    let query: any = {};
    if (status) {
      query.status = status;
    }

    // Build options
    const options: any = { sort: { createdAt: -1 } };
    if (limit) {
      options.limit = parseInt(limit);
    }

    const bookings = await Booking.find(query, null, options);

    console.log(`✅ Found ${bookings.length} bookings`);

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (e: any) {
    console.error("❌ GET /api/bookings error:", e);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch bookings",
      },
      { status: 500 },
    );
  }
}

/* ========== UPDATE BOOKING (ADMIN ONLY) ========== */
export async function PUT(req: NextRequest) {
  try {
    console.log("📅 PUT /api/bookings - Admin updating booking");

    // Check admin access
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          error: error || "Unauthorized access",
        },
        { status: 401 },
      );
    }

    console.log(`✅ Admin access granted: ${admin?.email}`);

    await connectDb();
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID required" },
        { status: 400 },
      );
    }

    console.log(`📝 Updating booking ID: ${id}`);
    console.log(`📝 Update data:`, data);

    // Find and update booking
    const updated = await Booking.findByIdAndUpdate(
      id,
      {
        ...data,
        lastEditedBy: admin?.email || "admin",
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      console.log(`❌ Booking not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    console.log(
      `✅ Booking updated: ${updated.name} (Status: ${updated.status})`,
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Booking updated successfully",
    });
  } catch (e: any) {
    console.error("❌ PUT /api/bookings error:", e);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update booking",
      },
      { status: 500 },
    );
  }
}

/* ========== DELETE BOOKING (ADMIN ONLY) ========== */
export async function DELETE(req: NextRequest) {
  try {
    console.log("📅 DELETE /api/bookings - Admin deleting booking");

    // Check admin access
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          error: error || "Unauthorized access",
        },
        { status: 401 },
      );
    }

    console.log(`✅ Admin access granted: ${admin?.email}`);

    await connectDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID required" },
        { status: 400 },
      );
    }

    console.log(`🗑️ Deleting booking ID: ${id}`);

    // Find booking first for logging
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log(`❌ Booking not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    console.log(
      `📝 Found booking to delete: ${booking.name} (${booking.email})`,
    );

    // Delete the booking
    const deleted = await Booking.findByIdAndDelete(id);

    if (!deleted) {
      console.log(`❌ Failed to delete booking: ${id}`);
      return NextResponse.json(
        { success: false, error: "Failed to delete booking" },
        { status: 500 },
      );
    }

    console.log(`✅ Booking deleted successfully: ${booking.name}`);

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
      data: {
        id: deleted._id,
        name: deleted.name,
        email: deleted.email,
      },
    });
  } catch (e: any) {
    console.error("❌ DELETE /api/bookings error:", e);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete booking",
      },
      { status: 500 },
    );
  }
}

/* ========== CREATE BOOKING FROM ADMIN PANEL ========== */
export async function POST(req: NextRequest) {
  try {
    console.log("📅 POST /api/bookings - Admin creating booking");

    // Check admin access
    const { authorized, error, admin } = await checkAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          error: error || "Unauthorized access",
        },
        { status: 401 },
      );
    }

    console.log(`✅ Admin access granted: ${admin?.email}`);

    await connectDb();
    const body = await req.json();

    // Validate required fields
    const requiredFields = ["name", "email", "phone", "package", "date"];
    const missingFields = requiredFields.filter(
      (field) => !body[field] || body[field].toString().trim() === "",
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Create booking from admin
    const bookingData = {
      ...body,
      createdBy: {
        userId: admin?.id || "admin",
        userEmail: admin?.email || "admin@system",
        userRole: admin?.role || "admin",
      },
      lastEditedBy: admin?.email,
      status: body.status || "pending",
      consulted: body.consulted || false,
      bookingDate: new Date(),
    };

    const booking = await Booking.create(bookingData);

    console.log(`✅ Admin created booking: ${booking.name}`);

    return NextResponse.json(
      {
        success: true,
        data: booking,
        message: "Booking created successfully",
      },
      { status: 201 },
    );
  } catch (e: any) {
    console.error("❌ POST /api/bookings error:", e);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create booking",
      },
      { status: 500 },
    );
  }
}
