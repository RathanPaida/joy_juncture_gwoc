export const dynamic = 'force-dynamic';
// app/api/registrations/check/route.ts
// This route checks if a user is already registered for an event

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const db = await getDatabase();

    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');

    console.log('🔍 Checking registration:', { eventId, userId });

    if (!eventId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing eventId or userId',
          isRegistered: false
        },
        { status: 400 }
      );
    }

    // Validate eventId is a valid ObjectId format
    if (!ObjectId.isValid(eventId)) {
      console.log('⚠️ Invalid eventId format, treating as not registered');
      return NextResponse.json({
        success: true,
        isRegistered: false,
        message: 'Invalid event ID format'
      });
    }

    const registrationsCollection = db.collection('registrations');

    // Convert eventId to ObjectId
    let eventObjectId;
    try {
      eventObjectId = new ObjectId(eventId);
    } catch (error) {
      console.log('⚠️ Could not convert eventId to ObjectId');
      return NextResponse.json({
        success: true,
        isRegistered: false,
        message: 'Invalid event ID'
      });
    }

    // Check if registration exists
    const registration = await registrationsCollection.findOne({
      eventId: eventObjectId,
      userId: userId,
      paymentStatus: 'completed'
    });

    const isRegistered = !!registration;

    console.log(`✅ Registration check result: ${isRegistered}`);

    return NextResponse.json({
      success: true,
      isRegistered,
      registrationId: registration?._id?.toString()
    });

  } catch (error) {
    console.error('❌ Error checking registration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check registration status',
        isRegistered: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}