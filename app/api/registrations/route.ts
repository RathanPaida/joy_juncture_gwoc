
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { eventId, userId, userName, userEmail, amount } = await request.json();

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const eventsCollection = db.collection('events');
    const registrationsCollection = db.collection('registrations');

    // Check if event exists and has available seats
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.availableSeats <= 0) {
      return NextResponse.json(
        { error: 'No seats available' },
        { status: 400 }
      );
    }

    // Check if user already registered
    const existingRegistration = await registrationsCollection.findOne({
      eventId: new ObjectId(eventId),
      userId
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      );
    }

    // Generate unique verification code
    const verificationCode = crypto.randomBytes(16).toString('hex');
    const qrData = `${eventId}-${userId}-${verificationCode}`;

    // Create registration
    const registration = {
      eventId: new ObjectId(eventId),
      userId,
      userName,
      userEmail,
      amount,
      verificationCode,
      qrData,
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await registrationsCollection.insertOne(registration);

    return NextResponse.json({
      success: true,
      registrationId: result.insertedId.toString(),
      verificationCode
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    if (!eventId || !userId) {
      return NextResponse.json({ isRegistered: false });
    }

    const db = await getDatabase();
    const registrationsCollection = db.collection('registrations');

    const registration = await registrationsCollection.findOne({
      eventId: new ObjectId(eventId),
      userId,
      paymentStatus: 'completed'
    });

    return NextResponse.json({
      isRegistered: !!registration,
      registration: registration ? {
        _id: registration._id.toString(),
        verificationCode: registration.verificationCode,
        qrData: registration.qrData
      } : null
    });

  } catch (error) {
    console.error('❌ Check registration error:', error);
    return NextResponse.json({ isRegistered: false });
  }
}
