
// 'use client';

// import { useState, useEffect } from 'react';
// import EventCard from '@/app/components/EventCard';
// import { useAuth } from '@/app/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import '../events.css';

// export default function RegisteredEvents() {
//   const [events, setEvents] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!user) {
//       setLoading(false);
//       return;
//     }
//     const fetchRegistered = async () => {
//       try {
//         const res = await fetch(`/api/registrations/user/${user.uid}`);
//         const data = await res.json();
//         if (data.success) setEvents(data.registrations || []);
//       } catch (err) { console.error(err); }
//       finally { setLoading(false); }
//     };
//     fetchRegistered();
//   }, [user]);

//   if (!user) return <div className="events-page h-screen flex flex-col items-center justify-center"><h1 className="text-[#ff6b00]">Please login to view registrations</h1><button onClick={() => router.push('/login')} className="mt-4 px-8 py-3 bg-[#ff6b00] text-black font-bold uppercase rounded-lg">Login</button></div>;
//   if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

//   return (
//     <div className="events-page py-10">
//       <header className="events-header mb-10">
//         <h1>Your Registered Events</h1>
//         <button onClick={() => router.push('/events')} className="mt-4 px-6 py-2 border-2 border-black/20 rounded-full font-bold">Back to Deck</button>
//       </header>
//       <div className="events-grid">
//         {events.map(event => (
//           <div key={event.registrationId} className="relative">
//             <div className="absolute top-2 right-2 bg-[#ff6b00] text-black text-[10px] font-bold px-2 py-1 rounded z-10">REGISTERED</div>
//             <EventCard event={event} isUpcoming={new Date(event.date) >= new Date()} user={user} detailedDescription={event.detailedDescription} />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
'use client';
import { useEventData } from '@/hooks/useEventData';
import EventsListLayout from '@/app/components/EventsListLayout';
import { useRouter } from 'next/navigation';

export default function RegisteredPage() {
  const { registeredEvents, loadingRegistered, refreshEvents, user } = useEventData();
  const router = useRouter();

  if (!user && !loadingRegistered) {
      // Redirect or show login prompt specific to this page
      return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
            <div className="login-prompt-card max-w-md w-full">
                <h3>Access Denied</h3>
                <p>Please login to view your registrations</p>
                <button onClick={() => router.push('/login')} className="login-prompt-button w-full">
                    Sign In
                </button>
            </div>
        </div>
      );
  }

  return (
    <EventsListLayout 
      title="My Events"
      subtitle="Track your registrations, view tickets, and manage your schedule."
      events={registeredEvents}
      loading={loadingRegistered}
      type="registered"
      onRefresh={refreshEvents}
    />
  );
}