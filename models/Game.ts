import mongoose from 'mongoose';

const GameSessionSchema = new mongoose.Schema({
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
}, {
  timestamps: true
});

const GameLeaderboardSchema = new mongoose.Schema({
  gameType: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  score: {
    type: Number,
    required: true
  },
  time: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

export const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', GameSessionSchema);
export const GameLeaderboard = mongoose.models.GameLeaderboard || mongoose.model('GameLeaderboard', GameLeaderboardSchema);