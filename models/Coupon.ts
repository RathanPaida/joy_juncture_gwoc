// models/Coupon.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
    code: string;
    name: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minPurchaseAmount?: number;
    id: string;
    maxDiscountAmount?: number;
    coinsRequired: number; // Coins required to redeem this coupon
    expiryDate: Date;
    usageLimit: number; // Total times coupon can be used
    usagePerUser: number; // Max times per user
    usedCount: number;
    usedBy: Array<{
        userId: string;
        usedCount: number;
        lastUsedAt: Date;
    }>;
    isActive: boolean;
    category: string;
    applicableProducts?: string[];
    applicableCategories?: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        minPurchaseAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxDiscountAmount: {
            type: Number,
            min: 0,
        },
        coinsRequired: {
            type: Number,
            default: 0,
            min: 0,
        },
        expiryDate: {
            type: Date,
            required: true,
            index: true,
        },
        usageLimit: {
            type: Number,
            required: true,
            min: 1,
            default: 1000,
        },
        usagePerUser: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        usedBy: [
            {
                userId: {
                    type: String,
                    required: true,
                },
                usedCount: {
                    type: Number,
                    default: 0,
                },
                lastUsedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["general", "product", "event", "seasonal", "first_order", "referral"],
            default: "general",
        },
        applicableProducts: [String],
        applicableCategories: [String],
        createdBy: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 });
couponSchema.index({ category: 1 });
couponSchema.index({ "usedBy.userId": 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
    if (!this.isActive) return false;
    if (new Date() > this.expiryDate) return false;
    if (this.usedCount >= this.usageLimit) return false;
    return true;
};

// Method to check if user can use coupon
couponSchema.methods.canUserUse = function (userId: string) {
    if (!this.isValid()) return false;

    const userUsage = this.usedBy.find((u: any) => u.userId === userId);
    if (!userUsage) return true;

    return userUsage.usedCount < this.usagePerUser;
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (amount: number) {
    if (!this.isValid()) return 0;
    if (amount < (this.minPurchaseAmount || 0)) return 0;

    let discount = 0;
    if (this.discountType === "percentage") {
        discount = (amount * this.discountValue) / 100;
        if (this.maxDiscountAmount) {
            discount = Math.min(discount, this.maxDiscountAmount);
        }
    } else {
        discount = this.discountValue;
    }

    return Math.min(discount, amount);
};

// Method to record usage
couponSchema.methods.recordUsage = async function (userId: string) {
    const userUsageIndex = this.usedBy.findIndex((u: any) => u.userId === userId);

    if (userUsageIndex === -1) {
        this.usedBy.push({
            userId,
            usedCount: 1,
            lastUsedAt: new Date(),
        });
    } else {
        this.usedBy[userUsageIndex].usedCount += 1;
        this.usedBy[userUsageIndex].lastUsedAt = new Date();
    }

    this.usedCount += 1;
    await this.save();
};

export const Coupon =
    mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema, "coupons");
