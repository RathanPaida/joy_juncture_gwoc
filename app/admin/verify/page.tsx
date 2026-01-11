// app/admin/verify/page.tsx - COMPLETE SIMPLE VERSION
'use client';

import { useState } from 'react';

interface VerificationResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  ticket?: {
    id: string;
    eventName: string;
    verificationCode: string;
    status: string;
  };
}

export default function VerifyTicketPage() {
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const verifyTicket = async (qrData: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/verify-ticket', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Invalid ticket');
        setResult(null);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = () => {
    if (!manualCode.trim()) {
      setError('Please enter a verification code');
      return;
    }
    verifyTicket(manualCode);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // For demo purposes, extract text from image
    // In real app, you'd use a QR decoding library here
    setTimeout(() => {
      // Mock QR code extraction
      const mockCode = 'TICKET-' + Math.random().toString(36).substring(7).toUpperCase();
      verifyTicket(mockCode);
    }, 1000);
  };

  const clearResults = () => {
    setResult(null);
    setError('');
    setManualCode('');
    setSelectedFile(null);
    setFilePreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Ticket Verification</h1>
          <p className="text-gray-400">Upload QR images or enter verification codes manually</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: File Upload & Manual Entry */}
          <div className="space-y-8">
            {/* File Upload Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Upload QR Image</h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    id="qr-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="qr-upload" className="cursor-pointer block">
                    <svg className="w-12 h-12 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400">Click to upload QR code image</p>
                    <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, GIF</p>
                  </label>
                </div>

                {filePreview && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Preview:</h3>
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <img 
                        src={filePreview} 
                        alt="QR code preview" 
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                  </div>
                )}

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="truncate">{selectedFile.name}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Entry Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Manual Verification</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
                />
                <button
                  onClick={handleManualVerify}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                  <div className="flex items-center text-red-300">
                    <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results & Stats */}
          <div className="space-y-8">
            {/* Results Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Verification Results</h2>
                {result && (
                  <button
                    onClick={clearResults}
                    className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-400">Verifying ticket...</span>
                </div>
              ) : result ? (
                <div className={`p-6 rounded-lg ${result.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                  <div className="flex items-center mb-6">
                    <div className={`w-4 h-4 rounded-full mr-3 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <h3 className="text-2xl font-bold">
                      {result.success ? '✓ Valid Ticket' : '✗ Invalid Ticket'}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {result.user && (
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">User Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm">Name</p>
                            <p className="font-medium">{result.user.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Email</p>
                            <p className="font-medium">{result.user.email}</p>
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-gray-400 text-sm">User ID</p>
                            <p className="font-mono text-sm">{result.user.id}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {result.ticket && (
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-3">Ticket Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Event:</span>
                            <span className="font-medium">{result.ticket.eventName}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Ticket ID:</span>
                            <span className="font-mono text-sm">{result.ticket.id}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Code:</span>
                            <span className="font-mono font-bold">{result.ticket.verificationCode}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              result.ticket.status === 'verified' 
                                ? 'bg-green-900 text-green-300' 
                                : result.ticket.status === 'pending'
                                ? 'bg-yellow-900 text-yellow-300'
                                : 'bg-red-900 text-red-300'
                            }`}>
                              {result.ticket.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {result.message && (
                      <div className="mt-4 p-3 bg-gray-900/70 rounded">
                        <p className="text-gray-300">{result.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No verification results yet.</p>
                  <p className="text-sm mt-1">Scan a ticket or enter manually.</p>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-6">Today's Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">42</div>
                  <div className="text-sm text-gray-400 mt-1">Verified</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-400">8</div>
                  <div className="text-sm text-gray-400 mt-1">Pending</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-400">3</div>
                  <div className="text-sm text-gray-400 mt-1">Invalid</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">53</div>
                  <div className="text-sm text-gray-400 mt-1">Total</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => window.open('/admin/tickets', '_blank')}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    View All Tickets
                  </button>
                  <button 
                    onClick={() => {
                      // Mock export functionality
                      alert('Export feature coming soon!');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Export Report
                  </button>
                  <button 
                    onClick={() => {
                      // Mock settings functionality
                      alert('Settings feature coming soon!');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-12 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">How to Verify Tickets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-2">1</div>
              <h3 className="font-medium mb-2">Upload QR Code</h3>
              <p className="text-gray-400 text-sm">
                Take a picture of the QR code on the ticket and upload it using the file upload button.
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-2">2</div>
              <h3 className="font-medium mb-2">Enter Code Manually</h3>
              <p className="text-gray-400 text-sm">
                If QR code can't be scanned, enter the verification code printed on the ticket.
              </p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-2">3</div>
              <h3 className="font-medium mb-2">Check Results</h3>
              <p className="text-gray-400 text-sm">
                View verification results with user details and ticket information. Invalid tickets will be flagged.
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="font-medium mb-3">Common Issues</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Blurry QR code images may fail to scan. Ensure the image is clear.</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Tickets marked as "pending" require payment confirmation before verification.</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Already verified tickets will show as "duplicate verification".</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}