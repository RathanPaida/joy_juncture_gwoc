// import { NextRequest, NextResponse } from 'next/server';
// import  {verifyIdToken}  from '@/lib/firebase-admin';
// import { connectDb } from '@/lib/mongodb';
// import { User } from '@/models/User';
// import { GameSession, GameLeaderboard } from '@/models/Game';

// const GAME_CONFIG = {
//   sudoku: {
//     easy: { baseCoins: 10, timeMultiplier: 0.5 },
//     medium: { baseCoins: 25, timeMultiplier: 0.5 },
//     hard: { baseCoins: 50, timeMultiplier: 0.5 }
//   },
//   'word-guesser': {
//     easy: { baseCoins: 5, timeMultiplier: 0 },
//     medium: { baseCoins: 15, timeMultiplier: 0 },
//     hard: { baseCoins: 30, timeMultiplier: 0 }
//   },
//   crossword: {
//     easy: { baseCoins: 15, timeMultiplier: 0.3 },
//     medium: { baseCoins: 35, timeMultiplier: 0.3 },
//     hard: { baseCoins: 70, timeMultiplier: 0.3 }
//   }
// };

// export async function POST(req: NextRequest) {
//   try {
//     await connectDb();
    
//     const body = await req.json();
//     const { gameId, solution, timeSpent } = body;
    
//     if (!gameId || !solution) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }
    
//     // Authenticate user
//     const authHeader = req.headers.get('authorization');
//     if (!authHeader?.startsWith('Bearer ')) {
//       return NextResponse.json(
//         { error: 'Authentication required' },
//         { status: 401 }
//       );
//     }
    
//     const token = authHeader.split('Bearer ')[1];
//     const decodedToken = await verifyIdToken(token);
//     const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
//     if (!user) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }
    
//     // Get game session
//     const gameSession = await GameSession.findOne({
//       gameId,
//       userId: user._id,
//       completed: false
//     });
    
//     if (!gameSession) {
//       return NextResponse.json(
//         { error: 'Game session not found or already completed' },
//         { status: 404 }
//       );
//     }
    
//     const { gameType, difficulty, gameState } = gameSession;
    
//     // Validate solution
//     const isCorrect = validateSolution(gameType, solution, gameState.solution);
    
//     let coinsEarned = 0;
//     let score = 0;
    
//     if (isCorrect) {
//       const config = GAME_CONFIG[gameType as keyof typeof GAME_CONFIG][difficulty as keyof typeof GAME_CONFIG as keyof typeof GAME_CONFIG[keyof typeof GAME_CONFIG]];
      
//       // Calculate base coins
//       coinsEarned = config.baseCoins;
      
//       // Add time bonus if applicable
//       if (config.timeMultiplier > 0 && timeSpent) {
//         const maxTime = getMaxTimeForGame(gameType, difficulty);
//         if (timeSpent < maxTime) {
//           const timeBonus = Math.floor((maxTime - timeSpent) * config.timeMultiplier);
//           coinsEarned += timeBonus;
//         }
//       }
      
//       // Calculate score
//       score = calculateScore(gameType, difficulty, timeSpent);
      
//       // Add coins to user wallet
//       user.totalPoints += coinsEarned;
//       await user.save();
      
