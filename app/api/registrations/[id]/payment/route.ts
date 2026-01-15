import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { paymentMethod, paymentDetails, amount } = await request.json();

    const db = await getDatabase();
    const registrationsCollection = db.collection('registrations');
    const eventsCollection = db.collection('events');

    // Get registration
    const registration = await registrationsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (registration.paymentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 400 }
      );
    }

    // Update registration with payment info
    await registrationsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          paymentStatus: 'completed',
          paymentMethod,
          paymentDetails,
          paidAmount: amount,
          status: 'confirmed',
          paidAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Decrease available seats
    await eventsCollection.updateOne(
      { _id: registration.eventId },
      { $inc: { availableSeats: -1 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Payment successful'
    });

  } catch (error) {
    console.error('❌ Payment error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}