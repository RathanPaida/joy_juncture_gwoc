// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/app/contexts/AuthContext';
// import GameCard from '@/app/components/games/GameCard';
// import GameStats from '@/app/components/games/GameStats';

// export default function GamesPage() {
//   const { user } = useAuth();
//   const [games, setGames] = useState([]);
//   const [stats, setStats] = useState(null);

//   const gameList = [
//     {
//       id: 'sudoku',
//       title: 'Sudoku',
//       description: 'Fill the grid with numbers 1-9',
//       icon: '🧩',
//       difficulties: ['easy', 'medium', 'hard'],
//       color: 'bg-blue-100'
//     },
//     {
//       id: 'word-guesser',
//       title: 'Word Guesser',
//       description: 'Unscramble the hidden word',
//       icon: '🔤',
//       difficulties: ['easy', 'medium', 'hard'],
//       color: 'bg-green-100'
//     },
//     {
//       id: 'crossword',
//       title: 'Crossword',
//       description: 'Solve the crossword puzzle',
//       icon: '✏️',
//       difficulties: ['easy', 'medium', 'hard'],
//       color: 'bg-purple-100'
//     }
//   ];

//   useEffect(() => {
//     if (user) {
//       fetchGameStats();
//     }
//   }, [user]);

//   const fetchGameStats = async () => {
//     try {
//       const response = await fetch('/api/games/stats', {
//         headers: {
//           'Authorization': `Bearer ${await user.getIdToken()}`
//         }
//       });
//       const data = await response.json();
//       setStats(data);
//     } catch (error) {
//       console.error('Error fetching stats:', error);
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-800">Games Arena</h1>
//         <p className="text-gray-600 mt-2">
//           Play games and earn coins! Complete puzzles to add coins to your wallet.
//         </p>
        
//         <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//           <div className="flex items-center">
//             <span className="text-yellow-800 font-semibold mr-2">🎮 Current Balance:</span>
//             <span className="text-2xl font-bold text-yellow-600">
//               {user?.totalPoints || 0} coins
//             </span>
//           </div>
//         </div>
//       </div>

//       {stats && <GameStats stats={stats} />}

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
//         {gameList.map((game) => (
//           <GameCard
//             key={game.id}
//             game={game}
//             user={user}
//             onGameStart={fetchGameStats}
//           />
//         ))}
//       </div>

//       <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
//         <h2 className="text-xl font-bold text-gray-800 mb-4">How it works</h2>
//         <div className="space-y-3">
//           <div className="flex items-start">
//             <div className="bg-blue-100 p-2 rounded-full mr-3">1</div>
//             <p className="text-gray-700">Choose a game and difficulty level</p>
//           </div>
//           <div className="flex items-start">
//             <div className="bg-blue-100 p-2 rounded-full mr-3">2</div>
//             <p className="text-gray-700">Complete the puzzle within the time limit</p>
//           </div>
//           <div className="flex items-start">
//             <div className="bg-blue-100 p-2 rounded-full mr-3">3</div>
//             <p className="text-gray-700">Earn coins based on difficulty and completion time</p>
//           </div>
//           <div className="flex items-start">
//             <div className="bg-blue-100 p-2 rounded-full mr-3">4</div>
//             <p className="text-gray-700">Coins are automatically added to your wallet</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import GameCard from '@/app/components/games/GameCard';
import GameStats from '@/app/components/games/GameStats';

export default function GamesPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const gameList = [
    {
      id: 'sudoku',
      title: 'Sudoku',
      description: 'Fill the grid with numbers 1-9',
      icon: '🧩',
      difficulties: ['easy', 'medium', 'hard'],
      color: 'bg-blue-100'
    },
    {
      id: 'word-guesser',
      title: 'Word Guesser',
      description: 'Unscramble the hidden word',
      icon: '🔤',
      difficulties: ['easy', 'medium', 'hard'],
      color: 'bg-green-100'
    },
    {
      id: 'crossword',
      title: 'Crossword',
      description: 'Solve the crossword puzzle',
      icon: '✏️',
      difficulties: ['easy', 'medium', 'hard'],
      color: 'bg-purple-100'
    }
  ];

  useEffect(() => {
    if (user && !authLoading) {
      fetchGameStats();
    }
  }, [user, authLoading]);

  const fetchGameStats = async () => {
    if (!user) return;
    
    setLoadingStats(true);
    setStatsError(null);
    
    try {
      // First, check if we have a token method
      let token;
      if (typeof user.getIdToken === 'function') {
        token = await user.getIdToken();
      } else if (user.token) {
        token = user.token;
      }
      
      if (!token) {
        setStatsError('Authentication required');
        setLoadingStats(false);
        return;
      }
      
      const response = await fetch('/api/games/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStatsError('Failed to load game statistics');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Games Arena</h1>
        <p className="text-gray-600 mt-2">
          Play games and earn coins! Complete puzzles to add coins to your wallet.
        </p>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-800 font-semibold mr-2">🎮 Current Balance:</span>
            <span className="text-2xl font-bold text-yellow-600">
              {user?.totalPoints || 0} coins
            </span>
          </div>
          {!user && (
            <p className="text-yellow-700 text-sm mt-2">
              Please sign in to play games and earn coins
            </p>
          )}
        </div>
      </div>

      {/* Show stats or loading/error state */}
      {loadingStats ? (
        <div className="bg-white rounded-xl shadow-md p-8 mb-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading game statistics...</p>
        </div>
      ) : statsError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-800">Unable to load stats</h3>
              <p className="text-red-700 text-sm mt-1">{statsError}</p>
              <button
                onClick={fetchGameStats}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <GameStats stats={stats} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {gameList.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            user={user}
            onGameStart={fetchGameStats}
          />
        ))}
      </div>

      {!user && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center">
            <div className="text-blue-600 mr-4 text-2xl">🔒</div>
            <div>
              <h3 className="font-bold text-blue-800">Sign in to play games</h3>
              <p className="text-blue-700 mt-1">
                Create an account or sign in to start playing games and earning coins!
              </p>
              <div className="flex gap-3 mt-4">
                <a
                  href="/login"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="px-5 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                >
                  Create Account
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How it works</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">1</div>
            <p className="text-gray-700">Choose a game and difficulty level</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">2</div>
            <p className="text-gray-700">Complete the puzzle within the time limit</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">3</div>
            <p className="text-gray-700">Earn coins based on difficulty and completion time</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">4</div>
            <p className="text-gray-700">Coins are automatically added to your wallet</p>
          </div>
        </div>
      </div>
    </div>
  );
}