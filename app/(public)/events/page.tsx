

// 'use client';

// import { useState, useEffect } from 'react';
// import EventCard from '@/app/components/EventCard';
// import { useAuth } from '@/app/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import './events.css';

// interface Event {
//   detailedDescription: string;
//   _id: string;
//   name: string;
//   description: string;
//   date: string;
//   price: number;
//   coins: number;
//   Venue: string;
//   collabWith: string;
//   isActive: boolean;
//   availableSeats?: number;
//   totalSeats?: number;
// }

// interface RegisteredEvent extends Event {
//   registrationId: string;
//   registrationDate: string;
//   paymentStatus: string;
//   attendanceMarked: boolean;
// }

// export default function EventsPage() {
//   const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
//   const [pastEvents, setPastEvents] = useState<Event[]>([]);
//   const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [loadingRegistered, setLoadingRegistered] = useState(true);
//   const { user } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   useEffect(() => {
//     if (user) {
//       fetchRegisteredEvents();
//     } else {
//       setLoadingRegistered(false);
//       setRegisteredEvents([]);
//     }
//   }, [user]);

//   const fetchEvents = async () => {
//     try {
//       setLoading(true);
      
//       const response = await fetch('/api/events');
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch events');
//       }
      
//       const data = await response.json();
//       const allEvents = Array.isArray(data) ? data : (data.events || []);
//       const activeEvents = allEvents.filter((event: Event) => event.isActive);
      
//       const now = new Date();
//       const upcoming: Event[] = [];
//       const past: Event[] = [];
      
//       activeEvents.forEach((event: Event) => {
//         const eventDate = new Date(event.date);
//         if (eventDate >= now) {
//           upcoming.push(event);
//         } else {
//           past.push(event);
//         }
//       });
      
//       upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
//       past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
//       setUpcomingEvents(upcoming);
//       setPastEvents(past);
//     } catch (error) {
//       console.error('Error fetching events:', error);
//       setUpcomingEvents([]);
//       setPastEvents([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchRegisteredEvents = async () => {
//     if (!user) return;
    
//     try {
//       setLoadingRegistered(true);
//       console.log('🔍 Fetching registrations for user:', user.uid);
      
//       const response = await fetch(`/api/registrations/user/${user.uid}`);
      
//       console.log('📡 Response status:', response.status);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('❌ Failed to fetch registered events');
//         console.error('Status:', response.status);
//         console.error('Response:', errorText);
        
//         // Try to parse error details
//         try {
//           const errorData = JSON.parse(errorText);
//           console.error('Error details:', errorData);
//         } catch (e) {
//           console.error('Could not parse error response');
//         }
        
//         setRegisteredEvents([]);
//         setLoadingRegistered(false);
//         return;
//       }
      
//       const data = await response.json();
//       console.log('📦 Registrations data:', data);
      
//       if (data.success) {
//         setRegisteredEvents(data.registrations || []);
//         console.log(`✅ Loaded ${data.registrations?.length || 0} registrations`);
//       } else {
//         console.error('API returned success: false', data);
//         setRegisteredEvents([]);
//       }
//     } catch (error) {
//       console.error('❌ Error fetching registered events:', error);
//       setRegisteredEvents([]);
//     } finally {
//       setLoadingRegistered(false);
//     }
//   };

//   const handleRegisterSuccess = () => {
//     fetchEvents();
//     if (user) {
//       fetchRegisteredEvents();
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p className="loading-text">Loading events...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="events-page">
//       <header className="events-header">
//         <h1>Joy Juncture Events</h1>
//         <p>Join our exciting board game tournaments and events. Register to earn coins!</p>
//       </header>

//       {user && (
//         <div className="user-info-bar">
//           <div className="user-welcome">
//             <h3>Welcome back, {user.name || user.displayName || 'Guest'}!</h3>
//             <p>Ready for your next gaming adventure?</p>
//           </div>
//           <div className="coins-display">
//             <span>Your coins: </span>
//             <span className="coins-amount">{user.totalPoints || user.coins || 0} 🪙</span>
            
//           </div>
//         </div>
//       )}