//       // Record transaction
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/add-points`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           type: 'game',
//           amount: coinsEarned,
//           description: `${gameType} ${difficulty} level completed`,
//           metadata: {
//             gameType,
//             difficulty,
//             timeSpent,
//             score
//           }
//         })
//       });
      
//       // Add to leaderboard
//       const leaderboardEntry = new GameLeaderboard({
//         gameType,
//         difficulty,
//         userId: user._id,
//         score,
//         time: timeSpent || 0,
//         date: new Date()
//       });
//       await leaderboardEntry.save();
//     }
    
//     // Update game session
//     gameSession.completed = true;
//     gameSession.win = isCorrect;
//     gameSession.score = score;
//     gameSession.coinsEarned = coinsEarned;
//     gameSession.timeSpent = timeSpent || 0;
//     gameSession.completedAt = new Date();
//     await gameSession.save();
    
//     return NextResponse.json({
//       success: true,
//       win: isCorrect,
//       coinsEarned: isCorrect ? coinsEarned : 0,
//       score,
//       newBalance: user.totalPoints
//     }, { status: 200 });
    
//   } catch (error) {
//     console.error('Error completing game:', error);
//     return NextResponse.json(
//       { error: 'Server error' },
//       { status: 500 }
//     );
//   }
// }

// function validateSolution(gameType: string, userSolution: any, correctSolution: any) {
//   switch (gameType) {
//     case 'sudoku':
//       return JSON.stringify(userSolution) === JSON.stringify(correctSolution);
//     case 'word-guesser':
//       return userSolution.toLowerCase() === correctSolution.toLowerCase();
//     case 'crossword':
//       // Validate crossword solution
//       // In the validateSolution function, update the crossword case:
//     return userSolution.every((cell: any, rowIndex: number) => 
//       cell.every((userCell: any, colIndex: number) => {
//         const solutionCell = correctSolution[rowIndex][colIndex];
//         if (solutionCell.isBlack) return true;
//         return userCell.letter === solutionCell.letter;
//       })
//     );
//     default:
//       return false;
//   }
// }

// function calculateScore(gameType: string, difficulty: string, timeSpent: number) {
//   const baseScores = {
//     sudoku: { easy: 100, medium: 250, hard: 500 },
//     'word-guesser': { easy: 50, medium: 150, hard: 300 },
//     crossword: { easy: 150, medium: 350, hard: 700 }
//   };
  
//   let score = baseScores[gameType as keyof typeof baseScores][difficulty as keyof typeof baseScores as keyof typeof baseScores[keyof typeof baseScores]];
  
//   // Bonus for fast completion
//   if (timeSpent) {
//     const maxTime = getMaxTimeForGame(gameType, difficulty);
//     if (timeSpent < maxTime) {
//       const timeBonus = Math.floor((maxTime - timeSpent) / maxTime * score * 0.5);
//       score += timeBonus;
//     }
//   }
  
//   return score;
// }

// function getMaxTimeForGame(gameType: string, difficulty: string) {
//   const times = {
//     sudoku: { easy: 1800, medium: 3600, hard: 5400 }, // in seconds
//     'word-guesser': { easy: 300, medium: 600, hard: 900 },
//     crossword: { easy: 1800, medium: 3600, hard: 5400 }
//   };
//   return times[gameType as keyof typeof times][difficulty as keyof typeof times as keyof typeof times[keyof typeof times]];
// }

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDb } from '@/lib/mongodb';
import { User } from '@/models/User';
import { GameSession, GameLeaderboard } from '@/models/Game';

// Define types for type safety
type GameType = 'sudoku' | 'word-guesser' | 'crossword';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameConfig {
  [key: string]: {
    [key: string]: {
      baseCoins: number;
      timeMultiplier: number;
    };
  };
}

interface BaseScores {
  [key: string]: {
    [key: string]: number;
  };
}

interface MaxTimes {
  [key: string]: {
    [key: string]: number;
  };
}

const GAME_CONFIG: GameConfig = {
  sudoku: {
    easy: { baseCoins: 10, timeMultiplier: 0.5 },
    medium: { baseCoins: 25, timeMultiplier: 0.5 },
    hard: { baseCoins: 50, timeMultiplier: 0.5 }
  },
  'word-guesser': {
    easy: { baseCoins: 5, timeMultiplier: 0 },
    medium: { baseCoins: 15, timeMultiplier: 0 },
    hard: { baseCoins: 30, timeMultiplier: 0 }
  },
  crossword: {
    easy: { baseCoins: 15, timeMultiplier: 0.3 },
    medium: { baseCoins: 35, timeMultiplier: 0.3 },
    hard: { baseCoins: 70, timeMultiplier: 0.3 }
  }
};

// Helper function to safely get game config
function getGameConfig(gameType: string, difficulty: string): { baseCoins: number; timeMultiplier: number } {
  // Type guard to check if gameType is valid
  const validGameTypes: GameType[] = ['sudoku', 'word-guesser', 'crossword'];
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  
  if (validGameTypes.includes(gameType as GameType) && 
      validDifficulties.includes(difficulty as Difficulty)) {
    return GAME_CONFIG[gameType][difficulty];
  }
  
  // Return default if invalid
  return { baseCoins: 10, timeMultiplier: 0 };
}

// Helper function to safely get base scores
function getBaseScore(gameType: string, difficulty: string): number {
  const baseScores: BaseScores = {
    sudoku: { easy: 100, medium: 250, hard: 500 },
    'word-guesser': { easy: 50, medium: 150, hard: 300 },
    crossword: { easy: 150, medium: 350, hard: 700 }
  };
  
  const validGameTypes: GameType[] = ['sudoku', 'word-guesser', 'crossword'];
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  
  if (validGameTypes.includes(gameType as GameType) && 
      validDifficulties.includes(difficulty as Difficulty)) {
    return baseScores[gameType][difficulty];
  }
  
  return 100; // Default score
}

// Helper function to safely get max time
function getMaxTimeForGame(gameType: string, difficulty: string): number {
  const times: MaxTimes = {
    sudoku: { easy: 1800, medium: 3600, hard: 5400 }, // in seconds
    'word-guesser': { easy: 300, medium: 600, hard: 900 },
    crossword: { easy: 1800, medium: 3600, hard: 5400 }
  };
  
  const validGameTypes: GameType[] = ['sudoku', 'word-guesser', 'crossword'];
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  
  if (validGameTypes.includes(gameType as GameType) && 
      validDifficulties.includes(difficulty as Difficulty)) {
    return times[gameType][difficulty];
  }
  
  return 1800; // Default 30 minutes
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    
    const body = await req.json();
    const { gameId, solution, timeSpent } = body;
    
    if (!gameId || !solution) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get game session
    const gameSession = await GameSession.findOne({
      gameId,
      userId: user._id,
      completed: false
    });
    
    if (!gameSession) {
      return NextResponse.json(
        { error: 'Game session not found or already completed' },
        { status: 404 }
      );
    }
    
    const { gameType, difficulty, gameState } = gameSession;
    
    // Validate solution
    const isCorrect = validateSolution(gameType, solution, gameState.solution);
    
    let coinsEarned = 0;
    let score = 0;
    
    if (isCorrect) {
      // Use the safe helper function
      const config = getGameConfig(gameType, difficulty);
      
      // Calculate base coins
      coinsEarned = config.baseCoins;
      
      // Add time bonus if applicable
      if (config.timeMultiplier > 0 && timeSpent) {
        const maxTime = getMaxTimeForGame(gameType, difficulty);
        if (timeSpent < maxTime) {
          const timeBonus = Math.floor((maxTime - timeSpent) * config.timeMultiplier);
          coinsEarned += timeBonus;
        }
      }
      
      // Calculate score using safe helper
      score = calculateScore(gameType, difficulty, timeSpent);
      
      // Add coins to user wallet
      user.totalPoints += coinsEarned;
      await user.save();
      
      // Record transaction
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/wallet/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'game',
          amount: coinsEarned,
          description: `${gameType} ${difficulty} level completed`,
          metadata: {
            gameType,
            difficulty,
            timeSpent,
            score
          }
        })
      });
      
      // Add to leaderboard
      const leaderboardEntry = new GameLeaderboard({
        gameType,
        difficulty,
        userId: user._id,
        score,
        time: timeSpent || 0,
        date: new Date()
      });
      await leaderboardEntry.save();
    }
    
    // Update game session
    gameSession.completed = true;
    gameSession.win = isCorrect;
    gameSession.score = score;
    gameSession.coinsEarned = coinsEarned;
    gameSession.timeSpent = timeSpent || 0;
    gameSession.completedAt = new Date();
    await gameSession.save();
    
    return NextResponse.json({
      success: true,
      win: isCorrect,
      coinsEarned: isCorrect ? coinsEarned : 0,
      score,
      newBalance: user.totalPoints
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error completing game:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function validateSolution(gameType: string, userSolution: any, correctSolution: any) {
  switch (gameType) {
    case 'sudoku':
      return JSON.stringify(userSolution) === JSON.stringify(correctSolution);
    case 'word-guesser':
      return userSolution.toLowerCase() === correctSolution.toLowerCase();
    case 'crossword':
      // Validate crossword solution
      return userSolution.every((cell: any, rowIndex: number) => 
        cell.every((userCell: any, colIndex: number) => {
          const solutionCell = correctSolution[rowIndex][colIndex];
          if (solutionCell.isBlack) return true;
          return userCell.letter === solutionCell.letter;
        })
      );
    default:
      return false;
  }
}

function calculateScore(gameType: string, difficulty: string, timeSpent: number) {
  // Get base score using safe helper
  let score = getBaseScore(gameType, difficulty);
  
  // Bonus for fast completion
  if (timeSpent) {
    const maxTime = getMaxTimeForGame(gameType, difficulty);
    if (timeSpent < maxTime) {
      const timeBonus = Math.floor((maxTime - timeSpent) / maxTime * score * 0.5);
      score += timeBonus;
    }
  }
  
  return score;
}