// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { format } from 'date-fns';
// import { useAuth } from '@/app/contexts/AuthContext';
// import './eventList.css';

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// interface Event {
//   _id: string;
//   name: string;
//   description: string;
//   detailedDescription: string;
//   date: string;
//   time: string;
//   address: string;
//   price: number;
//   coins: number;
//   totalSeats: number;
//   availableSeats: number;
//   Venue: string;
//   collabWith: string;
//   imageUrl: string;
//   isActive: boolean;
// }

// export default function EventDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useAuth();
//   const [event, setEvent] = useState<Event | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [registering, setRegistering] = useState(false);
//   const [isRegistered, setIsRegistered] = useState(false);
//   const [razorpayLoaded, setRazorpayLoaded] = useState(false);

//   useEffect(() => {
//     if (params.id) {
//       fetchEvent();
//       checkRegistration();
//     }
//   }, [params.id, user]);

//   useEffect(() => {
//     const loadRazorpayScript = () => {
//       return new Promise((resolve) => {
//         if (window.Razorpay) {
//           setRazorpayLoaded(true);
//           resolve(true);
//           return;
//         }

//         const script = document.createElement('script');
//         script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//         script.async = true;
//         script.onload = () => {
//           setRazorpayLoaded(true);
//           resolve(true);
//         };
//         script.onerror = () => {
//           console.error('Failed to load Razorpay script');
//           resolve(false);
//         };
//         document.body.appendChild(script);
//       });
//     };

//     loadRazorpayScript();
//   }, []);

//   const fetchEvent = async () => {
//     try {
//       const response = await fetch(`/api/events/${params.id}`);
//       const data = await response.json();
      
//       if (data.success && data.event) {
//         setEvent(data.event);
//       }
//     } catch (error) {
//       console.error('Error fetching event:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkRegistration = async () => {
//     if (!user) return;
    
//     try {
//       const response = await fetch(`/api/registrations/check?eventId=${params.id}&userId=${user.uid}`);
//       const data = await response.json();
//       setIsRegistered(data.isRegistered);
//     } catch (error) {
//       console.error('Error checking registration:', error);
//     }
//   };

//   const handleRegister = async () => {
//     if (!user) {
//       alert('Please login to register for this event');
//       router.push('/login');
//       return;
//     }

//     if (!razorpayLoaded) {
//       alert('Payment system is loading. Please try again in a moment.');
//       return;
//     }

//     if (event && event.availableSeats <= 0) {
//       alert('Sorry, this event is fully booked!');
//       return;
//     }

//     setRegistering(true);

//     try {
//       console.log('Creating payment order...');
//       const response = await fetch('/api/payment/create', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           eventId: params.id,
//           userId: user.uid,
//           userName: user.name || user.displayName || user.email,
//           userEmail: user.email
//         })
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Payment creation failed:', errorText);
//         throw new Error('Failed to create payment order');
//       }

//       const data = await response.json();
//       console.log('Payment order created:', data);

//       if (!data.key) {
//         console.error('Razorpay key missing in response:', data);
//         throw new Error('Payment configuration error. Please contact support.');
//       }

//       if (!window.Razorpay) {
//         throw new Error('Razorpay not loaded. Please refresh and try again.');
//       }

//       const options = {
//         key: data.key,
//         amount: data.amount,
//         currency: data.currency,
//         name: 'Joy Juncture',
//         description: event?.name || 'Event Registration',
//         order_id: data.orderId,
//         handler: async function (response: any) {
//           try {
//             console.log('Payment successful, verifying...');
//             const verifyResponse = await fetch('/api/payment/verify', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature
//               })
//             });

//             const verifyData = await verifyResponse.json();

//             if (verifyResponse.ok && verifyData.success) {
//               console.log('Payment verified successfully');
//               router.push(`/events`);
//             } else {
//               throw new Error(verifyData.error || 'Payment verification failed');
//             }
//           } catch (error) {
//             console.error('Verification error:', error);
//             alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
//           } finally {
//             setRegistering(false);
//           }
//         },
//         prefill: {
//           name: user.name || user.displayName || '',
//           email: user.email || '',
//           contact: user.phone || ''
//         },
//         theme: {
//           color: '#ff6b00'
//         },
//         modal: {
//           ondismiss: function() {
//             console.log('Payment cancelled by user');
//             setRegistering(false);
//           }
//         }
//       };

//       console.log('Opening Razorpay checkout with options:', { ...options, key: '***' });
//       const razorpay = new window.Razorpay(options);
      
