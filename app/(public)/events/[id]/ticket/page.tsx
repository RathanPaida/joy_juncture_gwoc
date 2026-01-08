'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import QRCode from 'qrcode';
import { format } from 'date-fns';

interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  verificationCode: string;
  qrData: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  price: number;
}

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTicket();
  }, [user]);

  const fetchTicket = async () => {
    try {
      // Fetch registration
      const regResponse = await fetch(`/api/registrations/user/${user.uid}?eventId=${params.id}`);
      const regData = await regResponse.json();

      if (!regData.registration) {
        alert('No ticket found for this event');
        router.push(`/events/${params.id}`);
        return;
      }

      if (regData.registration.paymentStatus !== 'completed') {
        alert('Payment not completed');
        router.push(`/events/${params.id}/payment?registrationId=${regData.registration._id}`);
        return;
      }

      setRegistration(regData.registration);

      // Fetch event details
      const eventResponse = await fetch(`/api/events/${params.id}`);
      const eventData = await eventResponse.json();
      
      if (eventData.success && eventData.event) {
        setEvent(eventData.event);
      }

      // Generate QR Code
      const qrUrl = await QRCode.toDataURL(regData.registration.qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);

    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    if (!ticketRef.current) return;

    // Use html2canvas for better quality (install: npm install html2canvas)
    // For now, we'll use a simple download of the QR code
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `ticket-${event?.name.replace(/\s+/g, '-')}-${registration?.verificationCode}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (!registration || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Event Ticket</h1>
          <p className="text-gray-600">Show this QR code at the event entrance</p>
        </div>

        {/* Ticket */}
        <div ref={ticketRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm opacity-90 mb-1">EVENT TICKET</div>
                <div className="text-2xl font-bold">{event.name}</div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold">✓ CONFIRMED</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-8 text-center border-b-2 border-dashed border-gray-300">
            <div className="inline-block bg-white p-6 rounded-xl shadow-lg">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="Ticket QR Code" className="w-64 h-64 mx-auto" />
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600 font-mono">
              Code: {registration.verificationCode}
            </p>
          </div>

          {/* Event Details */}
          <div className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Date & Time</div>
                <div className="font-semibold text-gray-900">
                  {format(new Date(event.date), 'PPP')}
                </div>
                {event.time && (
                  <div className="text-gray-700">{event.time}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Venue</div>
                <div className="font-semibold text-gray-900">{event.venue}</div>
                {event.address && (
                  <div className="text-sm text-gray-600 mt-1">{event.address}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Attendee Name</div>
                <div className="font-semibold text-gray-900">{registration.userName}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Email</div>
                <div className="font-semibold text-gray-900">{registration.userEmail}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Ticket Price</div>
                <div className="font-semibold text-gray-900">₹{event.price}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Registration Date</div>
                <div className="font-semibold text-gray-900">
                  {format(new Date(registration.createdAt), 'PP')}
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Important Instructions
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Please arrive 15 minutes before the event starts</li>
                <li>• Bring a valid ID for verification</li>
                <li>• This QR code is unique and non-transferable</li>
                <li>• Screenshot or print this ticket for entry</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8 bg-gray-50 space-y-3">
            <button
              onClick={downloadTicket}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code
            </button>
            <button
              onClick={() => router.push('/events')}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-white"
            >
              Back to Events
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Need help? Contact support at support@joyjuncture.com</p>
        </div>
      </div>
    </div>
  );
}