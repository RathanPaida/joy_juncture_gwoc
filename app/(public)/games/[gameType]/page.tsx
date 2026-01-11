// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useSearchParams } from 'next/navigation';
// import { useAuth } from '@/app/contexts/AuthContext';
// import SudokuGame from '@/app/components/games/SudokuGame';
// import WordGuesserGame from '@/app/components/games/WordGuesserGame';
// import CrosswordGame from '@/app/components/games/CrosswordGame';

// export default function GamePage() {
//   const params = useParams();
//   const searchParams = useSearchParams();
//   const { user } = useAuth();
//   const [gameData, setGameData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [gameResult, setGameResult] = useState<any>(null);

//   const gameType = params.gameType as string;
//   const gameId = searchParams.get('gameId');
//   console.log(gameId);
//   useEffect(() => {
//     if (gameId) {
//       loadGame();
//     } else {
//       // Redirect to games page if no gameId
//       window.location.href = '/games';
//     }
//   }, [gameId]);

//   const loadGame = async () => {
//     try {
//       const savedGame = sessionStorage.getItem(`currentGame_${gameType}`);
//       if (savedGame) {
//         setGameData(JSON.parse(savedGame));
//       }
//     } catch (error) {
//       console.error('Error loading game:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGameComplete = (result: any) => {
//     setGameResult(result);
//     // Clear saved game
//     sessionStorage.removeItem(`currentGame_${gameType}`);
//   };

//   const renderGame = () => {
//     if (!gameData) return null;

//     switch (gameType) {
//       case 'sudoku':
//         return (
//           <SudokuGame
//             gameData={gameData}
//             onComplete={handleGameComplete}
//           />
//         );
//       case 'word-guesser':
//         return (
//           <WordGuesserGame
//             gameData={gameData}
//             onComplete={handleGameComplete}
//           />
//         );
//       case 'crossword':
//         return (
//           <CrosswordGame
//             gameData={gameData}
//             onComplete={handleGameComplete}
//           />
//         );
//       default:
//         return (
//           <div className="text-center py-12">
//             <p className="text-xl text-gray-600">Game not found</p>
//           </div>
//         );
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading game...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-6">
//         <button
//           onClick={() => window.history.back()}
//           className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
//         >
//           ← Back to Games
//         </button>
//       </div>

//       {gameResult && (
//         <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl shadow-lg">
//           <div className="flex items-center justify-between">
//             <div>
//               <h3 className="text-2xl font-bold text-green-800 mb-2">Game Completed!</h3>
//               <p className="text-green-700">
//                 You earned <span className="font-bold text-yellow-600">{gameResult.coinsEarned} coins</span>
//               </p>
//               <p className="text-green-700">
//                 New balance: <span className="font-bold">{gameResult.newBalance} coins</span>
//               </p>
//             </div>
//             <div className="text-5xl">🎉</div>
//           </div>
          
//           <div className="mt-4 flex gap-4">
//             <button
//               onClick={() => window.location.href = '/games'}
//               className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//             >
//               Play Another Game
//             </button>
//             <button
//               onClick={() => setGameResult(null)}
//               className="px-6 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="bg-white rounded-xl shadow-lg p-6">
//         {renderGame()}
//       </div>

