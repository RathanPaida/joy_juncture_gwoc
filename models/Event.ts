import mongoose from 'mongoose';

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
    default: '', // Empty string means no collaboration
  },
  Venue: {
    type: String,
    default: '',
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  gallery: {
    type: [String],
    default: [],
  },
  postEventDescription: {
    type: String,
    default: '',
  },
});

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  coins: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  razorpayPaymentId: {
    type: String,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  coinsEarned: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  referenceId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);