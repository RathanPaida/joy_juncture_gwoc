import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400}
    );
    }
    const db = await getDatabase();
const registrationsCollection = db.collection('registrations');

const registration = await registrationsCollection.findOne({
  eventId: new ObjectId(eventId),
  userId
});

if (!registration) {
  return NextResponse.json({ registration: null });
}

return NextResponse.json({
  registration: {
    ...registration,
    _id: registration._id.toString(),
    eventId: registration.eventId.toString()
  }
});
} catch (error) {
console.error('❌ Get registration error:', error);
return NextResponse.json(
{ error: 'Failed to fetch registration' },
{ status: 500 }
);
}
}