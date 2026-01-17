// ================================================================
// FILE 1: models/Order.ts
// ================================================================
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    default: "India",
  },
});

const orderSchema = new mongoose.Schema(
  {
    // MongoDB User ID (required)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Firebase User ID (REQUIRED)
    firebaseUid: {
      type: String,
      required: true,
      index: true,
    },

    // Primary product info (REQUIRED)
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },

    // Total amount (REQUIRED)
    totalAmount: {
      type: Number,
      required: true,
    },

    // All items in the order
    items: [orderItemSchema],

    // Shipping information
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Payment details
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Order status
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    // Razorpay IDs
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },

    // Pricing breakdown
    subtotal: {
      type: Number,
      required: false,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    promoCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },

    // Dates
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Tracking
    trackingNumber: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ firebaseUid: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);