//       razorpay.on('payment.failed', function (response: any) {
//         console.error('Payment failed:', response.error);
//         alert('Payment failed: ' + (response.error.description || 'Unknown error'));
//         setRegistering(false);
//       });
      
//       razorpay.open();

//     } catch (error) {
//       console.error('Registration error:', error);
//       alert(error instanceof Error ? error.message : 'Error in opening checkout');
//       setRegistering(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading-state">
//         <div className="loading-spinner"></div>
//         <p className="loading-text">Loading event details...</p>
//       </div>
//     );
//   }

//   if (!event) {
//     return (
//       <div className="loading-state">
//         <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>Event not found</h2>
//         <button onClick={() => router.push('/events')} className="back-button">
//           Back to Events
//         </button>
//       </div>
//     );
//   }

//   const eventDate = new Date(event.date);
//   const isPast = eventDate < new Date();
//   const seatsPercentage = (event.availableSeats / event.totalSeats) * 100;

//   return (
//     <div className="event-detail-page">
//       <div className="event-hero">
//         <div className="hero-content">
//           <button onClick={() => router.push('/events')} className="back-button">
//             <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//             </svg>
//             Back to Events
//           </button>
          
//           {/* Event Image with Date Overlay */}
//           {event.imageUrl && (
//             <div className="hero-image-full">
//               <img src={event.imageUrl} alt={event.name} />
//               <div className="hero-image-overlay">
//                 <div className="hero-date-badge">
//                   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                   <span>{format(eventDate, 'PPP')}</span>
//                 </div>
//               </div>
//             </div>
//           )}
          
//           <div className="hero-grid">
//             <div className="hero-text">
//               <h1 className="hero-title">{event.name}</h1>
//               <p className="hero-description">{event.detailedDescription}</p>
              
//               {event.collabWith && (
//                 <div className="collaboration-badge">
//                   <span>In collaboration with {event.collabWith}</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="content-container">
//         <div className="content-grid">
//           <div className="main-content">
//             <div className="details-card">
//               <h2>Event Details</h2>
//               <div className="event-description">
//                 {event.detailedDescription || event.description}
//               </div>
//             </div>

//             {event.Venue && (
//               <div className="venue-card">
//                 <h2>Venue</h2>
//                 <div className="venue-info">
//                   <svg className="venue-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//                   </svg>
//                   <div>
//                     <p className="venue-name">{event.Venue}</p>
//                     {event.address && <p className="venue-address">{event.address}</p>}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="registration-sidebar">
//             <div className="registration-card">
//               <div className="info-item">
//                 <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//                 <div>
//                   <p className="info-label">Date</p>
//                   <p className="info-value">{format(eventDate, 'PPP')}</p>
//                 </div>
//               </div>

//               {event.time && (
//                 <div className="info-item">
//                   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <div>
//                     <p className="info-label">Time</p>
//                     <p className="info-value">{event.time}</p>
//                   </div>
//                 </div>
//               )}

//               <div className="info-item">
//                 <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <div>
//                   <p className="info-label">Entry Fee</p>
//                   <p className="price-display">₹{event.price}</p>
//                 </div>
//               </div>

//               {event.coins > 0 && (
//                 <div className="coins-banner">
//                   <div className="coins-text">
//                     <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
//                     </svg>
//                     <span>Earn {event.coins} coins upon registration!</span>
//                   </div>
//                 </div>
//               )}

//               <div className="seats-container">
//                 <div className="seats-header">
//                   <span className="seats-label">Available Seats</span>
//                   <span className="seats-count">{event.availableSeats} / {event.totalSeats}</span>
//                 </div>
//                 <div className="progress-bar">
//                   <div
//                     className="progress-fill"
//                     style={{ 
//                       width: `${seatsPercentage}%`,
//                       '--progress-width': `${seatsPercentage}%`
//                     } as React.CSSProperties}
//                   />
//                 </div>
//                 {event.availableSeats <= 10 && event.availableSeats > 0 && (
//                   <p className="seats-warning">⚠️ Only {event.availableSeats} seats left!</p>
//                 )}
//               </div>

