import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";
import "@/models/Order";
import "@/models/Registration";

export async function GET(req: NextRequest) {
    try {
        await connectDb();
        const Order = mongoose.models.Order;
        const Registration = mongoose.models.Registration;

        const sampleOrder = await Order.findOne({ paymentStatus: 'completed' }).sort({ createdAt: -1 });
        const sampleReg = await Registration.findOne({ paymentStatus: 'completed' }).sort({ createdAt: -1 });

        // Aggregations to see what status fields exist
        const orderStatuses = await Order.aggregate([
            { $group: { _id: "$paymentStatus", count: { $sum: 1 }, total: { $sum: "$totalAmount" } } }
        ]);

        const regStatuses = await Registration.aggregate([
            { $group: { _id: { paymentStatus: "$paymentStatus", status: "$status" }, count: { $sum: 1 }, total: { $sum: "$amount" } } }
        ]);

        return NextResponse.json({
            sampleOrder,
            sampleReg,
            orderStatuses,
            regStatuses
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
