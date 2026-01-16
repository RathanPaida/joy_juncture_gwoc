'use client';

interface GameStatsProps {
  stats: any; // Using any for now since we're fixing null/undefined issues
}

export default function GameStats({ stats }: GameStatsProps) {
  // Handle null/undefined stats
  if (!stats) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Game Stats</h2>
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <p className="text-gray-500">No game statistics available yet</p>
          <p className="text-gray-400 text-sm mt-2">Play some games to see your stats here!</p>
        </div>
      </div>
    );
  }

  // Safe destructuring with defaults
  const {
    gameStats = [],
    recentGames = [],
    rank = 0,
    totalCoinsEarned = 0,
    totalGames = 0
  } = stats;

  const formatGameType = (type: string) => {
    if (!type) return 'Unknown';
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate win rate safely
  const calculateWinRate = () => {
    if (!Array.isArray(gameStats) || gameStats.length === 0) return 0;

    const totalWins = gameStats.reduce((acc, stat) => {
      return acc + (stat?.wins || 0);
    }, 0);

    const totalGamesPlayed = gameStats.reduce((acc, stat) => {
      return acc + (stat?.totalGames || 0);
    }, 0);

    if (totalGamesPlayed === 0) return 0;
    return Math.round((totalWins / totalGamesPlayed) * 100);
  };

  // Calculate total coins from gameStats if not provided
  const calculatedTotalCoins = totalCoinsEarned ||
    (Array.isArray(gameStats)
      ? gameStats.reduce((acc, stat) => acc + (stat?.totalCoins || 0), 0)
      : 0);

  // Calculate total games from gameStats if not provided
  const calculatedTotalGames = totalGames ||
    (Array.isArray(gameStats)
      ? gameStats.reduce((acc, stat) => acc + (stat?.totalGames || 0), 0)
      : 0);

  // Check if we have any game data to show
  const hasGameStats = Array.isArray(gameStats) && gameStats.length > 0;
  const hasRecentGames = Array.isArray(recentGames) && recentGames.length > 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden mb-8 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Your Game Stats</h2>
            <p className="text-gray-400 text-sm mt-1">Track your progress and earnings</p>
          </div>
          <div className="bg-neutral-800 p-2 rounded-lg border border-neutral-700">
            <span className="text-2xl">📊</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Total Games Card */}
          <div className="bg-neutral-800/50 p-5 rounded-xl border border-neutral-700/50 hover:border-orange-500/30 transition-colors group">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Total Games</div>
            <div className="text-3xl font-bold text-white group-hover:text-orange-400 transition-colors">{calculatedTotalGames}</div>
            {calculatedTotalGames === 0 && (
              <div className="text-xs text-gray-500 mt-2 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></span>
                Play your first game!
              </div>
            )}
          </div>

          {/* Coins Earned Card */}
          <div className="bg-neutral-800/50 p-5 rounded-xl border border-neutral-700/50 hover:border-orange-500/30 transition-colors group">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Coins Earned</div>
            <div className="text-3xl font-bold text-orange-500 group-hover:text-orange-400 transition-colors">{calculatedTotalCoins}</div>
            {calculatedTotalCoins === 0 && (
              <div className="text-xs text-gray-500 mt-2 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50 mr-2"></span>
                Start earning coins!
              </div>
            )}
          </div>

          {/* Win Rate Card */}
          <div className="bg-neutral-800/50 p-5 rounded-xl border border-neutral-700/50 hover:border-orange-500/30 transition-colors group">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Win Rate</div>
            <div className="text-3xl font-bold text-white">
              {calculatedTotalGames > 0 ? `${calculateWinRate()}%` : '0%'}
            </div>
            <div className="w-full bg-neutral-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-600 to-red-600 h-full rounded-full"
                style={{ width: `${calculatedTotalGames > 0 ? calculateWinRate() : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Global Rank Card */}
          <div className="bg-gradient-to-br from-orange-900/20 to-neutral-800/50 p-5 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-colors group">
            <div className="text-xs text-orange-400/80 font-medium uppercase tracking-wider mb-2">Global Rank</div>
            <div className="text-3xl font-bold text-orange-500">
              #{rank > 0 ? rank : 'N/A'}
            </div>
            {!rank && (
              <div className="text-xs text-orange-500/60 mt-2">Play to get ranked</div>
            )}
          </div>
        </div>

        {/* Game-specific stats */}
        {hasGameStats ? (
          <div className="mb-0">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center">
              <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
              Performance by Game
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gameStats.map((stat: any, index: number) => (
                <div key={stat?._id || `game-stat-${index}`} className="bg-neutral-800 p-5 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-all hover:translate-y-[-2px]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-white text-lg">
                      {formatGameType(stat?._id || 'Unknown')}
                    </span>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-gray-400">
                      {(stat?.wins || 0)}/{(stat?.totalGames || 0)} wins
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm items-center p-2 bg-neutral-900/50 rounded-lg">
                      <span className="text-gray-500 font-medium">Coins Earned</span>
                      <span className="font-bold text-orange-400">{stat?.totalCoins || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center p-2 bg-neutral-900/50 rounded-lg">
                      <span className="text-gray-500 font-medium">Avg Score</span>
                      <span className="font-bold text-white">{Math.round(stat?.avgScore || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8 p-10 text-center bg-neutral-800/30 rounded-xl border border-neutral-800 border-dashed">
            <div className="text-gray-600 text-5xl mb-4 grayscale opacity-50">🎮</div>
            <h3 className="text-lg font-medium text-white mb-2">No Game Statistics Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">Play some games to see your performance stats here! Your journey begins with a single game.</p>
          </div>
        )}

        {/* Recent Games */}
        {hasRecentGames && (
          <div className="mt-10 border-t border-neutral-800 pt-8">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center">
              <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
              Recent Games
            </h3>
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="min-w-full divide-y divide-neutral-800 bg-neutral-900">
                <thead className="bg-neutral-950">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Game</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Result</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Coins</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {recentGames.map((game: any, index: number) => (
                    <tr key={index} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {formatGameType(game?.gameType || 'unknown')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium border ${game?.difficulty === 'easy' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                          game?.difficulty === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50' :
                            game?.difficulty === 'hard' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                              'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                          {game?.difficulty || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`flex items-center gap-1.5 ${game?.win ? 'text-green-400' : 'text-red-400'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${game?.win ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {game?.win ? 'Won' : 'Lost'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-400">
                        +{game?.coinsEarned || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono">{game?.score || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(game?.completedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}