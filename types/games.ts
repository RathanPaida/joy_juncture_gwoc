// Game session types
export interface GameSessionType {
    _id: string;
    userId: string;
    gameType: 'sudoku' | 'word-guesser' | 'crossword' | 'puzzle';
    gameId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    completed: boolean;
    win: boolean;
    score: number;
    coinsEarned: number;
    timeSpent: number;
    gameState: {
      puzzle: any;
      solution: any;
      clues?: CrosswordClue[];
      size?: number;
      hint?: string;
      initial?: any;
    };
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Leaderboard types
  export interface GameLeaderboardType {
    _id: string;
    gameType: string;
    difficulty: string;
    userId: string;
    score: number;
    time: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Crossword specific types
  export interface CrosswordCell {
    letter: string;
    correct: string;
    isBlack: boolean;
    number?: number;
    across?: number;
    down?: number;
  }
  
  export interface CrosswordClue {
    number: number;
    direction: 'across' | 'down';
    clue: string;
  }
  
  export interface CrosswordGameData {
    puzzle: CrosswordCell[][];
    solution: CrosswordCell[][];
    clues: CrosswordClue[];
    size: number;
    gameId: string;
    maxCoins: number;
    hasTimeBonus: boolean;
  }
  
  // Sudoku types
  export interface SudokuGameData {
    puzzle: number[][];
    solution: number[][];
    initial: number[][];
    gameId: string;
    maxCoins: number;
    hasTimeBonus: boolean;
  }
  
  // Word Guesser types
  export interface WordGuesserGameData {
    puzzle: string;
    solution: string;
    hint?: string;
    gameId: string;
    maxCoins: number;
    hasTimeBonus: boolean;
  }
  
  // Game config types
  export interface GameConfig {
    sudoku: {
      [key in 'easy' | 'medium' | 'hard']: {
        baseCoins: number;
        timeMultiplier: number;
      };
    };
    'word-guesser': {
      [key in 'easy' | 'medium' | 'hard']: {
        baseCoins: number;
        timeMultiplier: number;
      };
    };
    crossword: {
      [key in 'easy' | 'medium' | 'hard']: {
        baseCoins: number;
        timeMultiplier: number;
      };
    };
  }
  
  // Game stats types
  export interface GameStats {
    gameStats: Array<{
      _id: string;
      totalGames: number;
      wins: number;
      totalCoins: number;
      avgScore: number;
    }>;
    recentGames: Array<{
      gameType: string;
      difficulty: string;
      win: boolean;
      coinsEarned: number;
      score: number;
      completedAt: string;
    }>;
    rank: number;
    totalCoinsEarned: number;
    totalGames: number;
  }
  
  // API response types
  export interface StartGameResponse {
    success: boolean;
    gameId: string;
    gameType: string;
    difficulty: string;
    puzzle: any;
    hints?: any[];
    maxCoins: number;
    hasTimeBonus: boolean;
  }
  
  export interface CompleteGameResponse {
    success: boolean;
    win: boolean;
    coinsEarned: number;
    score: number;
    newBalance: number;
    transactionId?: string;
  }
  
  // Component props types
  export interface SudokuGridProps {
    grid: number[][];
    initial: number[][];
    onCellChange: (row: number, col: number, value: number) => void;
  }
  
  export interface CrosswordGameProps {
    gameData: CrosswordGameData;
    onComplete: (result: CompleteGameResponse) => void;
  }
  
  export interface WordGuesserGameProps {
    gameData: WordGuesserGameData;
    onComplete: (result: CompleteGameResponse) => void;
  }
  
  export interface GameCardProps {
    game: {
      id: string;
      title: string;
      description: string;
      icon: string;
      difficulties: string[];
      color: string;
    };
    user: any;
    onGameStart: () => void;
  }
  
  export interface GameStatsProps {
    stats: GameStats;
  }