// // 'use client';

// // import { useEffect, useState } from 'react';
// // import { useParams, useRouter, useSearchParams } from 'next/navigation';
// // import { useAuth } from '@/app/contexts/AuthContext';

// // interface Event {
// //   _id: string;
// //   name: string;
// //   price: number;
// //   date: string;
// //   venue: string;
// // }

// // export default function PaymentPage() {
// //   const params = useParams();
// //   const router = useRouter();
// //   const searchParams = useSearchParams();
// //   const { user } = useAuth();
// //   const registrationId = searchParams.get('registrationId');

// //   const [event, setEvent] = useState<Event | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [processing, setProcessing] = useState(false);
// //   const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash'>('upi');
// //   const [paymentDetails, setPaymentDetails] = useState({
// //     upiId: '',
// //     cardNumber: '',
// //     cardExpiry: '',
// //     cardCvv: '',
// //     cardName: ''
// //   });

// //   useEffect(() => {
// //     if (!user) {
// //       router.push('/login');
// //       return;
// //     }
// //     if (!registrationId) {
// //       router.push(`/events/${params.id}`);
// //       return;
// //     }
// //     fetchEvent();
// //   }, [user, registrationId]);

// //   const fetchEvent = async () => {
// //     try {
// //       const response = await fetch(`/api/events/${params.id}`);
// //       const data = await response.json();
      
// //       if (data.success && data.event) {
// //         setEvent(data.event);
// //       }
// //     } catch (error) {
// //       console.error('Error fetching event:', error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handlePayment = async () => {
// //     setProcessing(true);

// //     try {
// //       // Simulate payment processing
// //       await new Promise(resolve => setTimeout(resolve, 2000));

// //       // Update registration payment status
// //       const response = await fetch(`/api/registrations/${registrationId}/payment`, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({
// //           paymentMethod,
// //           paymentDetails: paymentMethod === 'cash' ? { method: 'cash' } : paymentDetails,
// //           amount: event?.price || 0
// //         })
// //       });

// //       const data = await response.json();

// //       if (!response.ok) {
// //         throw new Error(data.error || 'Payment failed');
// //       }

// //       // Redirect to success page
// //       router.push(`/events/${params.id}/payment/success?registrationId=${registrationId}`);
// //     } catch (error) {
// //       console.error('Payment error:', error);
// //       alert(error instanceof Error ? error.message : 'Payment failed');
// //     } finally {
// //       setProcessing(false);
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
// //           <p className="mt-4 text-gray-600">Loading payment details...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (!event) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center">
// //         <div className="text-center">
// //           <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gray-50 py-12">
// //       <div className="container mx-auto px-4 max-w-2xl">
// //         <div className="bg-white rounded-lg shadow-lg p-8">
// //           <h1 className="text-3xl font-bold text-gray-900 mb-6">Complete Payment</h1>

// //           {/* Event Summary */}
// //           <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
// //             <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
// //             <div className="space-y-2">
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Event:</span>
// //                 <span className="font-semibold">{event.name}</span>
// //               </div>
// //               <div className="flex justify-between">
// //                 <span className="text-gray-600">Date:</span>
// //                 <span className="font-semibold">{new Date(event.date).toLocaleDateString()}</span>
// //               </div>
// //               {event.venue && (
// //                 <div className="flex justify-between">
// //                   <span className="text-gray-600">Venue:</span>
// //                   <span className="font-semibold">{event.venue}</span>
// //                 </div>
// //               )}
// //               <div className="flex justify-between pt-4 border-t border-blue-300">
// //                 <span className="text-lg font-bold">Total Amount:</span>
// //                 <span className="text-2xl font-bold text-blue-600">₹{event.price}</span>
// //               </div>
// //             </div>
// //           </div>

