// app/api/orders/create/route.ts - UPDATED WITH NEW COUPON SYSTEM
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User, Transaction } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { verifyIdToken } from "@/lib/firebase-admin";
import { MongoClient } from "mongodb";
import { sendEmail } from "@/lib/mail";


interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity?: number;
  productImage?: string;

}

export async function POST(request: NextRequest) {
  try {
    await connectDb();

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

    const { cartItems, shippingAddress, paymentMethod, total, couponCode } =
      (await request.json()) as {
        cartItems: CartItem[];
        shippingAddress: any;
        paymentMethod: string;
        total: number;
        couponCode?: string;
      };

    if (!cartItems || !shippingAddress || !paymentMethod || !cartItems.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ firebaseUid: firebaseUid });
    if (!user) {
      return NextResponse.json(
        {
          error:
            "User not found in database. Please complete your profile first.",
        },
        { status: 404 },
      );
    }

    // Validate Coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      if (!coupon) {
        return NextResponse.json(
          { error: "Invalid coupon code" },
          { status: 400 }
        );
      }

      if (!coupon.isValid()) {
        if (!coupon.isActive) {
          return NextResponse.json(
            { error: "Coupon is inactive" },
            { status: 400 }
          );
        }
        if (new Date() > coupon.expiryDate) {
          return NextResponse.json(
            { error: "Coupon has expired" },
            { status: 400 }
          );
        }
        if (coupon.usedCount >= coupon.usageLimit) {
          return NextResponse.json(
            { error: "Coupon usage limit reached" },
            { status: 400 }
          );
        }
      }

      if (!coupon.canUserUse(firebaseUid)) {
        return NextResponse.json(
          { error: "You have already used this coupon the maximum number of times" },
          { status: 400 }
        );
      }

      // Calculate subtotal
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      );

      if (subtotal < (coupon.minPurchaseAmount || 0)) {
        return NextResponse.json(
          { error: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required` },
          { status: 400 }
        );
      }

      discountAmount = coupon.calculateDiscount(subtotal);
      appliedCoupon = coupon;

      console.log(`🎟️ Coupon ${couponCode} applied. Discount: ₹${discountAmount}`);
    }

    console.log("📦 Creating orders for", cartItems.length, "items");

    const orders = [];
    const itemCount = cartItems.length;

    // Distribute discount across items
    const discountPerItem = discountAmount > 0 ? (discountAmount / itemCount) : 0;

    for (const item of cartItems) {
      const itemTotal = item.price * (item.quantity || 1);
      const orderTotalWithDiscount = Math.max(0, itemTotal - discountPerItem);

      const orderData = {
        userId: user._id.toString(),
        firebaseUid: firebaseUid,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity || 1,
        totalAmount: orderTotalWithDiscount,
        productImage: item.productImage || "",
        items: [{
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage || "",
          price: item.price,
          quantity: item.quantity || 1,
        }],
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "completed",
        orderStatus: "pending",
        shippingAddress: shippingAddress,
        subtotal: itemTotal,
        shipping: 0,
        tax: 0,
        discount: discountPerItem,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        couponId: appliedCoupon ? appliedCoupon._id : null,
        trackingNumber: `${paymentMethod === "cod" ? "COD" : "ORD"}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        purchaseDate: new Date(),
        paidAt: paymentMethod === "cod" ? null : new Date(),
      };

      const order = await Order.create(orderData);
      orders.push(order);
      console.log("✅ Order created:", order._id);
    }

    // Record coupon usage
    if (appliedCoupon) {
      await appliedCoupon.recordUsage(firebaseUid);
      console.log(`✅ Coupon usage recorded for ${firebaseUid}`);
    }

    // Calculate final total
    const totalAmount = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    console.log("💰 Total amount (after discount):", totalAmount);

    const joyPoints = Math.floor(totalAmount / 10);
    console.log("🎁 Joy points to add:", joyPoints);

    const userUpdate = await User.findOneAndUpdate(
      { firebaseUid: firebaseUid },
      {
        $inc: {
          walletBalance: joyPoints,
          totalPoints: joyPoints,
        },
      },
      { new: true },
    );

    console.log("✅ User wallet updated:", userUpdate?.walletBalance);
    console.log("✅ User points updated:", userUpdate?.totalPoints);

    if (joyPoints > 0) {
      try {
        await Transaction.create({
          userId: user._id,
          type: "purchase",
          amount: joyPoints,
          description: `Purchase reward - ${orders.length} item(s)`,
          metadata: {
            orderIds: orders.map((o) => o._id.toString()),
            purchaseAmount: totalAmount,
            itemCount: orders.length,
            paymentMethod: paymentMethod,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            discountApplied: discountAmount
          },
          balanceAfter: userUpdate?.totalPoints || 0,
          status: "completed",
        });
        console.log("✅ Transaction log created");
      } catch (txError) {
        console.error("⚠️ Transaction log failed:", txError);
      }
    }

    // Clear cart
    console.log("\n========================================");
    console.log("🧹 ATTEMPTING TO CLEAR CART");
    console.log("========================================");

    try {
      const cartClient = new MongoClient(process.env.MONGODB_URI!);
      await cartClient.connect();

      try {
        const db = cartClient.db("joyjuncture");
        const cartCollection = db.collection("cart");

        const existingItems = await cartCollection.find({ userId: firebaseUid }).toArray();
        console.log("📦 Cart items found:", existingItems.length);

        const cartDeleteResult = await cartCollection.deleteMany({ userId: firebaseUid });
        console.log("🗑️ Delete result:", {
          acknowledged: cartDeleteResult.acknowledged,
          deletedCount: cartDeleteResult.deletedCount
        });

        const verifyItems = await cartCollection.find({ userId: firebaseUid }).toArray();
        console.log("✅ Remaining items after delete:", verifyItems.length);

        if (verifyItems.length === 0) {
          console.log("🎉 CART SUCCESSFULLY DELETED!");
        }
      } finally {
        await cartClient.close();
      }
    } catch (cartError: any) {
      console.error("❌ CART DELETION ERROR:", cartError.message);
    }

    // Send email
    const userEmail = user.email;
    if (userEmail) {
      const orderListHtml = orders.map(o => `
        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
          <strong>${o.productName}</strong> - Qty: ${o.quantity} - ₹${o.totalAmount}
        </div>
      `).join('');

      await sendEmail({
        to: userEmail,
        subject: `Order Confirmed - Joy Juncture`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #FF6B35;">Order Received!</h1>
            <p>Hi ${user.name},</p>
            <p>Thank you for your purchase. We've received your order.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
               <h3>Order Summary</h3>
               ${orderListHtml}
               <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
               ${discountAmount > 0 ? `<p><strong>Coupon Discount:</strong> -₹${discountAmount.toFixed(2)}</p>` : ''}
               <p><strong>Total Paid:</strong> ₹${totalAmount}</p>
               <p><strong>Joy Points Earned:</strong> ${joyPoints}</p>
            </div>
            <p>We'll notify you when it ships!</p>
            <p>- Team Joy Juncture</p>
          </div>
        `
      });
    }

    return NextResponse.json({
      success: true,
      orderIds: orders.map((o) => o._id.toString()),
      ordersCreated: orders.length,
      joyPointsEarned: joyPoints,
      totalAmount: totalAmount,
      discountApplied: discountAmount,
      cartCleared: true,
      message: `Order placed successfully! You earned ${joyPoints} Joy Points.`,
    });
  } catch (error: any) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}