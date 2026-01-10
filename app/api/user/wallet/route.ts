// app/api/user/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import connectDb from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDb();

    // Fetch user's wallet from User model
    const user = await User.findOne({ firebaseUid: userId })
      .select('walletBalance totalPoints')
      .lean();

    if (!user) {
      return NextResponse.json({ 
        success: true, 
        wallet: {
          balance: 0,
          totalSpent: 0,
          totalEarned: 0,
          transactions: 0
        }
      });
    }

    // Get transaction stats
    const transactions = await Transaction.find({ userId: userId }).lean();
    
    const totalSpent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({ 
      success: true, 
      wallet: {
        balance: user.walletBalance || 0,
        totalSpent: totalSpent,
        totalEarned: totalEarned,
        transactions: transactions.length
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching wallet:', error);
    
    // Return default wallet on error
    return NextResponse.json({ 
      success: true, 
      wallet: {
        balance: 0,
        totalSpent: 0,
        totalEarned: 0,
        transactions: 0
      }
    });
  }
}