// //           {/* Payment Method Selection */}
// //           <div className="mb-8">
// //             <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
// //             <div className="grid grid-cols-3 gap-4">
// //               <button
// //                 onClick={() => setPaymentMethod('upi')}
// //                 className={`p-4 border-2 rounded-lg transition-all ${
// //                   paymentMethod === 'upi'
// //                     ? 'border-blue-600 bg-blue-50'
// //                     : 'border-gray-200 hover:border-blue-300'
// //                 }`}
// //               >
// //                 <div className="text-center">
// //                   <div className="text-3xl mb-2">📱</div>
// //                   <div className="font-semibold">UPI</div>
// //                 </div>
// //               </button>
// //               <button
// //                 onClick={() => setPaymentMethod('card')}
// //                 className={`p-4 border-2 rounded-lg transition-all ${
// //                   paymentMethod === 'card'
// //                     ? 'border-blue-600 bg-blue-50'
// //                     : 'border-gray-200 hover:border-blue-300'
// //                 }`}
// //               >
// //                 <div className="text-center">
// //                   <div className="text-3xl mb-2">💳</div>
// //                   <div className="font-semibold">Card</div>
// //                 </div>
// //               </button>
// //               <button
// //                 onClick={() => setPaymentMethod('cash')}
// //                 className={`p-4 border-2 rounded-lg transition-all ${
// //                   paymentMethod === 'cash'
// //                     ? 'border-blue-600 bg-blue-50'
// //                     : 'border-gray-200 hover:border-blue-300'
// //                 }`}
// //               >
// //                 <div className="text-center">
// //                   <div className="text-3xl mb-2">💵</div>
// //                   <div className="font-semibold">Cash</div>
// //                 </div>
// //               </button>
// //             </div>
// //           </div>

// //           {/* Payment Form */}
// //           <div className="mb-8">
// //             {paymentMethod === 'upi' && (
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700 mb-2">
// //                   UPI ID
// //                 </label>
// //                 <input
// //                   type="text"
// //                   value={paymentDetails.upiId}
// //                   onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
// //                   placeholder="example@upi"
// //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// //                 />
// //               </div>
// //             )}

// //             {paymentMethod === 'card' && (
// //               <div className="space-y-4">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700 mb-2">
// //                     Card Number
// //                   </label>
// //                   <input
// //                     type="text"
// //                     value={paymentDetails.cardNumber}
// //                     onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
// //                     placeholder="1234 5678 9012 3456"
// //                     maxLength={19}
// //                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// //                   />
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700 mb-2">
// //                     Cardholder Name
// //                   </label>
// //                   <input
// //                     type="text"
// //                     value={paymentDetails.cardName}
// //                     onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
// //                     placeholder="John Doe"
// //                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// //                   />
// //                 </div>
// //                 <div className="grid grid-cols-2 gap-4">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-2">
// //                       Expiry Date
// //                     </label>
// //                     <input
// //                       type="text"
// //                       value={paymentDetails.cardExpiry}
// //                       onChange={(e) => setPaymentDetails({ ...paymentDetails, cardExpiry: e.target.value })}
// //                       placeholder="MM/YY"
// //                       maxLength={5}
// //                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-2">
// //                       CVV
// //                     </label>
// //                     <input
// //                       type="password"
// //                       value={paymentDetails.cardCvv}
// //                       onChange={(e) => setPaymentDetails({ ...paymentDetails, cardCvv: e.target.value })}
// //                       placeholder="123"
// //                       maxLength={3}
// //                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// //                     />
// //                   </div>
// //                 </div>
// //               </div>
// //             )}

// //             {paymentMethod === 'cash' && (
// //               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
// //                 <p className="text-yellow-800">
// //                   <strong>Pay at Venue:</strong> You can pay ₹{event.price} in cash at the event venue. 
// //                   Please bring exact change if possible.
// //                 </p>
// //               </div>
// //             )}
// //           </div>

// //           {/* Action Buttons */}
// //           <div className="flex space-x-4">
// //             <button
// //               onClick={() => router.back()}
// //               disabled={processing}
// //               className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
// //             >
// //               Cancel
// //             </button>
// //             <button
// //               onClick={handlePayment}
// //               disabled={processing}
// //               className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
// //             >
// //               {processing ? (
// //                 <span className="flex items-center justify-center">
// //                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
// //                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
// //                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
// //                   </svg>
// //                   Processing...
// //                 </span>
// //               ) : (
// //                 `Pay ₹${event.price}`
// //               )}
// //             </button>
// //           </div>

