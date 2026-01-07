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
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Game Stats</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Games Card */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total Games</div>
          <div className="text-3xl font-bold text-blue-700">{calculatedTotalGames}</div>
          {calculatedTotalGames === 0 && (
            <div className="text-xs text-blue-500 mt-1">Play your first game!</div>
          )}
        </div>
        
        {/* Coins Earned Card */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Coins Earned</div>
          <div className="text-3xl font-bold text-green-700">{calculatedTotalCoins}</div>
          {calculatedTotalCoins === 0 && (
            <div className="text-xs text-green-500 mt-1">Start earning coins!</div>
          )}
        </div>
        
        {/* Win Rate Card */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Win Rate</div>
          <div className="text-3xl font-bold text-purple-700">
            {calculatedTotalGames > 0 ? `${calculateWinRate()}%` : '0%'}
          </div>
          {calculatedTotalGames === 0 && (
            <div className="text-xs text-purple-500 mt-1">No games played yet</div>
          )}
        </div>
        
        {/* Global Rank Card */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 font-medium">Global Rank</div>
          <div className="text-3xl font-bold text-yellow-700">
            #{rank > 0 ? rank : 'N/A'}
          </div>
          {!rank && (
            <div className="text-xs text-yellow-500 mt-1">Play to get ranked</div>
          )}
        </div>
      </div>

      {/* Game-specific stats */}
      {hasGameStats ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance by Game</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameStats.map((stat: any, index: number) => (
              <div key={stat?._id || `game-stat-${index}`} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800">
                    {formatGameType(stat?._id || 'Unknown')}
                  </span>
                  <span className="text-sm px-2 py-1 rounded bg-white">
                    {(stat?.wins || 0)}/{(stat?.totalGames || 0)} wins
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Coins Earned:</span>
                    <span className="font-semibold text-yellow-600">{stat?.totalCoins || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Score:</span>
                    <span className="font-semibold">{Math.round(stat?.avgScore || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-8 text-center bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-4xl mb-4">🎮</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Game Statistics Yet</h3>
          <p className="text-gray-500">Play some games to see your performance stats here!</p>
        </div>
      )}

      {/* Recent Games */}
      {hasRecentGames ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Games</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Game</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coins</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentGames.map((game: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatGameType(game?.gameType || 'unknown')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        game?.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        game?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        game?.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {game?.difficulty || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        game?.win ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {game?.win ? 'Won' : 'Lost'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-yellow-600">
                      {game?.coinsEarned || 0}
                    </td>
                    <td className="px-4 py-3 text-sm">{game?.score || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(game?.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Recent Games</h3>
          <p className="text-gray-500">Your recent games will appear here once you start playing.</p>
        </div>
      )}
    </div>
  );
}