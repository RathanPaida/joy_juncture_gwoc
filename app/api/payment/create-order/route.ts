// app/api/payment/create-order/route.ts - CONFLICTS RESOLVED
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon"; // Keep coupon model just in case of server-side validation
import { verifyIdToken } from "@/lib/firebase-admin";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    await connectDb();

    // Verify Firebase token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Invalid token" },
        { status: 401 },
      );
    }

    const firebaseUid = decodedToken.uid;

    // Unified Parameter Extraction: Support both styles (shippingFee/couponCode)
    const {
      amount,
      cartItems,
      shippingAddress,
      shippingFee,
      promoCode,
      couponCode, // Some clients might send this
      discountAmount: clientDiscount
    } = await request.json();

    if (!amount || !cartItems || !shippingAddress || !cartItems.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user
    let user = await User.findOne({ firebaseUid: firebaseUid });

    // JIT USER CREATION: If user not found but token valid, create them now
    if (!user) {
      console.log('⚠️ User not found in MongoDB during checkout. Creating JIT user:', firebaseUid);
      try {
        user = await User.create({
          firebaseUid: firebaseUid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          avatar: decodedToken.picture || null,
          role: 'viewer',
          totalPoints: 0,
          walletBalance: 0,
          createdAt: new Date(),
          lastLogin: new Date(),
        });
        console.log('✅ JIT User created successfully:', user._id);
      } catch (createError) {
        console.error('❌ Failed to create JIT user:', createError);
        return NextResponse.json(
          {
            error:
              "User not found and failed to create profile. Please contact support.",
          },
          { status: 500 },
        );
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.price * (item.quantity || 1),
      0,
    );

    // Shipping Logic: Prioritize Frontend calculated shipping (Pincode based)
    // Fallback to basic rule if not provided
    let shipping = 0;
    if (typeof shippingFee === 'number') {
      shipping = shippingFee;
    } else {
      shipping = subtotal > 500 ? 0 : 50;
    }

    // Discount Logic
    let finalDiscount = 0;

    // If client sends a validated discount amount, use it as primary but validate cap
    if (typeof clientDiscount === 'number') {
      finalDiscount = clientDiscount;
    }
    // Otherwise check for server-side coupon validation
    else if (couponCode) {
      // Legacy: Check coupon model if code exists
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon && coupon.isValid() && coupon.canUserUse(firebaseUid)) {
          if (subtotal >= (coupon.minPurchaseAmount || 0)) {
            finalDiscount = coupon.calculateDiscount(subtotal);
          }
        }
      } catch (err) {
        console.log("Coupon check failed, ignoring:", err);
      }
    }

    // Ensure discount doesn't exceed reasonable limits
    if (finalDiscount > subtotal) finalDiscount = subtotal;

    // Calculate Tax & Total
    // Ensure negative values are impossible
    const taxQueryBase = Math.max(0, subtotal - finalDiscount);
    const tax = taxQueryBase * 0.18;
    const calculatedTotal = Math.max(0, subtotal + shipping + tax - finalDiscount);

    // Create orders
    const orders = [];
    const usedCode = promoCode || couponCode || null;

    for (const item of cartItems) {
      const orderData = {
        userId: user._id.toString(),
        firebaseUid: firebaseUid,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage || "",
        quantity: item.quantity || 1,
        price: item.price,
        totalAmount: item.price * (item.quantity || 1),
        purchaseDate: new Date(),
        status: "processing",
        paymentMethod: "razorpay",
        shippingAddress: shippingAddress,
        trackingNumber: null,
        promoCode: usedCode,
        discountAmount: finalDiscount,
      };

      const order = await Order.create(orderData);
      orders.push(order);
    }

    // Create Razorpay order
    // Use the calculated total, but ensure it matches client expectation roughly? 
    // Razorpay requires integer paise
    const amountInPaise = Math.round(calculatedTotal * 100);

    const options = {
      amount: amountInPaise > 0 ? amountInPaise : 100, // Min 1 rupee if free?
      currency: "INR",
      receipt: `receipt_${orders[0]._id}`,
      notes: {
        orderIds: orders.map((o) => o._id.toString()).join(","),
        firebaseUid: firebaseUid,
        itemCount: cartItems.length,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // CRITICAL FIX: Update the created orders with the Razorpay Order ID
    // This allows us to reliably find them during verification
    await Order.updateMany(
      { _id: { $in: orders.map(o => o._id) } },
      { $set: { razorpayOrderId: razorpayOrder.id } }
    );
    console.log("✅ Linked Razorpay Order ID:", razorpayOrder.id, "to", orders.length, "orders");

    return NextResponse.json({
      ...razorpayOrder,
      notes: {
        ...razorpayOrder.notes,
        orders: orders.map((o) => o._id.toString()),
      },
    });
  } catch (error: any) {
    console.error("❌ ERROR in payment/create-order:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create payment order",
        details:
          process.env.NODE_ENV === "development" ? error.toString() : undefined,
      },
      { status: 500 },
    );
  }
}
