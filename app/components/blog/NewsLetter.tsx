'use client';

import { useState } from 'react';
import { FiMail, FiCheck } from 'react-icons/fi';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      // In production, replace with your newsletter API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
      setMessage('Successfully subscribed to newsletter!');
      setEmail('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-blue-500/10 rounded-2xl p-6 border border-orange-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
          <FiMail className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Game Guides Newsletter</h3>
      </div>
      
      <p className="text-gray-300 text-sm mb-4">
        Get weekly gameplay guides, strategy tips, and community stories delivered to your inbox.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full px-4 py-3 pl-12 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={status === 'loading'}
          />
          <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
        
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Subscribing...
            </>
          ) : status === 'success' ? (
            <>
              <FiCheck className="w-5 h-5" />
              Subscribed!
            </>
          ) : (
            'Subscribe Now'
          )}
        </button>
      </form>
      
      {message && (
        <div className={`mt-3 text-sm ${
          status === 'success' ? 'text-green-400' : 'text-red-400'
        }`}>
          {message}
        </div>
      )}
      
      <p className="mt-4 text-xs text-gray-500">
        By subscribing, you agree to our Privacy Policy and may receive Game Points rewards!
      </p>
    </div>
  );
}