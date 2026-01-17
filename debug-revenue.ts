
import { connectDb } from "./lib/mongodb";
import mongoose from "mongoose";
// Import for side effects
import "./models/Order";
import "./models/Registration";

async function inspect() {
    await connectDb();
    const Order = mongoose.models.Order;
    const Registration = mongoose.models.Registration;

    console.log("--- ONE ORDER ---");
    const order = await Order.findOne({ paymentStatus: { $in: ['completed', 'paid', 'confirmed'] } }).sort({ createdAt: -1 });
    console.log(JSON.stringify(order, null, 2));

    console.log("--- ONE REGISTRATION ---");
    // Try finding one with typical success fields
    const reg = await Registration.findOne({
        $or: [
            { paymentStatus: 'completed' },
            { status: 'confirmed' },
            { paymentId: { $exists: true, $ne: '' } }
        ]
    }).sort({ createdAt: -1 });
    console.log(JSON.stringify(reg, null, 2));

    // Aggregate counts to see distribution
    console.log("--- REGISTRATION STATUSES ---");
    const regStats = await Registration.aggregate([
        { $group: { _id: { paymentStatus: "$paymentStatus", status: "$status" }, count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }
    ]);
    console.log(JSON.stringify(regStats, null, 2));

    process.exit(0);
}
inspect();
