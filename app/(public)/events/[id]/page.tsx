
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/app/contexts/AuthContext';
import './eventDetail.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Event {
  _id: string;
  name: string;
  description: string;
  detailedDescription: string;
  date: string;
  time: string;
  address: string;
  price: number;
  coins: number;
  totalSeats: number;
  availableSeats: number;
  Venue: string;
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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEvent();
      checkRegistration();
    }
  }, [params.id, user]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`);
      const data = await response.json();
      if (data.success && data.event) setEvent(data.event);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const checkRegistration = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/registrations/check?eventId=${params.id}&userId=${user.uid}`);
      const data = await response.json();
      setIsRegistered(data.isRegistered);
    } catch (error) { console.error(error); }
  };

  const handleRegister = async () => {
    if (!user) { router.push('/login'); return; }
    if (!razorpayLoaded) return;
    setRegistering(true);
    try {
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
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'Joy Juncture',
        order_id: data.orderId,
        handler: async function (res: any) {
          await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...res,type:'event'})
          });
          router.push('/events/registered');
        },
        prefill: { email: user.email },
        theme: { color: '#ff6b00' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) { console.error(error); }
    finally { setRegistering(false); }
  };

  if (loading) return <div className="loading-state"><div className="loading-spinner"></div></div>;
  if (!event) return <div className="loading-state"><h2>Event not found</h2></div>;

  const eventDate = new Date(event.date);

  return (
    <div className="event-detail-page bg-black text-white min-h-screen">
      <div className="event-hero py-20 px-10 border-b border-[#ff6b00]/30">
        <button onClick={() => router.back()} className="text-[#ff6b00] font-bold mb-8 flex items-center gap-2 uppercase tracking-widest text-xs italic">
          ← Back
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h1 className="text-6xl font-black italic uppercase text-[#ff6b00] mb-4">{event.name}</h1>
            <p className="text-xl text-white/70 max-w-xl">{event.description}</p>
            {event.collabWith && <div className="mt-6 inline-block px-4 py-2 border border-[#ff6b00] text-[#ff6b00] text-xs font-bold uppercase tracking-widest italic">In Collab with {event.collabWith}</div>}
          </div>
          {event.imageUrl && <div className="border-4 border-[#ff6b00] overflow-hidden rounded-2xl shadow-[0_0_50px_rgba(255,107,0,0.2)]"><img src={event.imageUrl} className="w-full h-full object-cover" /></div>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 py-20 grid grid-cols-1 lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-black text-[#ff6b00] uppercase italic mb-6">Description</h2>
            <div className="text-white/60 leading-relaxed text-lg">{event.detailedDescription}</div>
          </section>
          <section>
            <h2 className="text-2xl font-black text-[#ff6b00] uppercase italic mb-6">Location</h2>
            <div className="p-8 border border-white/10 rounded-2xl bg-white/5 flex items-center gap-6">
              <div className="w-12 h-12 bg-[#ff6b00] rounded-lg flex items-center justify-center text-black">📍</div>
              <div><p className="text-xl font-bold">{event.Venue}</p><p className="text-white/40">{event.address}</p></div>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <div className="p-8 border-2 border-[#ff6b00] rounded-2xl bg-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="space-y-6">
              <div className="flex justify-between items-center"><span className="text-white/40 uppercase text-[10px] font-black tracking-widest">Entry Fee</span><span className="text-3xl font-black text-[#ff6b00]">₹{event.price}</span></div>
              <div className="flex justify-between items-center"><span className="text-white/40 uppercase text-[10px] font-black tracking-widest">Date</span><span className="font-bold">{format(eventDate, 'PPP')}</span></div>
              <div className="flex justify-between items-center"><span className="text-white/40 uppercase text-[10px] font-black tracking-widest">Time</span><span className="font-bold">{event.time}</span></div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold uppercase italic text-[#ff6b00]">Availability</span><span className="text-xs font-bold">{event.availableSeats} / {event.totalSeats} Seats</span></div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#ff6b00]" style={{ width: `${(event.availableSeats / event.totalSeats) * 100}%` }} /></div>
            </div>

            <button 
              onClick={handleRegister} 
              disabled={registering || isRegistered || event.availableSeats <= 0}
              className="mt-8 w-full py-5 bg-[#ff6b00] text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegistered ? 'ALREADY REGISTERED' : event.availableSeats <= 0 ? 'FULLY BOOKED' : registering ? 'PROCESSING...' : 'REGISTER NOW'}
            </button>
            {event.coins > 0 && <p className="mt-4 text-center text-[10px] font-bold text-[#ff6b00] uppercase tracking-widest animate-pulse">Earn {event.coins} Coins on Registration</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}