import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";

/* ========== CREATE PUBLIC BOOKING ========== */
export async function POST(req: NextRequest) {
  try {
    console.log("📅 POST /api/bookings/public - Creating public booking");
    
    await connectDb();
    const body = await req.json();

    // Log received data for debugging
    console.log("📝 Booking data received:", {
      name: body.name,
      email: body.email,
      phone: body.phone,
      package: body.package,
      date: body.date,
      eventType: body.eventType
    });

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'package', 'date'];
    const missingFields = requiredFields.filter(field => !body[field] || body[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Create booking with default values
    const bookingData = {
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      package: body.package,
      date: body.date,
      
      // Optional fields with defaults
      eventType: body.eventType || 'birthday-anniversary',
      guestCount: body.guestCount || '20-50 Guests',
      duration: body.duration || '2-3 hours',
      selectedGames: Array.isArray(body.selectedGames) ? body.selectedGames : [],
      notes: body.notes || '',
      totalPrice: body.totalPrice || '',
      
      // Admin fields (defaults)
      status: 'pending',
      consulted: false,
      bookingDate: new Date()
    };

    console.log("📦 Creating booking with data:", bookingData);

    const booking = await Booking.create(bookingData);

    console.log(`✅ Booking created successfully for: ${booking.name}`);
    console.log(`📧 Contact email: ${booking.email}`);
    console.log(`📞 Contact phone: ${booking.phone}`);
    console.log(`📅 Event date: ${booking.date}`);
    console.log(`💰 Package: ${booking.package}`);
    
    return NextResponse.json(
      { 
        success: true, 
        data: booking,
        message: "🎉 Booking submitted successfully! We'll contact you within 24 hours to confirm details." 
      },
      { status: 201 }
    );
    
  } catch (e: any) {
    console.error("❌ POST /api/bookings/public error:", e);
    console.error("❌ Error stack:", e.stack);
    
    // Handle specific MongoDB errors
    if (e.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation error. Please check your input data." 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to submit booking. Please try again later." 
      },
      { status: 500 }
    );
  }
}

/* ========== OPTIONAL: Public health check ========== */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      success: true, 
      message: "Booking API is operational",
      timestamp: new Date().toISOString()
    }
  );
}