'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('registrationId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/events/${params.id}/ticket`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your registration has been confirmed. Get ready for an amazing experience!
          </p>
        </div>

        {/* Confetti Animation */}
        <div className="mb-6">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>What's next?</strong><br />
            You'll be redirected to your ticket page where you can view and download your QR code ticket.
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-6">
          <p className="text-gray-600">
            Redirecting in <span className="font-bold text-blue-600">{countdown}</span> seconds...
          </p>
        </div>

        {/* Manual Navigation */}
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/events/${params.id}/ticket`)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View My Ticket Now
          </button>
          <button
            onClick={() => router.push('/events')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="spinner-small mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}