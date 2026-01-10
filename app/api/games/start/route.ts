// import { NextRequest, NextResponse } from 'next/server';
// import { verifyIdToken } from '@/lib/firebase-admin';
// import { connectDb } from '@/lib/mongodb';
// import { User } from '@/models/User';
// import { GameSession } from '@/models/Game';
// import { generateSudoku, generateWordPuzzle, generateCrossword } from '@/lib/game-generators';

// const GAME_CONFIG = {
//   sudoku: {
//     easy: { coins: 10, timeBonus: true },
//     medium: { coins: 25, timeBonus: true },
//     hard: { coins: 50, timeBonus: true }
//   },
//   'word-guesser': {
//     easy: { coins: 5, timeBonus: false },
//     medium: { coins: 15, timeBonus: false },
//     hard: { coins: 30, timeBonus: false }
//   },
//   crossword: {
//     easy: { coins: 15, timeBonus: true },
//     medium: { coins: 35, timeBonus: true },
//     hard: { coins: 70, timeBonus: true }
//   }
// };

// export async function POST(req: NextRequest) {
//   try {
//     await connectDb();
    
//     const body = await req.json();
//     const { gameType, difficulty = 'medium' } = body;
    
//     // Validate game type
//     if (!['sudoku', 'word-guesser', 'crossword'].includes(gameType)) {
//       return NextResponse.json(
//         { error: 'Invalid game type' },
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
    
//     // Generate game based on type
//     let gameData;
//     const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
//     switch (gameType) {
//       case 'sudoku':
//         gameData = generateSudoku(difficulty);
//         break;
//       case 'word-guesser':
//         gameData = generateWordPuzzle(difficulty);
//         break;
//       case 'crossword':
//         gameData = generateCrossword(difficulty);
//         break;
//       default:
//         return NextResponse.json(
//           { error: 'Invalid game type' },
//           { status: 400 }
//         );
//     }
    
//     // Create game session
//     const gameSession = new GameSession({
//       userId: user._id,
//       gameType,
//       gameId,
//       difficulty,
//       gameState: {
//         puzzle: gameData.puzzle,
//         solution: gameData.solution,
//         initial: gameData.initial || gameData.puzzle,
//         hints: gameData.hints || []
//       }
//     });
    
//     await gameSession.save();
    
//     return NextResponse.json({
//       success: true,
//       gameId,
//       gameType,
//       difficulty,
//       puzzle: gameData.puzzle,
//       hints: gameData.hints ? gameData.hints  : [],
//       maxCoins: GAME_CONFIG[gameType][difficulty].coins,
//       hasTimeBonus: GAME_CONFIG[gameType][difficulty].timeBonus
//     }, { status: 200 });
    
//   } catch (error) {
//     console.error('Error starting game:', error);
//     return NextResponse.json(
//       { error: 'Server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDb } from '@/lib/mongodb';
import { User } from '@/models/User';
// import { GameSession } from '@/models/Game';
import { generateSudoku, generateWordPuzzle, generateCrossword } from '@/lib/game-generators';

// Type-safe game rewards function
function getGameRewards(gameType: string, difficulty: string): { coins: number; timeBonus: boolean } {
  const configs = {
    sudoku: {
      easy: { coins: 10, timeBonus: true },
      medium: { coins: 25, timeBonus: true },
      hard: { coins: 50, timeBonus: true }
    },
    'word-guesser': {
      easy: { coins: 5, timeBonus: false },
      medium: { coins: 15, timeBonus: false },
      hard: { coins: 30, timeBonus: false }
    },
    crossword: {
      easy: { coins: 15, timeBonus: true },
      medium: { coins: 35, timeBonus: true },
      hard: { coins: 70, timeBonus: true }
    }
  };

  // Type-safe access
  const validGameTypes = ['sudoku', 'word-guesser', 'crossword'] as const;
  const validDifficulties = ['easy', 'medium', 'hard'] as const;
  
  if (validGameTypes.includes(gameType as any) && validDifficulties.includes(difficulty as any)) {
    return configs[gameType as keyof typeof configs][difficulty as keyof (typeof configs)[keyof typeof configs]];
  }

  // Default fallback
  return { coins: 10, timeBonus: false };
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    
    const body = await req.json();
    const { gameType, difficulty = 'medium' } = body;
    
    // Validate game type
    const validGameTypes = ['sudoku', 'word-guesser', 'crossword'];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json(
        { error: 'Invalid game type' },
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
    
    // Generate game based on type
    let gameData;
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (gameType) {
      case 'sudoku':
        gameData = generateSudoku(difficulty);
        break;
      case 'word-guesser':
        gameData = generateWordPuzzle(difficulty);
        break;
      case 'crossword':
        gameData = generateCrossword(difficulty);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid game type' },
          { status: 400 }
        );
    }
    
    // Create game session
    // const gameSession = new GameSession({
    //   userId: user._id,
    //   gameType,
    //   gameId,
    //   difficulty,
    //   gameState: {
    //     puzzle: gameData.puzzle,
    //     solution: gameData.solution,
    //     initial: gameData.initial || gameData.puzzle,
    //     hints: gameData.hints || []
    //   }
    // });
    
    // await gameSession.save();
    
    // Get rewards using type-safe function
    const rewards = getGameRewards(gameType, difficulty);
    
    return NextResponse.json({
      success: true,
      gameId,
      gameType,
      difficulty,
      puzzle: gameData.puzzle,
      hints: gameData.hints || [],
      maxCoins: rewards.coins,
      hasTimeBonus: rewards.timeBonus
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}