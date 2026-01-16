// 'use client';

// import { useState, useEffect } from 'react';
// import EventCard from '@/app/components/EventCard';
// import { useAuth } from '@/app/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import '../events.css';

// export default function UpcomingEvents() {
//   const [events, setEvents] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         const res = await fetch('/api/events');
//         const data = await res.json();
//         const all = Array.isArray(data) ? data : (data.events || []);
//         const now = new Date();
//         setEvents(all.filter((e: any) => e.isActive && new Date(e.date) >= now));
//       } catch (err) { console.error(err); }
//       finally { setLoading(false); }
//     };
//     fetchEvents();
//   }, []);

//   if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

//   return (
//     <div className="events-page py-10">
//       <header className="events-header mb-10">
//         <h1>Upcoming Events</h1>
//         <button onClick={() => router.push('/events')} className="mt-4 px-6 py-2 border-2 border-black/20 rounded-full font-bold">Back to Deck</button>
//       </header>
//       <div className="events-grid">
//         {events.map(event => (
//           <EventCard key={event._id} event={event} isUpcoming={true} user={user} detailedDescription={event.detailedDescription} />
//         ))}
//       </div>
//     </div>
//   );
// }
'use client';
import { useEventData } from '@/hooks/useEventData';
import EventsListLayout from '@/app/components/EventsListLayout';

export default function UpcomingPage() {
  const { upcomingEvents, loading, refreshEvents } = useEventData();
  
  return (
    <EventsListLayout 
      title="Upcoming"
      subtitle="Register now to secure your spot and earn coins in our latest tournaments."
      events={upcomingEvents}
      loading={loading}
      type="upcoming"
      onRefresh={refreshEvents}
    />
  );
}