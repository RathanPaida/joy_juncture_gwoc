// lib/walletHelpers.ts - Compatible with your Mongoose models
import { connectDb } from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';

/**
 * Core function to add points to wallet
 */
async function addPointsToWallet(
  userId: string, // This is the MongoDB _id, not firebaseUid
  amount: number,
  type: 'purchase' | 'event' | 'game' | 'referral' | 'bonus' | 'redeem' | 'daily' | 'community',
  description: string,
  metadata?: any
) {
  await connectDb();

  // Find user by MongoDB _id
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Update user's total points
  user.totalPoints = (user.totalPoints || 0) + amount;
  user.lastActivity = new Date();
  await user.save();

  // Create transaction log
  const transaction = new Transaction({
    userId: user._id,
    type: type,
    amount: amount,
    description: description,
    metadata: metadata || {},
    balanceAfter: user.totalPoints,
    status: 'completed'
  });

  await transaction.save();

  return {
    newBalance: user.totalPoints,
    transaction: transaction
  };
}

/**
 * Award points for product purchase
 * Call this after successful payment/checkout
 */
export async function awardPurchasePoints(
  userId: string, // MongoDB _id
  productName: string,
  purchaseAmount: number,
  orderId: string
) {
  // Award 1 point per $1 spent
  const points = Math.floor(purchaseAmount);
  
  return await addPointsToWallet(
    userId,
    points,
    'purchase',
    `Purchased ${productName}`,
    {
      productName,
      purchaseAmount,
      orderId,
      pointsRatio: '1:1'
    }
  );
}

/**
 * Award points for event registration
 */
export async function awardEventPoints(
  userId: string,
  eventName: string,
  eventId: string,
  eventType: 'free' | 'paid' = 'free'
) {
  const points = eventType === 'paid' ? 50 : 25;
  
  return await addPointsToWallet(
    userId,
    points,
    'event',
    `Registered for ${eventName}`,
    {
      eventName,
      eventId,
      eventType
    }
  );
}

/**
 * Award points for attending an event
 */
export async function awardEventAttendancePoints(
  userId: string,
  eventName: string,
  eventId: string
) {
  const points = 30;
  
  return await addPointsToWallet(
    userId,
    points,
    'event',
    `Attended ${eventName}`,
    {
      eventName,
      eventId,
      type: 'attendance'
    }
  );
}

/**
 * Award points for playing a game
 */
export async function awardGamePoints(
  userId: string,
  gameName: string,
  gameId: string,
  duration: number, // in minutes
  score?: number
) {
  const basePoints = 5;
  const durationBonus = Math.min(Math.floor(duration / 10), 20);
  const scoreBonus = score ? Math.min(Math.floor(score / 100), 15) : 0;
  
  const totalPoints = basePoints + durationBonus + scoreBonus;
  
  return await addPointsToWallet(
    userId,
    totalPoints,
    'game',
    `Played ${gameName}`,
    {
      gameName,
      gameId,
      duration,
      score,
      breakdown: {
        base: basePoints,
        durationBonus,
        scoreBonus
      }
    }
  );
}

/**
 * Award points for completing a game milestone
 */
export async function awardGameMilestonePoints(
  userId: string,
  gameName: string,
  milestone: string,
  points: number = 20
) {
  return await addPointsToWallet(
    userId,
    points,
    'game',
    `${gameName}: ${milestone}`,
    {
      gameName,
      milestone,
      type: 'milestone'
    }
  );
}

/**
 * Award points for referring a friend
 */
export async function awardReferralPoints(
  userId: string,
  referredUserName: string,
  referredUserId: string
) {
  const points = 100;
  
  return await addPointsToWallet(
    userId,
    points,
    'referral',
    `Referred ${referredUserName}`,
    {
      referredUserName,
      referredUserId
    }
  );
}

/**
 * Award bonus points
 */
export async function awardBonusPoints(
  userId: string,
  reason: string,
  points: number,
  metadata?: any
) {
  return await addPointsToWallet(
    userId,
    points,
    'bonus',
    reason,
    metadata
  );
}

/**
 * Helper to get user by Firebase UID
 */
export async function getUserByFirebaseUid(firebaseUid: string) {
  await connectDb();
  
  let user = await User.findOne({ firebaseUid });
  
  if (!user) {
    console.warn(`User not found by firebaseUid: ${firebaseUid}`);
  }
  
  return user;
}