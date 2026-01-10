// lib/userHelpers.ts - Helper functions for user operations
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Transaction } from '@/models/User';

interface AddCoinsParams {
  userId: string;
  coins: number;
  eventId: string;
  eventName: string;
  registrationId: string;
  paymentId?: string;
}

export async function addCoinsToUser(params: AddCoinsParams) {
  const { userId, coins, eventId, eventName, registrationId, paymentId } = params;
  
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Get current user balance
    const user = await usersCollection.findOne({ firebaseUid: userId });
    const currentBalance = user?.walletBalance || 0;
    const newBalance = currentBalance + coins;

    // Update user wallet
    const result = await usersCollection.updateOne(
      { firebaseUid: userId },
      {
        $inc: { walletBalance: coins },
        $set: { 
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Create transaction record
    try {
      await Transaction.create({
        userId: userId,
        type: 'event',
        amount: coins,
        description: `Coins earned from registering for ${eventName}`,
        referenceId: registrationId,
        metadata: {
          eventId: eventId,
          eventName: eventName,
          registrationId: registrationId,
          paymentId: paymentId
        },
        balanceAfter: newBalance,
        status: 'completed'
      });
    } catch (txError) {
      console.error('❌ Transaction logging failed:', txError);
      // Continue even if transaction logging fails
    }

    return {
      success: true,
      coinsAdded: coins,
      newBalance: newBalance
    };
  } catch (error) {
    console.error('❌ Error adding coins:', error);
    throw error;
  }
}

interface AddRegisteredEventParams {
  userId: string;
  eventId: string;
}

export async function addRegisteredEventToUser(params: AddRegisteredEventParams) {
  const { userId, eventId } = params;
  
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Add event to user's registered events (avoid duplicates with $addToSet)
    const result = await usersCollection.updateOne(
      { firebaseUid: userId },
      {
        $addToSet: { registeredEvents: new ObjectId(eventId) },
        $set: { 
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return {
      success: true,
      modified: result.modifiedCount > 0
    };
  } catch (error) {
    console.error('❌ Error adding registered event:', error);
    throw error;
  }
}

interface GetUserRegisteredEventsParams {
  userId: string;
}

export async function getUserRegisteredEvents(params: GetUserRegisteredEventsParams) {
  const { userId } = params;
  
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');
    const eventsCollection = db.collection('events');

    // Get user with populated registered events
    const user = await usersCollection.findOne({ firebaseUid: userId });
    
    if (!user || !user.registeredEvents || user.registeredEvents.length === 0) {
      return [];
    }

    // Get event details
    const events = await eventsCollection
      .find({ _id: { $in: user.registeredEvents } })
      .toArray();

    return events;
  } catch (error) {
    console.error('❌ Error fetching registered events:', error);
    throw error;
  }
}

interface GetUserWalletBalanceParams {
  userId: string;
}

export async function getUserWalletBalance(params: GetUserWalletBalanceParams) {
  const { userId } = params;
  
  try {
    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { firebaseUid: userId },
      { projection: { walletBalance: 1 } }
    );

    return user?.walletBalance || 0;
  } catch (error) {
    console.error('❌ Error fetching wallet balance:', error);
    throw error;
  }
}