// //           {/* Security Note */}
// //           <div className="mt-6 text-center text-sm text-gray-500">
// //             <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
// //             </svg>
// //             Your payment information is secure and encrypted
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter, useSearchParams } from 'next/navigation';
// import { useAuth } from '@/app/contexts/AuthContext';

// interface Event {
//   _id: string;
//   name: string;
//   price: number;
//   date: string;
//   venue: string;
// }

// // Extend Window interface for Razorpay
// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export default function PaymentPage() {
//   const params = useParams();
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { user } = useAuth();
//   const registrationId = searchParams.get('registrationId');

//   const [event, setEvent] = useState<Event | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (!user) {
//       router.push('/login');
//       return;
//     }
//     fetchEvent();
//   }, [user]);

//   useEffect(() => {
//     // Load Razorpay script
//     loadRazorpayScript();
//   }, []);

//   const loadRazorpayScript = () => {
//     return new Promise((resolve) => {
//       if (window.Razorpay) {
//         resolve(true);
//         return;
//       }

//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.onload = () => resolve(true);
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   const fetchEvent = async () => {
//     try {
//       const response = await fetch(`/api/events/${params.id}`);
//       const data = await response.json();
      
//       if (data.success && data.event) {
//         setEvent(data.event);
//       }
//     } catch (error) {
//       console.error('Error fetching event:', error);
//       setError('Failed to load event details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePayment = async () => {
//     if (!user || !event) return;

//     setProcessing(true);
//     setError('');

//     try {
//       // Step 1: Create Razorpay order
//       console.log('Creating order...');
//       const orderResponse = await fetch('/api/payment/create', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           eventId: event._id,
//           userId: user.uid,
//           userName: user.displayName || user.email,
//           userEmail: user.email,
//         })
//       });

//       // Check content type
//       const contentType = orderResponse.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         const text = await orderResponse.text();
//         console.error('Non-JSON response:', text);
//         throw new Error(`Server error: ${orderResponse.status}. API route may not exist.`);
//       }

//       const orderData = await orderResponse.json();

//       if (!orderResponse.ok) {
//         throw new Error(orderData.error || 'Failed to create order');
//       }

//       console.log('Order created:', orderData);

//       // Step 2: Initialize Razorpay checkout
//       const options = {
//         key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//         amount: orderData.amount,
//         currency: orderData.currency,
//         name: 'Event Registration',
//         description: `Payment for ${event.name}`,
//         order_id: orderData.id,
//         handler: async function (response: any) {
//           await verifyPayment(response);
//         },
//         prefill: {
//           name: user.displayName || '',
//           email: user.email || '',
//           contact: user.phoneNumber || '',
//         },
//         theme: {
//           color: '#3B82F6',
//         },
//         modal: {
//           ondismiss: function() {
//             setProcessing(false);
//             setError('Payment cancelled by user');
//           }
//         }
//       };

//       const razorpay = new window.Razorpay(options);
      
//       razorpay.on('payment.failed', function (response: any) {
//         console.error('Payment failed:', response.error);
//         setError(response.error.description || 'Payment failed');
//         setProcessing(false);
//       });

//       razorpay.open();

//     } catch (err: any) {
//       console.error('Payment error:', err);
//       setError(err.message || 'Failed to initiate payment');
//       setProcessing(false);
//     }
//   };

//   const verifyPayment = async (paymentResponse: any) => {
//     try {
//       console.log('Verifying payment...');
      
//       const verifyResponse = await fetch('/api/payment/verify', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           razorpay_order_id: paymentResponse.razorpay_order_id,
//           razorpay_payment_id: paymentResponse.razorpay_payment_id,
//           razorpay_signature: paymentResponse.razorpay_signature,
//         }),
//       });

//       const contentType = verifyResponse.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         throw new Error('Verification endpoint returned non-JSON response');
//       }

//       const verifyData = await verifyResponse.json();

//       if (verifyData.success) {
//         console.log('Payment verified successfully');
//         // Redirect to success page
//         router.push(`/events/${params.id}/payment/success?registrationId=${verifyData.registrationId}`);
//       } else {
//         throw new Error(verifyData.error || 'Payment verification failed');
//       }
//     } catch (err: any) {
//       console.error('Verification error:', err);
//       setError('Payment verification failed. Please contact support with your payment ID.');
//       setProcessing(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading payment details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!event) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
//           <button
//             onClick={() => router.push('/events')}
//             className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Back to Events
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-12">
//       <div className="container mx-auto px-4 max-w-2xl">
//         <div className="bg-white rounded-lg shadow-lg p-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-6">Complete Payment</h1>

//           {/* Event Summary */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
//             <div className="space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Event:</span>
//                 <span className="font-semibold">{event.name}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Date:</span>
//                 <span className="font-semibold">{new Date(event.date).toLocaleDateString()}</span>
//               </div>
//               {event.venue && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Venue:</span>
//                   <span className="font-semibold">{event.venue}</span>
//                 </div>
//               )}
//               <div className="flex justify-between pt-4 border-t border-blue-300">
//                 <span className="text-lg font-bold">Total Amount:</span>
//                 <span className="text-2xl font-bold text-blue-600">₹{event.price}</span>
//               </div>
//             </div>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//               <p className="text-red-800 text-sm">{error}</p>
//             </div>
//           )}

//           {/* Payment Info */}
//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
//             <p className="text-sm text-gray-700">
//               <strong>Secure Payment:</strong> You will be redirected to Razorpay's secure payment gateway. 
//               We accept UPI, Cards, Net Banking, and Wallets.
//             </p>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex space-x-4">
//             <button
//               onClick={() => router.back()}
//               disabled={processing}
//               className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handlePayment}
//               disabled={processing || !event.price}
//               className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {processing ? (
//                 <span className="flex items-center justify-center">
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Processing...
//                 </span>
//               ) : (
//                 `Pay ₹${event.price}`
//               )}
//             </button>
//           </div>

//           {/* Security Note */}
//           <div className="mt-6 text-center text-sm text-gray-500">
//             <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//             </svg>
//             Your payment information is secure and encrypted
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface Event {
  _id: string;
  name: string;
  description: string;
  price: number;
  date: string;
  venue: string;
  availableSeats: number;
  totalSeats: number;
  coins?: number;
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  useEffect(() => {
    fetchEvent();
    if (user) {
      checkExistingRegistration();
    }
  }, [user, params.id]);

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

  const checkExistingRegistration = async () => {
    if (!user) return;
    
    setCheckingRegistration(true);
    try {
      const response = await fetch(
        `/api/registrations/check?eventId=${params.id}&userId=${user.uid}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setIsRegistered(data.isRegistered);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!event) return;

    setRegistering(true);

    try {
      // Step 1: Create Razorpay order
      console.log('Creating payment order...');
      
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          userId: user.uid,
          userName: user.displayName || user.email,
          userEmail: user.email,
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('API route not found. Please check if /api/payment/create exists.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      console.log('Order created successfully:', data.orderId);

      // Step 2: Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Event Registration',
        description: `Registration for ${event.name}`,
        order_id: data.id,
        handler: async function (response: any) {
          await verifyPayment(response);
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
          contact: '',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function() {
            setRegistering(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Registration failed. Please try again.');
      setRegistering(false);
    }
  };

  const verifyPayment = async (paymentResponse: any) => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/events/${params.id}/payment/success?registrationId=${data.registrationId}`);
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      alert('Payment verification failed. Please contact support.');
      setRegistering(false);
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Event Header */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.name}</h1>
          
          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">{new Date(event.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-semibold">{event.venue}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-semibold text-2xl text-blue-600">₹{event.price}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Available Seats</p>
                <p className="font-semibold">{event.availableSeats} / {event.totalSeats}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">About this event</h2>
            <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
          </div>

          {/* Coins Badge */}
          {event.coins && event.coins > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-semibold">
                🪙 Earn {event.coins} coins by registering for this event!
              </p>
            </div>
          )}

          {/* Registration Button */}
          <div className="flex items-center justify-between">
            {isRegistered ? (
              <div className="flex-1">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Already Registered
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering || checkingRegistration || event.availableSeats <= 0}
                className="flex-1 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {registering ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : event.availableSeats <= 0 ? (
                  'Sold Out'
                ) : (
                  `Register Now - ₹${event.price}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}