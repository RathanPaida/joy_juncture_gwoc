// 'use client';

// import { useState } from 'react';
// import { loadRazorpay } from '@/lib/razorpay';

// interface PaymentModalProps {
//   event: any;
//   user: any;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function PaymentModal({ event, user, onClose, onSuccess }: PaymentModalProps) {
//   const [loading, setLoading] = useState(false);

//   const handlePayment = async () => {
//     setLoading(true);
    
//     try {
//       // Create order
//       const orderRes = await fetch('/api/payment/create', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           eventId: event._id,
//           userId: user.uid,
//         }),
//       });
      
//       const order = await orderRes.json();
      
//       // Load Razorpay script
//       await loadRazorpay();
      
//       const options = {
//         key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//         amount: order.amount,
//         currency: order.currency,
//         name: 'Joy Juncture',
//         description: `Registration for ${event.name}`,
//         order_id: order.id,
//         handler: async (response: any) => {
//           // Verify payment
//           const verifyRes = await fetch('/api/payment/verify', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               ...response,
//               notes: order.notes,
//             }),
//           });
          
//           if (verifyRes.ok) {
//             alert('Registration successful! Coins added to your wallet.');
//             onSuccess();
//           }
//         },
//         prefill: {
//           name: user.name,
//           email: user.email,
//         },
//         theme: {
//           color: '#3B82F6',
//         },
//       };
      
//       const razorpay = new (window as any).Razorpay(options);
//       razorpay.open();
      
//     } catch (error) {
//       console.error('Payment error:', error);
//       alert('Payment failed. Please try again.');
//     } finally {
//       setLoading(false);
//       onClose();
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
//         <h3 className="text-2xl font-bold mb-4">Complete Registration</h3>
        
//         <div className="mb-6">
//           <div className="flex justify-between mb-2">
//             <span className="text-gray-600">Event:</span>
//             <span className="font-medium">{event.name}</span>
//           </div>
//           <div className="flex justify-between mb-2">
//             <span className="text-gray-600">Price:</span>
//             <span className="font-medium">₹{event.price}</span>
//           </div>
//           <div className="flex justify-between mb-2">
//             <span className="text-gray-600">Coins you'll earn:</span>
//             <span className="font-medium text-yellow-600">{event.coins} coins</span>
//           </div>
//           <div className="flex justify-between mb-4">
//             <span className="text-gray-600">Your current coins:</span>
//             <span className="font-medium">{user.coins} coins</span>
//           </div>
//         </div>
        
//         <div className="flex gap-4">
//           <button
//             onClick={onClose}
//             className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handlePayment}
//             disabled={loading}
//             className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//           >
//             {loading ? 'Processing...' : 'Proceed to Payment'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  event: any;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ event, user, onClose, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Create Razorpay order
      const orderRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          userId: user.uid,
          userName: user.name || user.displayName || user.email,
          userEmail: user.email,
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      const orderData = await orderRes.json();
      
      console.log('Order created:', orderData);
      
      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Joy Juncture',
        description: `Registration for ${event.name}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData.orderId,
              }),
            });
            
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.success) {
              onClose();
              // Redirect to success page
              router.push(`/events/${event._id}/payment/success?registrationId=${verifyData.registrationId}`);
              onSuccess();
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
            onClose();
          }
        },
        prefill: {
          name: user.name || user.displayName || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onClose();
          }
        }
      };
      
      const razorpay = new (window as any).Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + response.error.description);
        setLoading(false);
        onClose();
      });
      
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Complete Registration</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Event Details */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Registration Summary</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium text-gray-900">{event.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(event.date).toLocaleDateString()}
              </span>
            </div>
            
            {event.Venue && (
              <div className="flex justify-between">
                <span className="text-gray-600">Venue:</span>
                <span className="font-medium text-gray-900">{event.Venue}</span>
              </div>
            )}
            
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registration Fee:</span>
                <span className="text-2xl font-bold text-blue-600">₹{event.price}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coins Info */}
        {event.coins > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center text-yellow-800 mb-2">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Reward Coins</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">You'll earn:</span>
              <span className="font-bold text-yellow-700">{event.coins} coins</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Your current balance:</span>
              <span className="font-semibold text-yellow-700">{user.totalPoints || user.coins || 0} coins</span>
            </div>
          </div>
        )}
        
        {/* Important Notes */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-2 text-sm">📋 Important Notes</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Payment is processed securely through Razorpay</li>
            <li>• You'll receive a confirmation email after payment</li>
            <li>• Your ticket with QR code will be available immediately</li>
            <li>• Coins will be credited after event attendance</li>
          </ul>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              `Pay ₹${event.price}`
            )}
          </button>
        </div>
        
        {/* Security Badge */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}