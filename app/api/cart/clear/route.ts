// app/api/cart/clear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/mongodb';
import mongoose from 'mongoose';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
  try {
    await connectDb();
    console.log('🧹 Cart clear request received');

    // ✅ Ensure DB is available (FIX for TS error)
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid token' },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;
    console.log('✅ Clearing cart for user:', firebaseUid);

    // Get all cart-related collections
    const collections = await db.listCollections().toArray();
    const cartCollections = collections.filter(col =>
      col.name.toLowerCase().includes('cart')
    );

    console.log(
      '📦 Found cart collections:',
      cartCollections.map(c => c.name)
    );

    let clearedCount = 0;

    // Field name variations
    const fieldVariations = [
      'userId',
      'firebaseUid',
      'uid',
      'user_id',
      'firebase_uid'
    ];

    for (const collection of cartCollections) {
      const CartCollection = db.collection(collection.name);

      for (const field of fieldVariations) {
        try {
          // Clear items array
          const updateResult = await CartCollection.updateMany(
            { [field]: firebaseUid },
            { $set: { items: [] } }
          );

          clearedCount += updateResult.modifiedCount || 0;

          // Delete carts completely
          const deleteResult = await CartCollection.deleteMany(
            { [field]: firebaseUid }
          );

          clearedCount += deleteResult.deletedCount || 0;
        } catch {
          // Ignore mismatched schemas / fields
        }
      }
    }

    console.log(`✅ Total carts cleared: ${clearedCount}`);

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
      clearedCount
    });
  } catch (error: any) {
    console.error('❌ Error clearing cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
