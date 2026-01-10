// import { NextRequest, NextResponse } from 'next/server';
// import { verifyIdToken } from '@/lib/firebase-admin';
// import { connectDb } from '@/lib/mongodb';
// import { User } from '@/models/User';
// import { GameSession, GameLeaderboard } from '@/models/Game';

// export async function GET(req: NextRequest) {
//   console.log('📊 Stats API called');
//   console.log('URL:', req.url);
//   console.log('Method:', req.method);
//   console.log('Headers:', Object.fromEntries(req.headers.entries()));
//   try {
//     await connectDb();
    
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
    
//     // Get user's game stats
//     const gameStats = await GameSession.aggregate([
//       { $match: { userId: user._id } },
//       {
//         $group: {
//           _id: '$gameType',
//           totalGames: { $sum: 1 },
//           wins: { $sum: { $cond: ['$win', 1, 0] } },
//           totalCoins: { $sum: '$coinsEarned' },
//           avgScore: { $avg: '$score' }
//         }
//       }
//     ]) || [];
    
//     // Get recent games
//     const recentGames = await GameSession.find({ userId: user._id })
//       .sort({ completedAt: -1 })
//       .limit(5)
//       .lean() || [];
    
//     // Get leaderboard position
//     const leaderboard = await GameLeaderboard.aggregate([
//       {
//         $group: {
//           _id: '$userId',
//           totalScore: { $sum: '$score' }
//         }
//       },
//       { $sort: { totalScore: -1 } },
//       {
//         $group: {
//           _id: null,
//           users: { $push: { userId: '$_id', totalScore: '$totalScore' } }
//         }
//       }
//     ]) || [];
    
//     let rank = 0;
//     if (leaderboard[0]?.users) {
//       const userIndex = leaderboard[0].users.findIndex(
//         (u: any) => u.userId.toString() === user._id.toString()
//       );
//       rank = userIndex + 1;
//     }
    
//     return NextResponse.json({
//       gameStats,
//       recentGames,
//       rank,
//       // totalCoinsEarned: !!gameStats.reduce((sum, stat) => sum + stat.totalCoins, 0) ? gameStats.reduce((sum, stat) => sum + stat.totalCoins, 0) : 0,
//       totalCoinsEarned: gameStats.reduce((sum, stat) => sum + stat.totalCoins, 0),
//       // totalGames: !!gameStats.reduce((sum, stat) => sum + stat.totalGames, 0) ? gameStats.reduce((sum, stat) => sum + stat.totalGames, 0) : 0
//       totalGames: gameStats.reduce((sum, stat) => sum + stat.totalGames, 0)
//     }, { status: 200 });
    
//   } catch (error) {
//     console.error('Error fetching game stats:', error);
//     return NextResponse.json(
//       { error: 'Server error' },
//       { status: 500 }
//     );
//   }
// }