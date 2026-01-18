// models/Cart.ts - VERIFIED VERSION
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
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
    default: 1,
    min: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Schema end
// Delete existing model if it exists (for hot reloading)
if (mongoose.models.Cart) {
  delete mongoose.models.Cart;
}

export const Cart = mongoose.model("Cart", cartSchema);

// Default export as well
export default Cart;