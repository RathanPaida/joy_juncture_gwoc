import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  eventId: mongoose.Schema.Types.ObjectId,
  paymentId: String,
  amount: Number
}, { timestamps: true });

export default mongoose.models.Registration || mongoose.model("Registration", RegistrationSchema);
