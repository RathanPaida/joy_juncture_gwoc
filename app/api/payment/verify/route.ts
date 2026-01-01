import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDb from '@/lib/mongodb';
import { Registration, User, Transaction, Event } from '@/models/Event';

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, notes } = await request.json();
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Create registration
    const registration = await Registration.create({
      userId: notes.userId,
      eventId: notes.eventId,
      razorpayPaymentId: razorpay_payment_id,
      amountPaid: notes.amount / 100,
      coinsEarned: notes.coins,
      status: 'completed',
    });
    
    // Add coins to user
    await User.findByIdAndUpdate(notes.userId, {
      $inc: { coins: notes.coins }
    });
    
    // Create transaction record
    await Transaction.create({
      userId: notes.userId,
      type: 'credit',
      amount: notes.coins,
      description: `Coins earned for event registration`,
      referenceId: registration._id.toString(),
    });
    
    return NextResponse.json({ success: true, registration });
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}