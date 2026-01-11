
'use client';

import { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';

interface VerificationResult {
  success: boolean;
  userName: string;
  userEmail: string;
  eventName: string;
  verificationCode: string;
  status: string;
}

export default function VerifyTicketPage() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    setError('');

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        verifyTicket(decodedText);
        scanner.clear();
        setScanning(false);
      },
      (error) => {
        console.log(error);
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      setScanning(false);
    }
  };

  const verifyTicket = async (qrData: string) => {
    try {
      const response = await fetch('/api/verify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        setError('');
      } else {
        setError(data.error || 'Invalid ticket');
        setResult(null);
      }
    } catch (err) {
      setError('Verification failed');
      setResult(null);
    }
  };

  const handleManualVerify = () => {
    if (!manualCode.trim()) {
      setError('Please enter a verification code');
      return;
    }
    verifyTicket(manualCode);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">Ticket Verification</h1>
        <p className="text-gray-600 mb-8 text-center">Scan QR codes or enter verification codes manually</p>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Scanner Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan QR Code</h2>
            {!scanning ? (
              <button
                onClick={startScanner}
                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Start QR Scanner
              </button>
            ) : (
              <div>
                <div id="qr-reader" className="mb-4"></div>
                <button
                  onClick={stopScanner}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Stop Scanning
                </button>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Verification</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter verification code"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleManualVerify}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Verify
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {result && result.success && (
            <div className="p-6 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-900 text-center mb-4">Valid Ticket ✓</h3>
              <div className="space-y-3 text-gray-800">
                <div className="flex justify-between border-b border-green-200 pb-2">
                  <span className="font-semibold">Name:</span>
                  <span>{result.userName}</span>
                </div>
                <div className="flex justify-between border-b border-green-200 pb-2">
                  <span className="font-semibold">Email:</span>
                  <span>{result.userEmail}</span>
                </div>
                <div className="flex justify-between border-b border-green-200 pb-2">
                  <span className="font-semibold">Event:</span>
                  <span>{result.eventName}</span>
                </div>
                <div className="flex justify-between border-b border-green-200 pb-2">
                  <span className="font-semibold">Code:</span>
                  <span className="font-mono">{result.verificationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Status:</span>
                  <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                    {result.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: 'QR data is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const registrationsCollection = db.collection('registrations');
    const eventsCollection = db.collection('events');

    // Find registration by QR data or verification code
    const registration = await registrationsCollection.findOne({
      $or: [
        { qrData },
        { verificationCode: qrData }
      ]
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Invalid ticket' },
        { status: 404 }
      );
    }

    if (registration.paymentStatus !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get event details
    const event = await eventsCollection.findOne({ _id: registration.eventId });

    return NextResponse.json({
      success: true,
      userName: registration.userName,
      userEmail: registration.userEmail,
      eventName: event?.name || 'Unknown Event',
      verificationCode: registration.verificationCode,
      status: registration.status
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

