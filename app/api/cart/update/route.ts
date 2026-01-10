// app/api/cart/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { verifyIdToken } from '@/lib/firebase-admin';

const uri = process.env.MONGODB_URI!;

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing itemId or quantity' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    const client = new MongoClient(uri);

    try {
      await client.connect();
      const db = client.db('joyjuncture');
      const cartCollection = db.collection('cart');

      const result = await cartCollection.updateOne(
        { _id: new ObjectId(itemId), userId },
        {
          $set: {
            quantity,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Quantity updated successfully',
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// ===== app/api/cart/remove/route.ts =====
// Copy the content below into a separate file at app/api/cart/remove/route.ts