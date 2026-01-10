'use client';

import { useState } from 'react';
import { loadRazorpay } from '@/lib/razorpay';

interface PaymentModalProps {
  event: any;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ event, user, onClose, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Create order
      const orderRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          userId: user.uid,
        }),
      });
      
      const order = await orderRes.json();
      
      // Load Razorpay script
      await loadRazorpay();
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Joy Juncture',
        description: `Registration for ${event.name}`,
        order_id: order.id,
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              notes: order.notes,
            }),
          });
          
          if (verifyRes.ok) {
            alert('Registration successful! Coins added to your wallet.');
            onSuccess();
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#3B82F6',
        },
      };
      
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold mb-4">Complete Registration</h3>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Event:</span>
            <span className="font-medium">{event.name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">₹{event.price}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Coins you'll earn:</span>
            <span className="font-medium text-yellow-600">{event.coins} coins</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Your current coins:</span>
            <span className="font-medium">{user.coins} coins</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}