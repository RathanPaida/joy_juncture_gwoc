import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import mongoose from "mongoose";
// Import models for side-effects to ensure they are registered
import "@/models/Order";
import "@/models/Registration";
import { startOfMonth, subMonths, format } from "date-fns";

export async function GET(req: NextRequest) {
    try {
        await connectDb();

        // Access models directly from mongoose registry
        const Order = mongoose.models.Order;
        const Registration = mongoose.models.Registration;

        if (!Order) throw new Error("Order model not registered (check imports)");
        if (!Registration) throw new Error("Registration model not registered (check imports)");

        const now = new Date();

        // 1. Product Revenue - Gross (Sum of ALL orders)
        const productRevenueAgg = await Order.aggregate([
            // Removed filter to show ALL revenue as requested
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);
        const productRevenue = productRevenueAgg[0]?.total || 0;

        // 2. Event Revenue - Gross (Sum of ALL registrations)
        const eventRevenueAgg = await Registration.aggregate([
            // Removed filter to show ALL revenue
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);
        const eventRevenue = eventRevenueAgg[0]?.total || 0;

        // 3. Total Revenue
        const totalRevenue = productRevenue + eventRevenue;

        // 4. Revenue Trend (Last 6 Months)
        const revenueTrend = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const nextMonthStart = startOfMonth(subMonths(now, i - 1));

            // Monthly Product Revenue
            const monthlyProduct = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthStart, $lt: nextMonthStart }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalAmount" }
                    }
                }
            ]);

            // Monthly Event Revenue
            const monthlyEvent = await Registration.aggregate([
                {
                    $match: {
                        createdAt: { $gte: monthStart, $lt: nextMonthStart }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }
                }
            ]);

            const pRev = monthlyProduct[0]?.total || 0;
            const eRev = monthlyEvent[0]?.total || 0;

            revenueTrend.push({
                name: format(monthStart, "MMM"),
                revenue: pRev + eRev,
                product: pRev,
                event: eRev
            });
        }

        // 5. Top Products - Based on quantity sold from completed orders
        const topProducts = await Order.aggregate([
            {
                $match: {
                    $or: [
                        { paymentStatus: "completed" },
                        { paymentMethod: "cod", orderStatus: { $ne: "cancelled" } }
                    ]
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productName",
                    sales: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            },
            { $sort: { sales: -1 } },
            { $limit: 5 }
        ]);

        const productData = topProducts.map((p: any) => ({
            name: p._id || "Unknown Product",
            value: p.sales
        }));

        // 6. Order Status Distribution
        const orderStatus = await Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusData = orderStatus.map((s: any) => {
            const status = s._id ? String(s._id) : "unknown";
            return {
                name: status.charAt(0).toUpperCase() + status.slice(1),
                value: s.count
            };
        });

        // 7. Additional Stats for debugging
        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({
            $or: [
                { paymentStatus: "completed" },
                { paymentMethod: "cod", orderStatus: { $ne: "cancelled" } }
            ]
        });
        const totalRegistrations = await Registration.countDocuments();
        const completedRegistrations = await Registration.countDocuments({
            paymentStatus: "completed"
        });

        return NextResponse.json({
            totalRevenue,
            productRevenue,
            eventRevenue,
            revenueTrend,
            productData,
            statusData,
            // Debug info
            debug: {
                totalOrders,
                completedOrders,
                totalRegistrations,
                completedRegistrations
            }
        });

    } catch (error: any) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}