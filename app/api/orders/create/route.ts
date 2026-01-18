// app/api/orders/create/route.ts - UPDATED WITH NEW COUPON SYSTEM
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User, Transaction } from "@/models/User";
import { Coupon } from "@/models/Coupon";
import { verifyIdToken } from "@/lib/firebase-admin";
import { MongoClient } from "mongodb";
// Unified Email Import
import { sendOrderConfirmationEmail } from "@/lib/email";
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

    // UNIFIED Input Parsing
    const body = await request.json();
    const {
      cartItems,
      shippingAddress,
      paymentMethod,
      total,
      promoCode,
      couponCode,
      discountAmount: clientDiscount
    } = body;

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

    // Validate Coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;
    const finalCodeToCheck = couponCode || promoCode;

    if (finalCodeToCheck) {
      const codeToCheck = finalCodeToCheck.toUpperCase();

      // 1. Check User Redeemed Coupons first
      const userCouponEntry = user.redeemedCoupons?.find((c: any) => c.code === codeToCheck && !c.isUsed);

      let coupon = null;

      if (userCouponEntry) {
        if (userCouponEntry.rewardId) {
          coupon = await Coupon.findById(userCouponEntry.rewardId);
        }
        if (!coupon) {
          coupon = await Coupon.findOne({ code: codeToCheck });
        }
      } else {
        // 2. Check Public Coupons
        coupon = await Coupon.findOne({ code: codeToCheck });
        // If public and requires coins, deny if not in user list? 
        if (coupon && coupon.coinsRequired > 0) {
          coupon = null; // Deny direct use if it requires coins and wasn't in redeemed list
        }
      }

      if (coupon) {
        if (coupon.isValid() && coupon.canUserUse(firebaseUid)) {
          // Calculate subtotal
          const subtotal = cartItems.reduce(
            (sum: number, item: CartItem) => sum + item.price * (item.quantity || 1),
            0
          );

          if (subtotal >= (coupon.minPurchaseAmount || 0)) {
            discountAmount = coupon.calculateDiscount(subtotal);
            appliedCoupon = coupon;
            console.log(`🎟️ Coupon ${finalCodeToCheck} applied (COD). Discount: ₹${discountAmount}`);
          }
        }
      }
    }

    // Override if client sends a trusted discount (validated by middleware ideally)
    if (clientDiscount && clientDiscount > discountAmount) {
      discountAmount = clientDiscount;
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
        promoCode: finalCodeToCheck || null,
        discountAmount: discountAmount || 0,
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

    if (!userUpdate) {
      console.error('❌ CRITICAL: User not found for COD points update!', firebaseUid);
    } else {
      console.log("✅ User wallet updated (COD). New Balance:", userUpdate.walletBalance);
      console.log("✅ User points updated (COD). New Total:", userUpdate.totalPoints);
    }

    // Mark coupon as used if promo code provided
    if (finalCodeToCheck) {
      try {
        await User.updateOne(
          { firebaseUid: firebaseUid, "redeemedCoupons.code": finalCodeToCheck },
          { $set: { "redeemedCoupons.$.isUsed": true } }
        );
        console.log("✅ Coupon marked as used:", finalCodeToCheck);
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
    console.log("FirebaseUid:", firebaseUid);

    try {
      const cartClient = new MongoClient(process.env.MONGODB_URI!);
      await cartClient.connect();

      try {
        const db = cartClient.db("joyjuncture");
        const cartCollection = db.collection("cart");

        // Find all cart items for this user - Unified Logging
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

        const verifyItems = await cartCollection.find({ userId: firebaseUid }).toArray();
        console.log("✅ Remaining items after delete:", verifyItems.length);

        if (verifyItems.length === 0) {
          console.log("🎉 CART SUCCESSFULLY DELETED!");
        }
      } finally {
        await cartClient.close();
      }

      console.log("========================================\n");
    } catch (cartError: any) {
      console.error("❌ CART DELETION ERROR:", cartError.message);
    }

    // Unify email sending
    const userEmail = user.email;
    if (userEmail) {
      // 1. Send Generic Receipt (Backup)
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

    // Send order confirmation email for COD orders (using Template)
    if (paymentMethod === "cod" && shippingAddress.email) {
      try {
        const emailItems = orders.flatMap(order =>
          order.items.map((item: any) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.price
          }))
        );

        if (sendOrderConfirmationEmail) {
          await sendOrderConfirmationEmail(
            shippingAddress.email,
            shippingAddress.fullName || user.name || "Valued Customer",
            orders.map(o => o._id.toString()).join(", "),
            totalAmount,
            emailItems
          );
          console.log("📧 Sent COD order confirmation email (Template) to:", shippingAddress.email);
        }
      } catch (emailError) {
        console.error("❌ Failed to send COD order email template:", emailError);
      }
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