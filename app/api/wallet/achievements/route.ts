// app/api/wallet/achievements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDb } from '@/lib/mongodb';
import { User } from '@/models/User';

// Define default achievements
const DEFAULT_ACHIEVEMENTS = [
  {
    _id: 'first_purchase',
    name: 'First Purchase',
    description: 'Make your first purchase at Joy Juncture',
    icon: 'FaShoppingCart',
    points: 100,
    requirement: 1,
    unlocked: false,
    progress: 0
  },
  {
    _id: 'event_regular',
    name: 'Event Regular',
    description: 'Attend 5 events',
    icon: 'FaCalendarAlt',
    points: 250,
    requirement: 5,
    unlocked: false,
    progress: 0
  },
  {
    _id: 'streak_champion',
    name: 'Streak Champion',
    description: 'Maintain a 7-day login streak',
    icon: 'FaFire',
    points: 200,
    requirement: 7,
    unlocked: false,
    progress: 0
  },
  {
    _id: 'points_collector',
    name: 'Points Collector',
    description: 'Earn 1000 total points',
    icon: 'FaCoins',
    points: 150,
    requirement: 1000,
    unlocked: false,
    progress: 0
  },
  {
    _id: 'game_master',
    name: 'Game Master',
    description: 'Complete 10 online games',
    icon: 'FaGamepad',
    points: 300,
    requirement: 10,
    unlocked: false,
    progress: 0
  },
  {
    _id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Refer 3 friends',
    icon: 'FaUsers',
    points: 500,
    requirement: 3,
    unlocked: false,
    progress: 0
  },
  {
    _id: 'level_master',
    name: 'Level Master',
    description: 'Reach level 5',
    icon: 'FaTrophy',
    points: 400,
    requirement: 5,
    unlocked: false,
    progress: 0
  },
  {
    _id: 'reward_redeemer',
    name: 'Reward Redeemer',
    description: 'Redeem your first reward',
    icon: 'FaGift',
    points: 100,
    requirement: 1,
    unlocked: false,
    progress: 0
  }
];

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching achievements...');
    await connectDb();
    
    let user = null;
    const authHeader = req.headers.get('authorization');
    
    // Check for Firebase token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      try {
        const decodedToken = await verifyIdToken(token);
        user = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!user) {
          user = await User.findOne({ email: decodedToken.email?.toLowerCase() });
        }
      } catch (firebaseError) {
        console.error('Firebase auth failed:', firebaseError);
      }
    }
    
    // If no user found, return default achievements
    if (!user) {
      console.log('No user found, returning default achievements');
      return NextResponse.json({ achievements: DEFAULT_ACHIEVEMENTS }, { status: 200 });
    }
    
    console.log('User found:', user.email);
    
    // Get user's achievements from their record
    const userAchievements = user.achievements || [];
    
    // Merge with default achievements to show progress
    const achievements = DEFAULT_ACHIEVEMENTS.map(defaultAch => {
      const userAch = userAchievements.find(
        (a: any) => a.achievementId === defaultAch._id
      );
      
      if (userAch) {
        return {
          ...defaultAch,
          unlocked: userAch.unlocked || false,
          progress: userAch.progress || 0,
          unlockedAt: userAch.unlockedAt
        };
      }
      
      // Calculate progress based on user stats
      let progress = 0;
      switch (defaultAch._id) {
        case 'first_purchase':
          // Check if user has any purchase transactions
          progress = userAchievements.some((a: any) => a.achievementId === 'first_purchase') ? 1 : 0;
          break;
        case 'event_regular':
          progress = userAchievements.find((a: any) => a.achievementId === 'event_regular')?.progress || 0;
          break;
        case 'streak_champion':
          progress = Math.min(user.streak || 0, defaultAch.requirement);
          break;
        case 'points_collector':
          progress = Math.min(user.totalPoints || 0, defaultAch.requirement);
          break;
        case 'level_master':
          progress = Math.min(user.level || 1, defaultAch.requirement);
          break;
        default:
          progress = 0;
      }
      
      return {
        ...defaultAch,
        progress,
        unlocked: progress >= defaultAch.requirement
      };
    });
    
    console.log('Achievements calculated:', achievements.length);
    
    return NextResponse.json({ achievements }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    
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
    
    const body = await req.json();
    const { achievementId } = body;
    
    if (!achievementId) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      );
    }
    
    // Find the achievement definition
    const achievement = DEFAULT_ACHIEVEMENTS.find(a => a._id === achievementId);
    if (!achievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }
    
    // Check if already unlocked
    const existingAch = user.achievements.find(
      (a: any) => a.achievementId === achievementId
    );
    
    if (existingAch?.unlocked) {
      return NextResponse.json(
        { error: 'Achievement already unlocked' },
        { status: 400 }
      );
    }
    
    // Unlock the achievement
    if (existingAch) {
      existingAch.unlocked = true;
      existingAch.unlockedAt = new Date();
    } else {
      user.achievements.push({
        achievementId,
        unlocked: true,
        progress: achievement.requirement,
        unlockedAt: new Date()
      });
    }
    
    // Award points
    user.totalPoints = (user.totalPoints || 0) + achievement.points;
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      achievement,
      newBalance: user.totalPoints
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error unlocking achievement:', error);
    return NextResponse.json(
      { error: 'Failed to unlock achievement', details: error.message },
      { status: 500 }
    );
  }
}