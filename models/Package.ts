import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: String,
  duration: String,
  guestRange: String,
  category: String,
  includes: {
    food: [{ type: String }],
    planning: [{ type: String }],
    sound: [{ type: String }],
    photography: [{ type: String }],
    games: [{ type: String }]
  },
  bestFor: String,
  color: String,
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

export const Package = mongoose.models.Package || mongoose.model('Package', packageSchema);