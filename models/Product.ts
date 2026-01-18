// models/Product.ts - COMPLETE SCHEMA WITH MULTIPLE IMAGES
import mongoose, { Schema, model, models } from "mongoose";

const howToPlaySchema = new Schema(
  {
    setup: { type: String, required: true },
    gameplay: { type: String, required: true },
    winning: { type: String, required: true },
  },
  { _id: false },
);

const videoSchema = new Schema(
  {
    url: { type: String },
    provider: { type: String },
  },
  { _id: false },
);

// NEW: Multiple Images Schema
const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    thumbnail: { type: String, required: true },
    images: [{ type: String }],
    video: videoSchema,
  },
  { _id: false },
);

const metaSchema = new Schema(
  {
    players: { type: String, required: true },
    duration: { type: String, required: true },
    age: { type: String, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ["Very Easy", "Easy", "Medium", "Hard"],
    },
    moods: [{ type: String }],
    badges: [{ type: String }],
  },
  { _id: false },
);

const priceSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
  },
  { _id: false },
);

const pointsSchema = new Schema(
  {
    purchase: { type: Number, default: 0 },
  },
  { _id: false },
);

const stockSchema = new Schema(
  {
    available: { type: Boolean, default: true },
    quantity: { type: Number, default: 0 },
  },
  { _id: false },
);

const faqSchema = new Schema(
  {
    question: { type: String },
    answer: { type: String },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    story: { type: String, required: true },

    // NEW: Multiple Images Support
    images: [imageSchema],

    howToPlay: { type: howToPlaySchema, required: true },
    meta: { type: metaSchema, required: true },
    price: { type: priceSchema, required: true },
    points: { type: pointsSchema, default: () => ({ purchase: 0 }) },
    media: { type: mediaSchema, required: true },
    stock: {
      type: stockSchema,
      default: () => ({ available: true, quantity: 0 }),
    },

    keyFeatures: [{ type: String }],
    faqs: [faqSchema],
    whatYouGet: [{ type: String }],

    category: [{ type: String }],
    gametype: {
      type: String,
      enum: ["board-game", "card-game"],
      default: "board-game",
      index: true,
    },
    relatedSlugs: [{ type: String }],
  },
  { timestamps: true },
);

// Text search index
productSchema.index({
  name: "text",
  shortDescription: "text",
  story: "text",
});

// Pre-save hook to ensure at least one primary image
productSchema.pre("save", function (next) {
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some((img) => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }

    // Update media.thumbnail with primary image for backward compatibility
    const primaryImage = this.images.find((img) => img.isPrimary);
    if (primaryImage && this.media) {
      this.media.thumbnail = primaryImage.url;
    }
  }
});

const Product = models.Product || model("Product", productSchema);

export default Product;
