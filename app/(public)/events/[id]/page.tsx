'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/app/contexts/AuthContext';

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Event {
  _id: string;
  name: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  price: number;
  coins: number;
  totalSeats: number;
  availableSeats: number;
  registrationLink: string;
  collabWith: string;
  imageUrl: string;
  isActive: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEvent();
      checkRegistration();
    }
  }, [params.id, user]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`);
      const data = await response.json();
      
      if (data.success && data.event) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/registrations/check?eventId=${params.id}&userId=${user.uid}`);
      const data = await response.json();
      setIsRegistered(data.isRegistered);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      alert('Please login to register for this event');
      router.push('/login');
      return;
    }

    if (event && event.availableSeats <= 0) {
      alert('Sorry, this event is fully booked!');
      return;
    }

    setRegistering(true);

    try {
      // Create Razorpay order
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: params.id,
          userId: user.uid,
          userName: user.name || user.displayName || user.email,
          userEmail: user.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Initialize Razorpay payment
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'Joy Juncture',
        description: event?.name || 'Event Registration',
        order_id: data.orderId,
        handler: async function (response: any) {
          // Verify payment
          try {
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: data.orderId
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // Redirect to success page
              router.push(`/events/${params.id}/payment/success?registrationId=${verifyData.registrationId}`);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.name || user.displayName || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        alert('Payment failed: ' + response.error.description);
        setRegistering(false);
      });
      
      razorpay.open();
      setRegistering(false);

    } catch (error) {
      console.error('Registration error:', error);
      alert(error instanceof Error ? error.message : 'Registration failed');
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <button
            onClick={() => router.push('/events')}
            className="text-blue-600 hover:underline"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const seatsPercentage = (event.availableSeats / event.totalSeats) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <button
            onClick={() => router.push('/events')}
            className="flex items-center text-white hover:text-gray-200 mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.name}</h1>
              <p className="text-xl text-blue-100 mb-6">{event.description}</p>
              
              {event.collabWith && (
                <div className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full">
                  <span className="text-sm">In collaboration with {event.collabWith}</span>
                </div>
              )}
            </div>
            
            {event.imageUrl && (
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img src={event.imageUrl} alt={event.name} className="w-full h-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {event.longDescription || event.description}
              </div>
            </div>

            {/* Venue Information */}
            {event.venue && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">{event.venue}</p>
                      {event.address && <p className="text-gray-600 mt-1">{event.address}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{format(eventDate, 'PPP')}</p>
                  </div>
                </div>

                {event.time && (
                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold">{event.time}</p>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Entry Fee</p>
                    <p className="text-2xl font-bold text-gray-900">₹{event.price}</p>
                  </div>
                </div>

                {/* Coins */}
                {event.coins > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center text-yellow-800">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Earn {event.coins} coins upon attendance!</span>
                    </div>
                  </div>
                )}

                {/* Seats Available */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Available Seats</span>
                    <span className="font-bold text-gray-900">
                      {event.availableSeats} / {event.totalSeats}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        seatsPercentage > 50 ? 'bg-green-500' :
                        seatsPercentage > 25 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${seatsPercentage}%` }}
                    />
                  </div>
                  {event.availableSeats <= 10 && event.availableSeats > 0 && (
                    <p className="text-sm text-red-600 mt-2">⚠️ Only {event.availableSeats} seats left!</p>
                  )}
                </div>

                {/* Registration Button */}
                <div className="pt-4">
                  {isRegistered ? (
                    <button
                      onClick={() => router.push(`/events/${params.id}/ticket`)}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      View Your Ticket
                    </button>
                  ) : isPast ? (
                    <div className="text-center py-3 bg-gray-100 rounded-lg">
                      <span className="text-gray-600 font-semibold">Event has ended</span>
                    </div>
                  ) : event.availableSeats <= 0 ? (
                    <div className="text-center py-3 bg-red-100 rounded-lg">
                      <span className="text-red-600 font-semibold">Sold Out</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? 'Processing...' : 'Register Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}