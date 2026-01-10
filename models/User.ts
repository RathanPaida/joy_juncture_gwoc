// models/User.ts - UPDATED WITH COMMUNITY AND DISCUSSION FEATURES
import mongoose, { Schema, Document, Types } from 'mongoose';

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
  
  // Blog-related fields
  likedBlogs: string[];
  bookmarkedBlogs: string[];
  
  // Community-related fields (NEW)
  likedDiscussions: string[]; // Discussion IDs user has liked
  likedReplies: string[]; // Reply IDs user has liked
  discussionsCreated: string[]; // Discussion IDs user has created
  repliesCreated: string[]; // Reply IDs user has created
  communityPoints: number; // Points earned from community activities
  badges: Array<{
    badgeId: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
  }>;
  isBanned: boolean;
  banReason?: string;
  banExpires?: Date;
  warnings: number;
  
  // Statistics
  discussionCount: number;
  replyCount: number;
  totalLikesReceived: number;
  totalRepliesReceived: number;
  
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
      default: 0,
      min: 0,
      max: 100
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
  },
  
  // Blog-related fields
  likedBlogs: {
    type: [String],
    default: []
  },
  bookmarkedBlogs: {
    type: [String],
    default: []
  },
  
  // Community-related fields (NEW)
  likedDiscussions: {
    type: [String],
    default: []
  },
  likedReplies: {
    type: [String],
    default: []
  },
  discussionsCreated: {
    type: [String],
    default: []
  },
  repliesCreated: {
    type: [String],
    default: []
  },
  communityPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [{
    badgeId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banExpires: Date,
  warnings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Statistics
  discussionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  replyCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalLikesReceived: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRepliesReceived: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ role: 1 });
userSchema.index({ communityPoints: -1 }); // For leaderboard queries
userSchema.index({ discussionCount: -1 }); // For top contributors
userSchema.index({ 'badges.badgeId': 1 }); // For badge queries
userSchema.index({ isBanned: 1, warnings: 1 }); // For admin moderation

// Generate referral code before saving
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = `JJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  
  // Update total points to include community points
  if (this.isModified('communityPoints')) {
    const oldTotal = this.totalPoints - this.communityPoints;
    this.totalPoints = oldTotal + this.communityPoints;
  }
});

// Virtual for total community contributions
userSchema.virtual('totalContributions').get(function() {
  return this.discussionCount + this.replyCount;
});

// Method to award community points
userSchema.methods.awardCommunityPoints = async function(
  points: number,
  reason: string,
  transactionType?: 'discussion' | 'reply' | 'like' | 'achievement'
) {
  this.communityPoints += points;
  this.totalPoints += points;
  
  // Create transaction record
  const transaction = await Transaction.create({
    userId: this._id,
    type: 'bonus',
    amount: points,
    description: `Community: ${reason}`,
    metadata: {
      communityType: transactionType || 'general',
      reason: reason
    },
    balanceAfter: this.communityPoints,
    status: 'completed'
  });
  
  await this.save();
  return transaction;
};

// Method to add badge
userSchema.methods.addBadge = async function(
  badgeId: string,
  name: string,
  description: string,
  icon: string
) {
  const existingBadge = this.badges.find((b: { badgeId: string; }) => b.badgeId === badgeId);
  if (!existingBadge) {
    this.badges.push({
      badgeId,
      name,
      description,
      icon,
      earnedAt: new Date()
    });
    await this.save();
  }
  return this;
};

// Method to track discussion creation
userSchema.methods.trackDiscussionCreation = async function(discussionId: string) {
  if (!this.discussionsCreated.includes(discussionId)) {
    this.discussionsCreated.push(discussionId);
    this.discussionCount += 1;
    await this.save();
  }
  return this;
};

// Method to track reply creation
userSchema.methods.trackReplyCreation = async function(replyId: string) {
  if (!this.repliesCreated.includes(replyId)) {
    this.repliesCreated.push(replyId);
    this.replyCount += 1;
    await this.save();
  }
  return this;
};

// Method to check if user has liked a discussion
userSchema.methods.hasLikedDiscussion = function(discussionId: string): boolean {
  return this.likedDiscussions.includes(discussionId);
};

// Method to check if user has liked a reply
userSchema.methods.hasLikedReply = function(replyId: string): boolean {
  return this.likedReplies.includes(replyId);
};

// Transaction Schema
export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: 'purchase' | 'event' | 'game' | 'referral' | 'bonus' | 'redeem' | 'daily' | 'manual' | 'community';
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: {
    communityType?: 'discussion' | 'reply' | 'like' | 'achievement' | 'badge';
    discussionId?: string;
    replyId?: string;
    badgeId?: string;
    reason?: string;
  };
  balanceAfter: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['purchase', 'event', 'game', 'referral', 'bonus', 'redeem', 'daily', 'manual', 'community']
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
transactionSchema.index({ 'metadata.communityType': 1 });

// Static method to get community leaderboard
userSchema.statics.getCommunityLeaderboard = async function(limit = 10) {
  return this.find({ isActive: true, isBanned: false })
    .select('name avatar communityPoints discussionCount replyCount badges totalLikesReceived level')
    .sort({ communityPoints: -1 })
    .limit(limit)
    .lean();
};

// Static method to get top contributors
userSchema.statics.getTopContributors = async function(limit = 10) {
  return this.find({ isActive: true, isBanned: false })
    .select('name avatar discussionCount replyCount totalLikesReceived communityPoints')
    .sort({ discussionCount: -1, replyCount: -1 })
    .limit(limit)
    .lean();
};

// Export models
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);

// Type for user without sensitive data
export type SafeUser = Omit<IUser, 'password' | 'firebaseUid' | 'email' | 'walletBalance'> & {
  _id: string;
  email?: string;
};