import mongoose, { Schema, Model, HydratedDocument, ApplyBasicQueryCasting } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Condition } from 'mongodb';

// Simplified interfaces without complex Mongoose types
interface IUserAchievement {
  achievementId: string; // Store as string
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
}

interface IUserAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

// Transaction interface
export interface ITransaction {
  userId: string; // Store as string
  type: 'purchase' | 'event' | 'game' | 'referral' | 'bonus' | 'daily' | 'redeem' | 'admin';
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: any;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  balanceAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

// User interface
export interface IUser {
  _id: Condition<ApplyBasicQueryCasting<string>> | undefined;
  email: string;
  name: string;
  password?: string;
  firebaseUid?: string;
  authProvider: 'local' | 'firebase' | 'google' | 'facebook';
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  lastLogin?: Date;
  isActive: boolean;
  emailVerified: boolean;
  totalPoints: number;
  level: number;
  streak: number;
  lastActivity: Date;
  achievements: IUserAchievement[];
  walletBalance: number;
  referralCode: string;
  referredBy?: string; // Store as string
  phone?: string;
  address?: IUserAddress;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Achievement Schema
const AchievementSchema = new Schema<IUserAchievement>({
  achievementId: { type: String, required: true },
  unlocked: { type: Boolean, default: false },
  progress: { type: Number, default: 0, min: 0 },
  unlockedAt: Date
}, { _id: false });

// Address Schema
const AddressSchema = new Schema<IUserAddress>({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String
}, { _id: false });

// Transaction Schema - SIMPLIFIED
const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['purchase', 'event', 'game', 'referral', 'bonus', 'daily', 'redeem', 'admin'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceId: {
    type: String,
    index: true
  },
  metadata: Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'refunded'],
    default: 'completed'
  },
  balanceAfter: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for Transaction
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });

// Transaction model interface - SIMPLIFIED
export interface TransactionModel extends Model<ITransaction> {
  createTransaction(
    userId: string,
    type: ITransaction['type'],
    amount: number,
    description: string,
    referenceId?: string,
    metadata?: any
  ): Promise<ITransaction>;
  
  getUserTransactions(
    userId: string,
    limit?: number,
    skip?: number
  ): Promise<ITransaction[]>;
  
  getTransactionSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEarned: number;
    totalRedeemed: number;
    totalBonus: number;
    transactionCount: number;
  }>;
}

// Transaction static methods - SIMPLIFIED
TransactionSchema.statics.createTransaction = async function(
  userId: string,
  type: ITransaction['type'],
  amount: number,
  description: string,
  referenceId?: string,
  metadata?: any
): Promise<ITransaction> {
  // Get user to calculate balance after
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const balanceAfter = (user.totalPoints || 0) + amount;
  
  const transaction = new this({
    userId,
    type,
    amount,
    description,
    referenceId,
    metadata,
    balanceAfter,
    status: 'completed'
  });
  
  // Update user's total points
  user.totalPoints = balanceAfter;
  await user.save();
  
  const savedTransaction = await transaction.save();
  return savedTransaction.toObject();
};

TransactionSchema.statics.getUserTransactions = async function(
  userId: string,
  limit: number = 20,
  skip: number = 0
): Promise<ITransaction[]> {
  const transactions = await this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  return transactions;
};

TransactionSchema.statics.getTransactionSummary = async function(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalEarned: number;
  totalRedeemed: number;
  totalBonus: number;
  transactionCount: number;
}> {
  const query: any = { userId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  const transactions = await this.find(query).lean();
  
  const summary = transactions.reduce((acc: { transactionCount: number; totalBonus: any; totalEarned: any; totalRedeemed: number; }, transaction: { amount: number; type: string; }) => {
    acc.transactionCount++;
    
    if (transaction.amount > 0) {
      if (transaction.type === 'bonus') {
        acc.totalBonus += transaction.amount;
      } else {
        acc.totalEarned += transaction.amount;
      }
    } else {
      acc.totalRedeemed += Math.abs(transaction.amount);
    }
    
    return acc;
  }, {
    totalEarned: 0,
    totalRedeemed: 0,
    totalBonus: 0,
    transactionCount: 0
  });
  
  return summary;
};

// Main User Schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 8,
    required: function() {
      return (this as any).authProvider === 'local';
    }
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'firebase', 'google', 'facebook'],
    default: 'local',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  avatar: {
    type: String,
    default: '/assets/default-avatar.png'
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  totalPoints: {
    type: Number,
    default: 100,
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
  achievements: [AchievementSchema],
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String
  },
  phone: String,
  address: AddressSchema,
  dateOfBirth: Date
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.firebaseUid;
      return ret;
    }
  }
});

