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
    <div className="container mx-auto px-4 py-8 bg-neutral-950 min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-3 tracking-tight">
          GAMES ARENA
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Play games and earn coins! Complete puzzles to add coins to your wallet.
        </p>

        <div className="mt-8 inline-flex items-center p-1 pl-2 pr-6 bg-neutral-900 border border-neutral-800 rounded-full shadow-lg shadow-orange-900/10 hover:border-orange-500/30 transition-all">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-full mr-3 shadow-md">
            <span className="text-white font-bold text-lg">💰</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Balance</span>
            <span className="text-xl font-bold text-white">
              <span className="text-orange-500">{user?.totalPoints || 0}</span> coins
            </span>
          </div>
          {!user && (
            <span className="ml-4 text-xs font-semibold text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30">
              Login Required
            </span>
          )}
        </div>
      </div>

      {/* Show stats or loading/error state */}
      {loadingStats ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-md p-8 mb-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Loading Statistics...</p>
        </div>
      ) : statsError ? (
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="text-red-500 mr-4 text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-500">Unable to load stats</h3>
              <p className="text-red-400/80 text-sm mt-1">{statsError}</p>
              <button
                onClick={fetchGameStats}
                className="mt-3 px-4 py-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 text-xs font-bold uppercase tracking-wider transition-colors border border-red-900/30"
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
        <div className="mt-12 p-8 bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="absolute top-0 right-0 p-32 bg-orange-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-neutral-700">
              🔒
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="font-bold text-xl text-white mb-2">Sign in to play games</h3>
              <p className="text-gray-400">
                Create an account or sign in to start playing games, tracking your stats, and earning coins for your wallet!
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/login"
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-500 hover:to-red-500 font-bold shadow-lg shadow-orange-900/20 text-sm tracking-wide transition-all"
              >
                SIGN IN
              </a>
              <a
                href="/register"
                className="px-6 py-3 border border-neutral-700 text-gray-300 rounded-xl hover:bg-neutral-800 hover:text-white font-bold text-sm tracking-wide transition-all"
              >
                CREATE ACCOUNT
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16 border-t border-neutral-800 pt-10 pb-6">
        <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-8 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Choose Game', desc: 'Select a game and difficulty level that suits your skills.' },
            { step: '2', title: 'Play & Solve', desc: 'Complete the puzzle within the time limit to win.' },
            { step: '3', title: 'Earn Coins', desc: 'Get rewarded with coins based on difficulty and time.' },
            { step: '4', title: 'Build Wallet', desc: 'Coins are automatically added to your profile wallet.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 hover:border-orange-500/20 transition-colors">
              <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-orange-500 font-bold mb-4 border border-neutral-700 shadow-sm">
                {item.step}
              </div>
              <h3 className="text-white font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}