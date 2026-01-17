// app/api/orders/create/route.ts - COMPLETE WITH CART CLEARING
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User, Transaction } from "@/models/User";
import { verifyIdToken } from "@/lib/firebase-admin";
import { MongoClient } from "mongodb";
import { sendEmail } from "@/lib/mail";

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
      await request.json();

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
    if (couponCode) {
      const coupon = user.redeemedCoupons?.find((c: any) => c.code === couponCode);
      if (coupon && coupon.status === 'available') {
        discountAmount = coupon.discountAmount || 10;

        // Mark coupon as used
        await User.updateOne(
          { _id: user._id, "redeemedCoupons.code": couponCode },
          {
            $set: {
              "redeemedCoupons.$.status": "used",
              "redeemedCoupons.$.usedAt": new Date()
            }
          }
        );
        console.log(`🎟️ Coupon ${couponCode} applied. Discount: ${discountAmount}`);
      } else {
        console.warn(`⚠️ Invalid or used coupon code: ${couponCode}`);
        // We continue without discount if invalid, or return error? 
        // Better to ignore invalid coupon to avoid blocking order, but ideally frontend handles this.
      }
    }

    console.log("📦 Creating orders for", cartItems.length, "items");

    const orders = [];
    const itemCount = cartItems.length;

    // Distributed discount logic: Pro-rate discount across items or apply to first?
    // For simplicity, we apply discount to the first item (or just track it on the total order logic if we were creating a single Order document).
    // BUT this system creates MULTIPLE Order documents (one per item).
    // This is a bad design for "Orders" usually (Order normally contains multiple Items), but I must follow existing pattern.
    // If we have multiple orders, how do we apply a single flat discount?
    // We should probably split the discount across orders or apply to the first one.
    // Let's divide discount by number of items to distribute it safely.

    const discountPerItem = discountAmount > 0 ? (discountAmount / itemCount) : 0;

    for (const item of cartItems) {
      const itemTotal = item.price * (item.quantity || 1);
      // Ensure specific order total doesn't go below 0
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
        discount: discountPerItem, // Track discount per order
        couponCode: couponCode || null,
        trackingNumber: `${paymentMethod === "cod" ? "COD" : "ORD"}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        purchaseDate: new Date(),
        paidAt: paymentMethod === "cod" ? null : new Date(),
      };

      const order = await Order.create(orderData);
      orders.push(order);
      console.log("✅ Order created:", order._id);
    }

    // Recalculate total Paid for transaction and points
    const totalAmount = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    // ... rest of the code for points and transaction logging ...

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
            couponCode: couponCode || null
          },
          balanceAfter: userUpdate?.totalPoints || 0,
          status: "completed",
        });
        console.log("✅ Transaction log created");
      } catch (txError) {
        console.error("⚠️ Transaction log failed:", txError);
      }
    }

    // 🎯 CLEAR THE CART AFTER SUCCESSFUL ORDER CREATION (FOR COD)
    console.log("\n========================================");
    console.log("🧹 ATTEMPTING TO CLEAR CART");
    console.log("========================================");
    console.log("FirebaseUid:", firebaseUid);

    try {
      // Use the same MongoDB connection as the cart API
      const cartClient = new MongoClient(process.env.MONGODB_URI!);
      await cartClient.connect();

      try {
        const db = cartClient.db("joyjuncture");
        const cartCollection = db.collection("cart");

        // Find all cart items for this user
        const existingItems = await cartCollection.find({ userId: firebaseUid }).toArray();

        console.log("📦 Cart items found:", existingItems.length);

        if (existingItems.length > 0) {
          console.log("📦 Items to delete:");
          existingItems.forEach((item: any, index: number) => {
            console.log(`   ${index + 1}. ${item.productName} (${item.quantity}x)`);
          });
        }

        // Delete all cart items
        const cartDeleteResult = await cartCollection.deleteMany({ userId: firebaseUid });

        console.log("🗑️ Delete result:", {
          acknowledged: cartDeleteResult.acknowledged,
          deletedCount: cartDeleteResult.deletedCount
        });

        // Verify deletion
        const verifyItems = await cartCollection.find({ userId: firebaseUid }).toArray();
        console.log("✅ Remaining items after delete:", verifyItems.length);

        if (verifyItems.length === 0) {
          console.log("🎉 CART SUCCESSFULLY DELETED!");
        } else {
          console.error("❌ CART ITEMS STILL EXIST AFTER DELETE!");
        }
      } finally {
        await cartClient.close();
      }

      console.log("========================================\n");
    } catch (cartError: any) {
      console.error("\n========================================");
      console.error("❌ CART DELETION ERROR");
      console.error("========================================");
      console.error("Error:", cartError.message);
      console.error("Stack:", cartError.stack);
      console.error("========================================\n");
      // Don't fail the order if cart clearing fails
    }

    // Send Order Confirmation Email
    const userEmail = user.email;
    console.log(`📧 Attempting to send order email to: ${userEmail}`);

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
               <p><strong>Total Paid:</strong> ₹${totalAmount}</p>
               <p><strong>Joy Points Earned:</strong> ${joyPoints}</p>
            </div>
            <p>We'll notify you when it ships!</p>
            <p>- Team Joy Juncture</p>
          </div>
        `
      });
    } else {
      console.warn("⚠️ No email found for user, skipping order confirmation email.");
    }

    return NextResponse.json({
      success: true,
      orderIds: orders.map((o) => o._id.toString()),
      ordersCreated: orders.length,
      joyPointsEarned: joyPoints,
      totalAmount: totalAmount,
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