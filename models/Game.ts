import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: String,
  description: String,
  regularPrice: String,
  salePrice: String,
  category: [{ type: String }],
  players: String,
  duration: String,
  features: [{ type: String }],
  imageUrl: String,
  image: String,
  createdBy: {
    userId: String,
    userEmail: String,
    userRole: String,
  },
  lastEditedBy: String,
  status: { type: String, default: 'active' },
  isPublished: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);
