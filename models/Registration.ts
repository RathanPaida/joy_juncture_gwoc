// import mongoose from "mongoose";

// const RegistrationSchema = new mongoose.Schema({
//   userId: mongoose.Schema.Types.ObjectId,
//   eventId: mongoose.Schema.Types.ObjectId,
//   paymentId: String,
//   amount: Number
// }, { timestamps: true });

// export default mongoose.models.Registration || mongoose.model("Registration", RegistrationSchema);

// models/Registration.ts - UPDATED WITH MORE FIELDS
import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  paymentId: String,
  orderId: String,
  amount: {
    type: Number,
    required: true
  },
  verificationCode: String,
  qrData: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  coinsAwarded: {
    type: Boolean,
    default: false
  },
  attendanceMarked: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Compound index to prevent duplicate registrations
RegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
