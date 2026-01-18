export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrData } = body;

    console.log('🔍 Verifying ticket with data:', qrData);

    if (!qrData || typeof qrData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const registrationsCollection = db.collection('registrations');
    const eventsCollection = db.collection('events');

    // Try to find by verification code or QR data
    const registration = await registrationsCollection.findOne({
      $or: [
        { verificationCode: qrData },
        { qrData: qrData }
      ]
    });

    console.log('📝 Registration found:', registration ? 'Yes' : 'No');

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found. Please check the code and try again.' },
        { status: 404 }
      );
    }

    // Check payment status
    if (registration.paymentStatus !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed for this ticket' },
        { status: 400 }
      );
    }

    // Check if already used (optional - add this field if you want single-use tickets)
    if (registration.verified) {
      return NextResponse.json(
        { success: false, error: 'This ticket has already been used' },
        { status: 400 }
      );
    }

    // Get event details
    const event = await eventsCollection.findOne({ _id: registration.eventId });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Mark ticket as verified (optional)
    await registrationsCollection.updateOne(
      { _id: registration._id },
      {
        $set: {
          verified: true,
          verifiedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      userName: registration.userName,
      userEmail: registration.userEmail,
      eventName: event.name,
      verificationCode: registration.verificationCode,
      status: registration.status,
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error during verification' },
      { status: 500 }
    );
  }
}