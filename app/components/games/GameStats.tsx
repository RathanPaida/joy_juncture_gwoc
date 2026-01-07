'use client';

interface GameStatsProps {
  stats: {
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
  };
}

export default function GameStats({ stats }: GameStatsProps) {
  const formatGameType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Game Stats</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total Games</div>
          <div className="text-3xl font-bold text-blue-700">{stats.totalGames}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Coins Earned</div>
          <div className="text-3xl font-bold text-green-700">{stats.totalCoinsEarned}</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Win Rate</div>
          <div className="text-3xl font-bold text-purple-700">
            {stats.totalGames > 0 
              ? `${Math.round((stats.gameStats.reduce((acc, stat) => acc + stat.wins, 0) / stats.totalGames) * 100)}%`
              : '0%'
            }
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 font-medium">Global Rank</div>
          <div className="text-3xl font-bold text-yellow-700">#{stats.rank || 'N/A'}</div>
        </div>
      </div>

      {/* Game-specific stats */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance by Game</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.gameStats.map((stat) => (
            <div key={stat._id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-800">{formatGameType(stat._id)}</span>
                <span className="text-sm px-2 py-1 rounded bg-white">
                  {stat.wins}/{stat.totalGames} wins
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coins Earned:</span>
                  <span className="font-semibold text-yellow-600">{stat.totalCoins}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Score:</span>
                  <span className="font-semibold">{Math.round(stat.avgScore)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Games */}
      {stats.recentGames && stats.recentGames.length > 0 && (
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
                {stats.recentGames.map((game, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatGameType(game.gameType)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        game.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        game.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {game.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        game.win ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {game.win ? 'Won' : 'Lost'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-yellow-600">
                      {game.coinsEarned}
                    </td>
                    <td className="px-4 py-3 text-sm">{game.score}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(game.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}