//       {/* Registered Events Section */}
//       <section className="registered-events-section">
//         {!user ? (
//           <div className="login-prompt-card">
//             <div className="login-prompt-content">
//               <svg className="login-prompt-icon" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//               </svg>
//               <h3>Want to see your registered events?</h3>
//               <p>Please login to view and manage your event registrations</p>
//               <button 
//                 onClick={() => router.push('/login')} 
//                 className="login-prompt-button"
//               >
//                 Sign In to Continue
//               </button>
//             </div>
//           </div>
//         ) : loadingRegistered ? (
//           <div className="registered-loading">
//             <div className="loading-spinner-small"></div>
//             <p>Loading your registrations...</p>
//           </div>
//         ) : registeredEvents.length > 0 ? (
//           <>
//             <div className="section-header">
//               <div className="section-title">
//                 <h2>Your Registered Events</h2>
//                 <p>Events you've signed up for</p>
//               </div>
//               <div className="event-count-badge registered-badge">
//                 {registeredEvents.length} {registeredEvents.length === 1 ? 'event' : 'events'}
//               </div>
//             </div>
//             <div className="events-grid">
//               {registeredEvents.map((event) => (
//                 <div key={event.registrationId} className="registered-event-wrapper">
//                   <div className="registered-badge-overlay">
//                     <span className="registered-label">✓ Registered</span>
//                     {event.attendanceMarked && (
//                       <span className="attended-label">Attended</span>
//                     )}
//                   </div>
//                   <EventCard
//                     event={event}
//                     isUpcoming={new Date(event.date) >= new Date()}
//                     user={user}
//                     onRegisterSuccess={handleRegisterSuccess}
//                     detailedDescription={event.detailedDescription}
//                   />
//                 </div>
//               ))}
//             </div>
//           </>
//         ) : (
//           <div className="no-registrations-card">
//             <div className="no-registrations-content">
//               <div className="no-registrations-icon">🎟️</div>
//               <h3>No Registered Events Yet</h3>
//               <p>You haven't registered for any events. Browse our upcoming events below!</p>
//             </div>
//           </div>
//         )}
//       </section>

//       <section>
//         <div className="section-header">
//           <div className="section-title">
//             <h2>Upcoming Events</h2>
//             <p>Register now to secure your spot and earn coins!</p>
//           </div>
//           <div className="event-count-badge">
//             {upcomingEvents.length} events
//           </div>
//         </div>

//         {upcomingEvents.length > 0 ? (
//           <div className="events-grid">
//             {upcomingEvents.map((event) => (
//               <EventCard
//                 key={event._id}
//                 event={event}
//                 isUpcoming={true}
//                 user={user}
//                 onRegisterSuccess={handleRegisterSuccess}
//                 detailedDescription={event.detailedDescription}
//               />
//             ))}
//           </div>
//         ) : (
//           <div className="empty-state">
//             <div className="empty-state-icon">🎯</div>
//             <h3>No upcoming events scheduled</h3>
//             <p>Check back soon for new events!</p>
//           </div>
//         )}
//       </section>

//       <section style={{ marginTop: '4rem' }}>
//         <div className="section-header">
//           <div className="section-title">
//             <h2>Past Events</h2>
//             <p>Relive the memories from our previous tournaments</p>
//           </div>
//           <div className="event-count-badge">
//             {pastEvents.length} events
//           </div>
//         </div>

//         {pastEvents.length > 0 ? (
//           <div className="events-grid">
//             {pastEvents.map((event) => (
//               <EventCard
//                 key={event._id}
//                 event={event}
//                 isUpcoming={false}
//                 user={user}
//                 detailedDescription={event.detailedDescription}
//               />
//             ))}
//           </div>
//         ) : (
//           <div className="empty-state">
//             <div className="empty-state-icon">📜</div>
//             <h3>No past events yet</h3>
//             <p>Our event history will appear here</p>
//           </div>
//         )}
//       </section>
//     </div>
//   );
// }

'use client';

import EventsDeck from '@/app/components/EventsDeck';
import { useEventData } from '@/hooks/useEventData';
import HeroScroll from '@/components/HeroScroll';
import './events.css'; // Keep your original CSS for variables

export default function EventsLandingPage() {
  const { upcomingEvents, pastEvents, registeredEvents, loading } = useEventData();

  if (loading) {
     return (
       <div className="h-screen bg-black flex items-center justify-center">
         <div className="loading-spinner"></div>
       </div>
     );
  }

  return (
    <main>
      <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center pointer-events-none mix-blend-difference">
         <h1 className="text-white font-black text-2xl tracking-tighter uppercase">Joy Juncture</h1>
      </header>
      
      <HeroScroll />
      <EventsDeck 
        registeredCount={registeredEvents.length}
        upcomingCount={upcomingEvents.length}
        pastCount={pastEvents.length}
      />
    </main>
  );
}