//               <div style={{ paddingTop: '1.5rem' }}>
//                 {isRegistered ? (
//                   <button
//                     onClick={() => router.push(`/events/${params.id}/ticket`)}
//                     className="register-button btn-success"
//                   >
//                     View Your Ticket
//                   </button>
//                 ) : isPast ? (
//                   <div className="register-button btn-disabled">
//                     <span>Event has ended</span>
//                   </div>
//                 ) : event.availableSeats <= 0 ? (
//                   <div className="register-button btn-sold-out">
//                     <span>Sold Out</span>
//                   </div>
//                 ) : !razorpayLoaded ? (
//                   <div className="register-button btn-disabled">
//                     <span>Loading payment system...</span>
//                   </div>
//                 ) : (
//                   <button
//                     onClick={handleRegister}
//                     disabled={registering}
//                     className="register-button btn-primary"
//                   >
//                     {registering ? 'Processing...' : 'Register Now'}
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './eventList.css';

// Add venue-info-admin styles inline since we're updating the component
const venueInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '8px',
  fontSize: '0.875rem',
  color: '#6b7280'
};

interface Event {
  _id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  date: string;
  price: number;
  coins: number;
  registrationLink?: string;
  Venue?: string;
  venue?: string;
  address?: string;
  time?: string;
  collabWith?: string;
  isActive: boolean;
  imageUrl?: string;
  totalSeats?: number;
  availableSeats?: number;
}

interface EventListProps {
  events: Event[];
  onUpdate: () => void;
}

export default function EventList({ events, onUpdate }: EventListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Ensure events is always an array and log for debugging
  const eventList = Array.isArray(events) ? events : [];
  
  useEffect(() => {
    console.log('📋 EventList - Received events prop:', events);
    console.log('📋 EventList - Processed eventList:', eventList);
    console.log('📋 EventList - eventList length:', eventList.length);
  }, [events, eventList]);

  const handleDelete = async (id: string) => {
    console.log('🗑️ Attempting to delete event with ID:', id);
    
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
  
    setDeletingId(id);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
  
      console.log('Delete response status:', response.status);
      const responseData = await response.json();
      console.log('Delete response data:', responseData);
  
      if (response.ok) {
        onUpdate();
        alert('Event deleted successfully');
      } else {
        throw new Error(responseData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        onUpdate();
        alert(`Event ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      alert(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Check if events is null or undefined
  if (!events) {
    console.error('❌ EventList - events prop is null/undefined');
    return (
      <div className="empty-events-list">
        <p style={{ color: 'red' }}>Error: No events data received</p>
      </div>
    );
  }

  // Check if eventList is empty
  if (eventList.length === 0) {
    console.log('ℹ️ EventList - No events to display');
    return (
      <div className="empty-events-list">
        <p>No events found. Create your first event!</p>
      </div>
    );
  }

  console.log('✅ EventList - Rendering table with', eventList.length, 'events');

  return (
    <div className="event-list-wrapper">
      <div className="table-container">
        <table className="event-table">
          <thead>
            <tr>
              <th>Event Details</th>
              <th>Date & Price</th>
              <th>Coins & Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventList.map((event, index) => {
              console.log(`Rendering event ${index}:`, event.name);
              
              let eventDate;
              try {
                eventDate = new Date(event.date);
                if (isNaN(eventDate.getTime())) {
                  console.error(`Invalid date for event ${event.name}:`, event.date);
                  eventDate = new Date();
                }
              } catch (error) {
                console.error(`Error parsing date for event ${event.name}:`, error);
                eventDate = new Date();
              }
              
              const isPast = eventDate < new Date();
              
              return (
                <tr key={event._id || `event-${index}`}>
                  <td>
                    <div className="event-details-cell">
                      <div className="event-name-row">
                        <h4>{event.name || 'Untitled Event'}</h4>
                        {event.collabWith && (
                          <span className="collab-badge">Collab</span>
                        )}
                      </div>
                      <p className="event-description">{event.description || 'No description'}</p>
                      {(event.Venue || event.venue) && (
                        <div className="venue-info-admin" style={venueInfoStyle}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{event.Venue || event.venue}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="date-price-cell">
                      <div className="event-date">
                        {format(eventDate, 'PPP')}
                      </div>
                      <div className={`event-timing ${isPast ? 'past' : 'upcoming'}`}>
                        {isPast ? 'Past Event' : 'Upcoming'}
                      </div>
                      <div className="event-price">
                        ₹{event.price || 0}
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="coins-status-cell">
                      <div className="event-coins">
                        {event.coins || 0} coins
                      </div>
                      <div>
                        <span className={`status-badge ${event.isActive ? 'active' : 'inactive'}`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleToggleStatus(event._id, event.isActive)}
                        className={`btn-toggle ${event.isActive ? 'deactivate' : 'activate'}`}
                      >
                        {event.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingId === event._id}
                        className="btn-delete"
                      >
                        {deletingId === event._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}