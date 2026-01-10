// models/Cart.ts - VERIFY THIS FILE EXISTS
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
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
      required: true,
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
    maxStock: {
      type: Number,
      default: null,
    },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Update the updatedAt field before saving
cartSchema.pre("save", function (next) {
  this.updatedAt = new Date();
});

export const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
