// models/Game.ts
import mongoose from 'mongoose';

// Game Catalog Schema - For game products/listings
const GameSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    title: String,
    description: String,
    regularPrice: String,
    salePrice: String,
    category: [{ type: String }],
    players: String,
    duration: String,
    features: [{ type: String }],
    imageUrl: String,
    image: String,
    createdBy: {
      userId: String,
      userEmail: String,
      userRole: String,
    },
    lastEditedBy: String,
    status: { 
      type: String, 
      default: 'active' 
    },
    isPublished: { 
      type: Boolean, 
      default: true 
    },
  },
  {
    timestamps: true,
  }
);

// Game Session Schema - For tracking user gameplay
const GameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    gameType: {
      type: String,
      enum: ['sudoku', 'word-guesser', 'crossword', 'puzzle'],
      required: true
    },
    gameId: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    completed: {
      type: Boolean,
      default: false
    },
    win: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    coinsEarned: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    gameState: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Game Leaderboard Schema - For tracking high scores
const GameLeaderboardSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      required: true,
      enum: ['sudoku', 'word-guesser', 'crossword', 'puzzle']
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: String, // Denormalized for faster queries
    score: {
      type: Number,
      required: true
    },
    time: {
      type: Number, // in seconds
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
GameSessionSchema.index({ userId: 1, gameType: 1, createdAt: -1 });
GameSessionSchema.index({ gameType: 1, difficulty: 1, score: -1 });
GameSessionSchema.index({ completed: 1, win: 1 });

GameLeaderboardSchema.index({ gameType: 1, difficulty: 1, score: -1 });
GameLeaderboardSchema.index({ userId: 1, date: -1 });
GameLeaderboardSchema.index({ gameType: 1, difficulty: 1, date: -1 });

GameSchema.index({ status: 1, isPublished: 1 });
GameSchema.index({ category: 1 });
GameSchema.index({ name: 'text', title: 'text', description: 'text' });

// Virtual for game session duration
GameSessionSchema.virtual('duration').get(function() {
  if (this.completedAt && this.startedAt) {
    return Math.floor((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
  return this.timeSpent;
});

// Method to complete a game session
GameSessionSchema.methods.complete = async function(score: number, win: boolean) {
  this.completed = true;
  this.win = win;
  this.score = score;
  this.completedAt = new Date();
  this.timeSpent = Math.floor((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
  
  // Calculate coins based on performance
  let coinsEarned = 0;
  if (win) {
    // Base coins for winning
    const baseCoins = this.difficulty === 'easy' ? 10 : this.difficulty === 'medium' ? 20 : 30;
    
    // Bonus for speed (if completed in less than 5 minutes)
    const speedBonus = this.timeSpent < 300 ? 5 : 0;
    
    // Bonus for high score
    const scoreBonus = Math.floor(score / 100);
    
    coinsEarned = baseCoins + speedBonus + scoreBonus;
  }
  
  this.coinsEarned = coinsEarned;
  await this.save();
  
  return coinsEarned;
};

// Static method to get user stats
GameSessionSchema.statics.getUserStats = async function(userId: string, gameType?: string) {
  const match: any = { userId: new mongoose.Types.ObjectId(userId) };
  if (gameType) match.gameType = gameType;
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$gameType',
        totalGames: { $sum: 1 },
        completedGames: { $sum: { $cond: ['$completed', 1, 0] } },
        wins: { $sum: { $cond: ['$win', 1, 0] } },
        totalScore: { $sum: '$score' },
        totalCoins: { $sum: '$coinsEarned' },
        totalTime: { $sum: '$timeSpent' },
        avgScore: { $avg: '$score' }
      }
    }
  ]);
  
  return stats;
};

// Static method to get top scores
GameLeaderboardSchema.statics.getTopScores = async function(
  gameType: string,
  difficulty: string,
  limit: number = 10
) {
  return this.find({ gameType, difficulty })
    .sort({ score: -1, time: 1 }) // Higher score first, then faster time
    .limit(limit)
    .populate('userId', 'name email profileImage')
    .lean();
};

// Static method to update leaderboard
GameLeaderboardSchema.statics.updateLeaderboard = async function(
  userId: string,
  gameType: string,
  difficulty: string,
  score: number,
  time: number
) {
  // Check if user already has a better score
  const existingEntry = await this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    gameType,
    difficulty
  });
  
  if (!existingEntry || score > existingEntry.score || 
      (score === existingEntry.score && time < existingEntry.time)) {
    // Update or create new entry
    return this.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), gameType, difficulty },
      { score, time, date: new Date() },
      { upsert: true, new: true }
    );
  }
  
  return existingEntry;
};

// Export models
export const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);
export const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', GameSessionSchema);
export const GameLeaderboard = mongoose.models.GameLeaderboard || mongoose.model('GameLeaderboard', GameLeaderboardSchema);

// Type definitions for TypeScript
export interface IGame extends mongoose.Document {
  name: string;
  title?: string;
  description?: string;
  regularPrice?: string;
  salePrice?: string;
  category?: string[];
  players?: string;
  duration?: string;
  features?: string[];
  imageUrl?: string;
  image?: string;
  createdBy?: {
    userId: string;
    userEmail: string;
    userRole: string;
  };
  lastEditedBy?: string;
  status: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameSession extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  gameType: 'sudoku' | 'word-guesser' | 'crossword' | 'puzzle';
  gameId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  win: boolean;
  score: number;
  coinsEarned: number;
  timeSpent: number;
  startedAt: Date;
  completedAt?: Date;
  gameState: any;
  duration: number;
  complete(score: number, win: boolean): Promise<number>;
}

export interface IGameLeaderboard extends mongoose.Document {
  gameType: 'sudoku' | 'word-guesser' | 'crossword' | 'puzzle';
  difficulty: 'easy' | 'medium' | 'hard';
  userId: mongoose.Types.ObjectId;
  userName?: string;
  score: number;
  time: number;
  date: Date;
}