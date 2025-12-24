// models/Product.ts
import mongoose, { Schema, models, model } from "mongoose";

const howToPlaySchema = new Schema(
  {
    setup: { type: String, required: true },
    gameplay: { type: String, required: true },
    winning: { type: String, required: true },
  },
  { _id: false }
);

const videoSchema = new Schema(
  {
    url: { type: String },
    provider: { type: String },
  },
  { _id: false }
);

const mediaSchema = new Schema(
  {
    thumbnail: { type: String, required: true },
    images: [{ type: String }],
    video: videoSchema,
  },
  { _id: false }
);

const metaSchema = new Schema(
  {
    players: { type: String, required: true },     // "2–8"
    duration: { type: String, required: true },    // "15–20 mins"
    age: { type: String, required: true },         // "14+"
    difficulty: { type: String, required: true },  // "Easy"
    moods: [{ type: String }],                     // ["party", "chaotic"]
    badges: [{ type: String }],                    // ["first-time-friendly"]
  },
  { _id: false }
);

const priceSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const pointsSchema = new Schema(
  {
    purchase: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, required: true },
    story: { type: String, required: true },
    howToPlay: { type: howToPlaySchema, required: true },
    meta: { type: metaSchema, required: true },
    price: { type: priceSchema, required: true },
    points: { type: pointsSchema, default: () => ({ purchase: 0 }) },
    media: { type: mediaSchema, required: true },
    category: [{ type: String }],      // e.g. ["card-game","party"]
    relatedSlugs: [{ type: String }],  // for related games carousel
  },
  { timestamps: true }
);

// Optional: simple text index for search
productSchema.index({ name: "text", shortDescription: "text", story: "text" });

const Product = models.Product || model("Product", productSchema);

export default Product;
