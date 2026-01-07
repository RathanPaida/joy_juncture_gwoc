// models/User.ts - UPDATED WITH ADMIN ROLES
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'viewer' | 'editor' | 'admin' | 'super_admin';
  firebaseUid?: string;
  authProvider: 'local' | 'firebase' | 'google';
  totalPoints: number;
  level: number;
  streak: number;
  lastActivity?: Date;
  achievements: Array<{
    achievementId: string;
    unlocked: boolean;
    progress: number;
    unlockedAt?: Date;
  }>;
  walletBalance: number;
  referralCode?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin', 'super_admin'],
    default: 'viewer'
  },
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'firebase', 'google'],
    default: 'local'
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  achievements: [{
    achievementId: {
      type: String,
      required: true
    },
    unlocked: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: 0
    },
    unlockedAt: Date
  }],
  walletBalance: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: String,
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ role: 1 });

// Generate referral code before saving
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = `JJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
});

// Transaction Schema
export interface ITransaction extends Document {
  userId: string;
  type: 'purchase' | 'event' | 'game' | 'referral' | 'bonus' | 'redeem' | 'daily' | 'manual';
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: any;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['purchase', 'event', 'game', 'referral', 'bonus', 'redeem', 'daily', 'manual']
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceId: String,
  metadata: Schema.Types.Mixed,
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });

// Export models
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
