// models/GameImage.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IGameImage extends Document {
  name: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GameImageSchema = new Schema<IGameImage>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for the game image"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Please provide an image URL"],
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const GameImage =
  mongoose.models.GameImage || mongoose.model<IGameImage>("GameImage", GameImageSchema);

export default GameImage;