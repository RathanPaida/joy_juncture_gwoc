// app/api/orders/create/route.ts - COMPLETE WITH CART CLEARING
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User, Transaction } from "@/models/User";
import { verifyIdToken } from "@/lib/firebase-admin";
import { MongoClient } from "mongodb";
import { sendOrderConfirmationEmail } from "@/lib/email";

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

    const { cartItems, shippingAddress, paymentMethod, total, promoCode, discountAmount } =
      await request.json();

    if (!cartItems || !shippingAddress || !paymentMethod || !cartItems.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user
    let user = await User.findOne({ firebaseUid: firebaseUid });

    // JIT USER CREATION: If user not found but token valid, create them now
    if (!user) {
      console.log('⚠️ User not found in MongoDB during COD order. Creating JIT user:', firebaseUid);
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
        console.log('✅ JIT User created successfully (COD):', user._id);
      } catch (createError) {
        console.error('❌ Failed to create JIT user (COD):', createError);
        return NextResponse.json(
          {
            error:
              "User not found and failed to create profile. Please contact support.",
          },
          { status: 500 },
        );
      }
    }

    /* 
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
    */

    console.log("📦 Creating orders for", cartItems.length, "items");

    const orders = [];
    for (const item of cartItems) {
      const itemTotal = item.price * (item.quantity || 1);

      const orderData = {
        userId: user._id.toString(),
        firebaseUid: firebaseUid,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity || 1,
        totalAmount: itemTotal,
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
        trackingNumber: `${paymentMethod === "cod" ? "COD" : "ORD"}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        purchaseDate: new Date(),
        paidAt: paymentMethod === "cod" ? null : new Date(),
        promoCode: promoCode || null,
        discountAmount: discountAmount || 0,
      };

      const order = await Order.create(orderData);
      orders.push(order);
      console.log("✅ Order created:", order._id);
    }

    const totalAmount = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    console.log("💰 Total amount:", totalAmount);

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

    if (!userUpdate) {
      console.error('❌ CRITICAL: User not found for COD points update!', firebaseUid);
    } else {
      console.log("✅ User wallet updated (COD). New Balance:", userUpdate.walletBalance);
      console.log("✅ User points updated (COD). New Total:", userUpdate.totalPoints);
    }

    // Mark coupon as used if promo code provided
    if (promoCode) {
      try {
        await User.updateOne(
          { firebaseUid: firebaseUid, "redeemedCoupons.code": promoCode },
          { $set: { "redeemedCoupons.$.isUsed": true } }
        );
        console.log("✅ Coupon marked as used:", promoCode);
      } catch (err) {
        console.error("❌ Failed to mark coupon as used:", err);
      }
    }

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

    // Send order confirmation email for COD orders
    if (paymentMethod === "cod") {
      try {
        const userEmail = shippingAddress.email;
        const userName = shippingAddress.fullName || user.name || "Valued Customer";

        // Prepare items for email
        const emailItems = orders.flatMap(order =>
          order.items.map((item: any) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.price
          }))
        );

        // Send email
        await sendOrderConfirmationEmail(
          userEmail,
          userName,
          orders.map(o => o._id.toString()).join(", "), // Pass all order IDs
          total, // Total amount
          emailItems
        );
        console.log("📧 Sent COD order confirmation email to:", userEmail);
      } catch (emailError) {
        console.error("❌ Failed to send COD order email:", emailError);
        // Continue, don't fail the request
      }
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