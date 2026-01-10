// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { format } from 'date-fns';
// import { useAuth } from '@/app/contexts/AuthContext';
// import './eventDetail.css';

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
//   venue: string;
//   address: string;
//   price: number;
//   coins: number;
//   totalSeats: number;
//   availableSeats: number;
//   registrationLink: string;
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
//     // Load Razorpay script
//     const loadRazorpayScript = () => {
//       return new Promise((resolve) => {
//         // Check if already loaded
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
//               router.push(`/events/${params.id}/payment/success?registrationId=${verifyData.registrationId}`);
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
            
//             {event.imageUrl && (
//               <div className="hero-image-container">
//                 <img src={event.imageUrl} alt={event.name} />
//               </div>
//             )}
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

//             {event.venue && (
//               <div className="venue-card">
//                 <h2>Venue</h2>
//                 <div className="venue-info">
//                   <svg className="venue-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//                   </svg>
//                   <div>
//                     <p className="venue-name">{event.venue}</p>
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
  venue: string;
  address: string;
  price: number;
  coins: number;
  totalSeats: number;
  availableSeats: number;
  registrationLink: string;
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
    // Load Razorpay script
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        // Check if already loaded
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

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

  const checkRegistration = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/registrations/check?eventId=${params.id}&userId=${user.uid}`);
      const data = await response.json();
      setIsRegistered(data.isRegistered);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      alert('Please login to register for this event');
      router.push('/login');
      return;
    }

    if (!razorpayLoaded) {
      alert('Payment system is loading. Please try again in a moment.');
      return;
    }

    if (event && event.availableSeats <= 0) {
      alert('Sorry, this event is fully booked!');
      return;
    }

    setRegistering(true);

    try {
      console.log('Creating payment order...');
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment creation failed:', errorText);
        throw new Error('Failed to create payment order');
      }

      const data = await response.json();
      console.log('Payment order created:', data);

      if (!data.key) {
        console.error('Razorpay key missing in response:', data);
        throw new Error('Payment configuration error. Please contact support.');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay not loaded. Please refresh and try again.');
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'Joy Juncture',
        description: event?.name || 'Event Registration',
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            console.log('Payment successful, verifying...');
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              console.log('Payment verified successfully');
              router.push(`/events`);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          } finally {
            setRegistering(false);
          }
        },
        prefill: {
          name: user.name || user.displayName || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#ff6b00'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            setRegistering(false);
          }
        }
      };

      console.log('Opening Razorpay checkout with options:', { ...options, key: '***' });
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + (response.error.description || 'Unknown error'));
        setRegistering(false);
      });
      
      razorpay.open();

    } catch (error) {
      console.error('Registration error:', error);
      alert(error instanceof Error ? error.message : 'Error in opening checkout');
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="loading-state">
        <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>Event not found</h2>
        <button onClick={() => router.push('/events')} className="back-button">
          Back to Events
        </button>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const seatsPercentage = (event.availableSeats / event.totalSeats) * 100;

  return (
    <div className="event-detail-page">
      <div className="event-hero">
        <div className="hero-content">
          <button onClick={() => router.push('/events')} className="back-button">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>
          
          <div className="hero-grid">
            <div className="hero-text">
              <h1 className="hero-title">{event.name}</h1>
              <p className="hero-description">{event.detailedDescription}</p>
              
              {event.collabWith && (
                <div className="collaboration-badge">
                  <span>In collaboration with {event.collabWith}</span>
                </div>
              )}
            </div>
            
            {event.imageUrl && (
              <div className="hero-image-container">
                <img src={event.imageUrl} alt={event.name} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content-container">
        <div className="content-grid">
          <div className="main-content">
            <div className="details-card">
              <h2>Event Details</h2>
              <div className="event-description">
                {event.detailedDescription || event.description}
              </div>
            </div>

            {event.venue && (
              <div className="venue-card">
                <h2>Venue</h2>
                <div className="venue-info">
                  <svg className="venue-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="venue-name">{event.venue}</p>
                    {event.address && <p className="venue-address">{event.address}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="registration-sidebar">
            <div className="registration-card">
              <div className="info-item">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="info-label">Date</p>
                  <p className="info-value">{format(eventDate, 'PPP')}</p>
                </div>
              </div>

              {event.time && (
                <div className="info-item">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="info-label">Time</p>
                    <p className="info-value">{event.time}</p>
                  </div>
                </div>
              )}

              <div className="info-item">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="info-label">Entry Fee</p>
                  <p className="price-display">₹{event.price}</p>
                </div>
              </div>

              {event.coins > 0 && (
                <div className="coins-banner">
                  <div className="coins-text">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    <span>Earn {event.coins} coins upon registration!</span>
                  </div>
                </div>
              )}

              <div className="seats-container">
                <div className="seats-header">
                  <span className="seats-label">Available Seats</span>
                  <span className="seats-count">{event.availableSeats} / {event.totalSeats}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ 
                      width: `${seatsPercentage}%`,
                      '--progress-width': `${seatsPercentage}%`
                    } as React.CSSProperties}
                  />
                </div>
                {event.availableSeats <= 10 && event.availableSeats > 0 && (
                  <p className="seats-warning">⚠️ Only {event.availableSeats} seats left!</p>
                )}
              </div>

              <div style={{ paddingTop: '1.5rem' }}>
                {isRegistered ? (
                  <button
                    onClick={() => router.push(`/events/${params.id}/ticket`)}
                    className="register-button btn-success"
                  >
                    View Your Ticket
                  </button>
                ) : isPast ? (
                  <div className="register-button btn-disabled">
                    <span>Event has ended</span>
                  </div>
                ) : event.availableSeats <= 0 ? (
                  <div className="register-button btn-sold-out">
                    <span>Sold Out</span>
                  </div>
                ) : !razorpayLoaded ? (
                  <div className="register-button btn-disabled">
                    <span>Loading payment system...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="register-button btn-primary"
                  >
                    {registering ? 'Processing...' : 'Register Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}