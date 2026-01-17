// models/User.ts - UPDATED WITH COMMUNITY AND DISCUSSION FEATURES
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: "viewer" | "editor" | "admin" | "super_admin";
  firebaseUid?: string;
  authProvider: "local" | "firebase" | "google";
  totalPoints: number;
  level: number;
  streak: number;
  lastLogin?: Date;
  lastDailyClaim?: Date;
  lastActivity?: Date;
  achievements: Array<{
    achievementId: string;
    unlocked: boolean;
    progress: number;
    unlockedAt?: Date;
  }>;
  redeemedCoupons: Array<{
    rewardId: string;
    code: string;
    name: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    discountAmount?: number; // Legacy support or alias
    limitAmount?: number; // Legacy?
    minOrderAmount: number;
    status: 'available' | 'used';
    isUsed: boolean; // Computed or redundant with status
    redeemedAt: Date;
    usedAt?: Date;
    expiryDate?: Date;
  }>;
  walletBalance: number;
  referralCode?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;

  // Blog-related fields
  likedBlogs: string[];
  bookmarkedBlogs: string[];

  // Community-related fields
  likedDiscussions: string[];
  likedReplies: string[];
  discussionsCreated: string[];
  repliesCreated: string[];
  communityPoints: number;
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

  // Game-related fields
  gamesPlayed: Array<{
    gameId: string;
    gameName: string;
    playedAt: Date;
    score?: number;
    pointsEarned: number;
    completed: boolean;
  }>;
  totalGamesPlayed: number;
  totalGamePoints: number;

  snakeHighScores?: {
    easy: number;
    medium: number;
    hard: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor", "admin", "super_admin"],
      default: "viewer",
    },
    firebaseUid: {
      type: String,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "firebase", "google"],
      default: "local",
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLogin: Date,
    lastDailyClaim: Date,
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    achievements: [
      {
        achievementId: {
          type: String,
          required: true,
        },
        unlocked: {
          type: Boolean,
          default: false,
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        unlockedAt: Date,
      },
    ],
    redeemedCoupons: {
      type: [
        {
          rewardId: String,
          code: String,
          name: String,
          description: String,
          discountType: {
            type: String,
            default: "fixed",
            enum: ["percentage", "fixed"],
          },
          discountValue: Number,
          discountAmount: Number, // Alias mainly
          minOrderAmount: {
            type: Number,
            default: 0,
          },
          status: {
            type: String,
            enum: ['available', 'used'],
            default: 'available'
          },
          isUsed: {
            type: Boolean,
            default: false,
          },
          redeemedAt: {
            type: Date,
            default: Date.now,
          },
          usedAt: Date,
          expiryDate: Date,
        },
      ],
      default: [],
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Blog-related fields
    likedBlogs: {
      type: [String],
      default: [],
    },
    bookmarkedBlogs: {
      type: [String],
      default: [],
    },

    // Community-related fields
    likedDiscussions: {
      type: [String],
      default: [],
    },
    likedReplies: {
      type: [String],
      default: [],
    },
    discussionsCreated: {
      type: [String],
      default: [],
    },
    repliesCreated: {
      type: [String],
      default: [],
    },
    communityPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    badges: [
      {
        badgeId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        icon: {
          type: String,
          required: true,
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: String,
    banExpires: Date,
    warnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Statistics
    discussionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLikesReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRepliesReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Game-related fields
    gamesPlayed: [
      {
        gameId: {
          type: String,
          required: true,
        },
        gameName: {
          type: String,
          required: true,
        },
        playedAt: {
          type: Date,
          default: Date.now,
        },
        score: {
          type: Number,
          default: 0,
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: true,
        },
      },
    ],
    totalGamesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGamePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    snakeHighScores: {
      type: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
      },
      default: () => ({
        easy: 0,
        medium: 0,
        hard: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ communityPoints: -1 });
userSchema.index({ discussionCount: -1 });
userSchema.index({ "badges.badgeId": 1 });
userSchema.index({ isBanned: 1, warnings: 1 });
userSchema.index({ "gamesPlayed.gameId": 1 });
userSchema.index({ totalGamesPlayed: -1 });
userSchema.index({ totalGamePoints: -1 });

// Generate referral code before saving
userSchema.pre("save", function (this: IUser, next) {
  if (!this.referralCode) {
    this.referralCode = `JJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Update total points to include community points
  if (this.isModified("communityPoints")) {
    const oldTotal = this.totalPoints - this.communityPoints;
    this.totalPoints = oldTotal + this.communityPoints;
  }

  // Update total points to include game points
  if (this.isModified("totalGamePoints")) {
    const oldCommunity = this.communityPoints || 0;
    const basePoints = this.totalPoints - oldCommunity - (this.totalGamePoints || 0);
    this.totalPoints = basePoints + oldCommunity + this.totalGamePoints;
  }

});

// Virtual for total community contributions
userSchema.virtual("totalContributions").get(function (this: IUser) {
  return this.discussionCount + this.replyCount;
});

// Method to check if user has already played a game TODAY (using UTC)
userSchema.methods.hasPlayedGame = function (gameId: string): boolean {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return this.gamesPlayed.some((game: { gameId: string; playedAt: Date }) => {
    if (game.gameId !== gameId) return false;

    const playedDate = new Date(game.playedAt);
    const playedUTC = new Date(Date.UTC(
      playedDate.getUTCFullYear(),
      playedDate.getUTCMonth(),
      playedDate.getUTCDate()
    ));

    return playedUTC.getTime() === todayUTC.getTime();
  });
};

// Method to mark a game as played
userSchema.methods.markGameAsPlayed = async function (
  gameId: string,
  gameName: string,
  score: number = 0,
  pointsEarned: number = 0
) {
  if (this.hasPlayedGame(gameId)) {
    throw new Error("Game already played. Each game can only be played once per day.");
  }

  this.gamesPlayed.push({
    gameId,
    gameName,
    playedAt: new Date(),
    score,
    pointsEarned,
    completed: true,
  });

  this.totalGamesPlayed += 1;
  this.totalGamePoints += pointsEarned;
  this.totalPoints += pointsEarned;

  await Transaction.create({
    userId: this._id,
    type: "game",
    amount: pointsEarned,
    description: `Completed game: ${gameName}`,
    metadata: {
      gameId,
      gameName,
      score,
    },
    balanceAfter: this.totalPoints,
    status: "completed",
  });

  await this.save();
  return this;
};

// Method to get game history
userSchema.methods.getGameHistory = function (gameId?: string) {
  if (gameId) {
    return this.gamesPlayed.filter(
      (game: { gameId: string }) => game.gameId === gameId
    );
  }
  return this.gamesPlayed;
};

// Method to award community points
userSchema.methods.awardCommunityPoints = async function (
  this: IUser,
  points: number,
  reason: string,
  transactionType?: "discussion" | "reply" | "like" | "achievement"
) {
  this.communityPoints += points;
  this.totalPoints += points;

  const transaction = await Transaction.create({
    userId: this._id,
    type: "bonus",
    amount: points,
    description: `Community: ${reason}`,
    metadata: {
      communityType: transactionType || "general",
      reason: reason,
    },
    balanceAfter: this.communityPoints,
    status: "completed",
  });

  await this.save();
  return transaction;
};

// Method to add badge
userSchema.methods.addBadge = async function (
  this: IUser,
  badgeId: string,
  name: string,
  description: string,
  icon: string
) {
  const existingBadge = this.badges.find(
    (b: { badgeId: string }) => b.badgeId === badgeId
  );

  if (!existingBadge) {
    this.badges.push({
      badgeId,
      name,
      description,
      icon,
      earnedAt: new Date(),
    });
    await this.save();
  }
  return this;
};

// Method to track discussion creation
userSchema.methods.trackDiscussionCreation = async function (
  this: IUser,
  discussionId: string,
) {
  if (!this.discussionsCreated.includes(discussionId)) {
    this.discussionsCreated.push(discussionId);
    this.discussionCount += 1;
    await this.save();
  }
  return this;
};

// Method to track reply creation
userSchema.methods.trackReplyCreation = async function (this: IUser, replyId: string) {
  if (!this.repliesCreated.includes(replyId)) {
    this.repliesCreated.push(replyId);
    this.replyCount += 1;
    await this.save();
  }
  return this;
};

// Method to check if user has liked a discussion
userSchema.methods.hasLikedDiscussion = function (
  this: IUser,
  discussionId: string,
): boolean {
  return this.likedDiscussions.includes(discussionId);
};

// Method to check if user has liked a reply
userSchema.methods.hasLikedReply = function (this: IUser, replyId: string): boolean {
  return this.likedReplies.includes(replyId);
};

// Transaction Schema
export interface ITransaction extends Document {
  userId: string;
  type:
  | "purchase"
  | "event"
  | "game"
  | "referral"
  | "bonus"
  | "redeem"
  | "daily"
  | "manual"
  | "community";
  amount: number;
  description: string;
  referenceId?: string;
  metadata?: {
    communityType?: "discussion" | "reply" | "like" | "achievement" | "badge";
    discussionId?: string;
    replyId?: string;
    badgeId?: string;
    reason?: string;
  };
  balanceAfter: number;
  status: "completed" | "pending" | "failed";
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: String, // Firebase UID is a string
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "purchase",
        "event",
        "game",
        "referral",
        "bonus",
        "redeem",
        "daily",
        "manual",
        "community",
      ],
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: String,
    metadata: Schema.Types.Mixed,
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ "metadata.communityType": 1 });

// Static method to get community leaderboard
userSchema.statics.getCommunityLeaderboard = async function (limit = 10) {
  return this.find({ isActive: true, isBanned: false })
    .select(
      "name avatar communityPoints discussionCount replyCount badges totalLikesReceived level"
    )
    .sort({ communityPoints: -1 })
    .limit(limit)
    .lean();
};

// Static method to get top contributors
userSchema.statics.getTopContributors = async function (limit = 10) {
  return this.find({ isActive: true, isBanned: false })
    .select(
      "name avatar discussionCount replyCount totalLikesReceived communityPoints"
    )
    .sort({ discussionCount: -1, replyCount: -1 })
    .limit(limit)
    .lean();
};

// Static method to get game leaderboard
userSchema.statics.getGameLeaderboard = async function (limit = 10) {
  return this.find({ isActive: true, isBanned: false })
    .select("name avatar totalGamesPlayed totalGamePoints level")
    .sort({ totalGamePoints: -1, totalGamesPlayed: -1 })
    .limit(limit)
    .lean();
};

// Export models
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);

// Type for user without sensitive data
export type SafeUser = Omit<
  IUser,
  "password" | "firebaseUid" | "email" | "walletBalance"
> & {
  _id: string;
  email?: string;
};