// models/Booking.ts
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  package: { type: String, required: true },
  date: { type: String, required: true },
  
  // Event details
  eventType: { type: String, default: '' },
  guestCount: { type: String, default: '' },
  duration: { type: String, default: '' },
  selectedGames: [{ type: String }],
  notes: { type: String, default: '' },
  
  // Admin fields
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending' 
  },
  consulted: { type: Boolean, default: false },
  
  // Additional info
  totalPrice: { type: String, default: '' },
  bookingDate: { type: Date, default: Date.now },
  
  // Audit
  createdBy: {
    userId: String,
    userEmail: String,
    userRole: String,
  },
  lastEditedBy: String
}, {
  timestamps: true
});

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);