//       {/* Game instructions based on type */}
//       <div className="mt-8 bg-blue-50 p-6 rounded-xl">
//         <h3 className="font-bold text-lg text-blue-800 mb-3">Game Rules</h3>
//         {gameType === 'sudoku' && (
//           <ul className="text-blue-700 space-y-2">
//             <li>• Fill each row with numbers 1-9 (no duplicates)</li>
//             <li>• Fill each column with numbers 1-9 (no duplicates)</li>
//             <li>• Fill each 3x3 block with numbers 1-9 (no duplicates)</li>
//             <li>• Use notes to track possible numbers</li>
//             <li>• Red cells indicate conflicts</li>
//           </ul>
//         )}
//         {gameType === 'word-guesser' && (
//           <ul className="text-blue-700 space-y-2">
//             <li>• Rearrange the scrambled letters to form a valid word</li>
//             <li>• You have up to 3 hints available</li>
//             <li>• Each hint reveals one correct letter</li>
//             <li>• Using fewer hints gives bonus points</li>
//           </ul>
//         )}
//         {gameType === 'crossword' && (
//           <ul className="text-blue-700 space-y-2">
//             <li>• Fill in the crossword puzzle with correct words</li>
//             <li>• Read the clues for each word</li>
//             <li>• Words can be across (→) or down (↓)</li>
//             <li>• Intersecting letters must match</li>
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import SudokuGame from '@/app/components/games/SudokuGame';
import WordGuesserGame from '@/app/components/games/WordGuesserGame';
import CrosswordGame from '@/app/components/games/CrosswordGame';

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameResult, setGameResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const gameType = params.gameType as string;
  const gameId = searchParams.get('gameId');

  useEffect(() => {
    if (!gameId) {
      router.push('/games');
      return;
    }
    
    loadGame();
  }, [gameId, gameType]);

  const loadGame = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get game from session storage
      const savedGame = sessionStorage.getItem(`currentGame_${gameType}`);
      
      if (savedGame) {
        const parsedGame = JSON.parse(savedGame);
        // Verify game ID matches
        if (parsedGame.gameId === gameId) {
          setGameData(parsedGame);
          setLoading(false);
          return;
        }
      }
      
      // If no saved game or ID doesn't match, try to fetch from API
      if (user) {
        const token = await user.getIdToken?.();
        if (token) {
          const response = await fetch(`/api/games/continue?gameId=${gameId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const apiGame = await response.json();
            setGameData(apiGame);
            sessionStorage.setItem(`currentGame_${gameType}`, JSON.stringify(apiGame));
            setLoading(false);
            return;
          }
        }
      }
      
      // If everything fails, show error
      setError('Game not found. Please start a new game.');
      
    } catch (err) {
      console.error('Error loading game:', err);
      setError('Failed to load game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = (result: any) => {
    setGameResult(result);
    // Clear saved game
    sessionStorage.removeItem(`currentGame_${gameType}`);
    
    // Update user points in context
    if (user && result.coinsEarned) {
      // You might want to sync user data here
    }
  };

  const renderGame = () => {
    if (!gameData) return null;

    switch (gameType) {
      case 'sudoku':
        return (
          <SudokuGame
            gameData={gameData}
            onComplete={handleGameComplete}
          />
        );
      case 'word-guesser':
        return (
          <WordGuesserGame
            gameData={gameData}
            onComplete={handleGameComplete}
          />
        );
      case 'crossword':
        return (
          <CrosswordGame
            gameData={gameData}
            onComplete={handleGameComplete}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Game type not supported</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push('/games')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Games
        </button>
      </div>

      {gameResult && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Game Completed!</h3>
              <p className="text-green-700">
                You earned <span className="font-bold text-yellow-600">{gameResult.coinsEarned} coins</span>
              </p>
              <p className="text-green-700">
                New balance: <span className="font-bold">{gameResult.newBalance} coins</span>
              </p>
            </div>
            <div className="text-5xl">🏆</div>
          </div>
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => router.push('/games')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Play Another Game
            </button>
            <button
              onClick={() => setGameResult(null)}
              className="px-6 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {renderGame()}
      </div>

      {/* Game instructions based on type */}
      <div className="mt-8 bg-blue-50 p-6 rounded-xl">
        <h3 className="font-bold text-lg text-blue-800 mb-3">Game Rules</h3>
        {gameType === 'sudoku' && (
          <ul className="text-blue-700 space-y-2">
            <li>• Fill each row with numbers 1-9 (no duplicates)</li>
            <li>• Fill each column with numbers 1-9 (no duplicates)</li>
            <li>• Fill each 3x3 block with numbers 1-9 (no duplicates)</li>
            <li>• Use notes to track possible numbers</li>
            <li>• Red cells indicate conflicts</li>
          </ul>
        )}
        {gameType === 'word-guesser' && (
          <ul className="text-blue-700 space-y-2">
            <li>• Rearrange the scrambled letters to form a valid word</li>
            <li>• You have up to 3 hints available</li>
            <li>• Each hint reveals one correct letter</li>
            <li>• Using fewer hints gives bonus points</li>
          </ul>
        )}
        {gameType === 'crossword' && (
          <ul className="text-blue-700 space-y-2">
            <li>• Fill in the crossword puzzle with correct words</li>
            <li>• Read the clues for each word</li>
            <li>• Words can be across (→) or down (↓)</li>
            <li>• Intersecting letters must match</li>
          </ul>
        )}
      </div>
    </div>
  );
}