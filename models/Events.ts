import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  collabWith: {
    type: String,
    default: "", // Empty string means no collaboration
  },
  Venue: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
  },
  coins: {
    type: Number,
    required: true,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Event =
  mongoose.models.Event || mongoose.model("Event", EventSchema);