// Pre-save hook - FIXED
UserSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.authProvider === 'local' && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
      return (error);
    }
  }
  
  if (!this.referralCode) {
    this.referralCode = `JJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  
  if (this.isModified('totalPoints')) {
    const newLevel = Math.max(1, Math.floor((this.totalPoints || 0) / 1000) + 1);
    if (newLevel !== this.level) {
      this.level = newLevel;
    }
  }
  
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (this.authProvider !== 'local' || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code method
UserSchema.methods.generateReferralCode = function(): string {
  return `JJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// Can redeem reward method
UserSchema.methods.canRedeemReward = function(pointsRequired: number): boolean {
  return (this.totalPoints || 0) >= pointsRequired;
};

// Add points method (creates transaction automatically) - SIMPLIFIED
UserSchema.methods.addPoints = async function(
  type: ITransaction['type'],
  amount: number,
  description: string,
  referenceId?: string,
  metadata?: any
): Promise<ITransaction> {
  const transaction = await Transaction.createTransaction(
    this._id.toString(),
    type,
    amount,
    description,
    referenceId,
    metadata
  );
  
  // Update user's last activity
  this.lastActivity = new Date();
  await this.save();
  
  return transaction;
};

// Redeem points method - SIMPLIFIED
UserSchema.methods.redeemPoints = async function(
  points: number,
  rewardName: string,
  rewardId?: string
): Promise<ITransaction> {
  if ((this.totalPoints || 0) < points) {
    throw new Error('Insufficient points');
  }
  
  const transaction = await Transaction.createTransaction(
    this._id.toString(),
    'redeem',
    -points,
    `Redeemed: ${rewardName}`,
    rewardId,
    { rewardName, pointsRedeemed: points }
  );
  
  return transaction;
};

// Get user's transaction history
UserSchema.methods.getTransactionHistory = async function(
  limit: number = 20,
  skip: number = 0
): Promise<ITransaction[]> {
  return Transaction.getUserTransactions(this._id.toString(), limit, skip);
};

// Get transaction summary
UserSchema.methods.getTransactionSummary = async function(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalEarned: number;
  totalRedeemed: number;
  totalBonus: number;
  transactionCount: number;
}> {
  return Transaction.getTransactionSummary(this._id.toString(), startDate, endDate);
};

// Model type - SIMPLIFIED
export interface UserModel extends Model<IUser> {
  findOrCreateByFirebase(
    firebaseUid: string,
    email: string,
    name: string,
    avatar?: string
  ): Promise<IUser>;
  
  findByEmailOrFirebase(
    identifier: string
  ): Promise<IUser | null>;
  
  getLeaderboard(
    limit?: number
  ): Promise<IUser[]>;
}

// Static methods - SIMPLIFIED
UserSchema.statics.findOrCreateByFirebase = async function(
  firebaseUid: string,
  email: string,
  name: string,
  avatar?: string
): Promise<IUser> {
  // Try to find existing user by firebaseUid
  let user = await this.findOne({ firebaseUid });
  
  if (user) {
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    return user.toObject();
  }
  
  // Try to find by email (user might have signed up with local auth first)
  user = await this.findOne({ email: email.toLowerCase() });
  
  if (user) {
    // Link Firebase UID to existing account
    user.firebaseUid = firebaseUid;
    user.authProvider = 'firebase';
    user.lastLogin = new Date();
    if (avatar) user.avatar = avatar;
    await user.save();
    return user.toObject();
  }
  
  // Create new user
  user = new this({
    firebaseUid,
    email: email.toLowerCase(),
    name,
    avatar,
    authProvider: 'firebase',
    emailVerified: true
  });
  
  const savedUser = await user.save();
  return savedUser.toObject();
};

UserSchema.statics.findByEmailOrFirebase = async function(
  identifier: string
): Promise<IUser | null> {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { firebaseUid: identifier }
    ]
  });
  
  return user ? user.toObject() : null;
};

UserSchema.statics.getLeaderboard = async function(
  limit: number = 10
): Promise<IUser[]> {
  const users = await this.find({ isActive: true })
    .sort({ totalPoints: -1, level: -1 })
    .limit(limit)
    .select('name avatar totalPoints level achievements')
    .lean();
  
  return users;
};

// Export models
export const User = mongoose.models.User as UserModel || 
  mongoose.model<IUser, UserModel>('User', UserSchema);

export const Transaction = mongoose.models.Transaction as TransactionModel || 
  mongoose.model<ITransaction, TransactionModel>('Transaction', TransactionSchema);

// Export the complete file
export default {
  User,
  Transaction
};