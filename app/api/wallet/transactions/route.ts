// app/api/wallet/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDb } from '@/lib/mongodb';
import { User, Transaction } from '@/models/User';

// GET - Fetch user's transaction history
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);

    // Find user by Firebase UID or email
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.findOne({ email: decodedToken.email?.toLowerCase() });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // Filter by type
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId: user._id };
    if (type && type !== 'all') {
      query.type = type;
    }

    // Fetch transactions with pagination
    const transactions = await Transaction
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(query);

    return NextResponse.json({
      success: true,
      transactions: transactions,
      pagination: {
        page: page,
        limit: limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}