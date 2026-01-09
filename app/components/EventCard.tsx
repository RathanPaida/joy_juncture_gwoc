// 'use client';

// import { useState } from 'react';
// import { format } from 'date-fns';
// import PaymentModal from '@/app/components/PaymentModal';

// interface EventCardProps {
//   event: {
//     _id: string;
//     name: string;
//     description: string;
//     date: string;
//     price: number;
//     coins: number;
//     registrationLink: string;
//   };
//   isUpcoming: boolean;
//   user: any;
//   onRegisterSuccess?: () => void;
// }

// export default function EventCard({ event, isUpcoming, user, onRegisterSuccess }: EventCardProps) {
//   const [showPayment, setShowPayment] = useState(false);

//   const handleRegister = () => {
//     if (!user) {
//       // Redirect to login
//       alert('Please login to register');
//       return;
//     }
    
//     if (isUpcoming) {
//       setShowPayment(true);
//     }
//   };

//   return (
//     <>
//       <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
//         <div className="p-6">
//           <div className="flex justify-between items-start mb-4">
//             <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
//             <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//               isUpcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
//             }`}>
//               {isUpcoming ? 'Upcoming' : 'Past'}
//             </span>
//           </div>
          
//           <p className="text-gray-600 mb-4">{event.description}</p>
          
//           <div className="flex justify-between items-center mb-4">
//             <div>
//               <p className="text-sm text-gray-500">Date</p>
//               <p className="font-medium">{format(new Date(event.date), 'PPP')}</p>
//             </div>
//             <div>
//               <p className="text-sm text-gray-500">Price</p>
//               <p className="font-medium">₹{event.price}</p>
//             </div>
//           </div>
          
//           <div className="flex justify-between items-center mb-4">
//             <div>
//               <p className="text-sm text-gray-500">Coins Reward</p>
//               <p className="font-medium text-yellow-600">{event.coins} coins</p>
//             </div>
//           </div>
          
//           {isUpcoming ? (
//             <button
//               onClick={handleRegister}
//               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200"
//             >
//               Register Now - ₹{event.price}
//             </button>
//           ) : (
//             <div className="text-center py-3 bg-gray-100 rounded-lg">
//               <p className="text-gray-600">Event Completed</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {showPayment && (
//         <PaymentModal
//           event={event}
//           user={user}
//           onClose={() => setShowPayment(false)}
//           onSuccess={() => {
//             setShowPayment(false);
//             onRegisterSuccess?.();
//           }}
//         />
//       )}
//     </>
//   );
// }

'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  coins: number;
  registrationLink: string;
  collabWith: string;
  venue?: string;
  availableSeats?: number;
  totalSeats?: number;
}

interface EventCardProps {
  event: Event;
  isUpcoming: boolean;
  user?: any;
  onRegisterSuccess?: () => void;
}

export default function EventCard({ event, isUpcoming, user, onRegisterSuccess }: EventCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/events/${event._id}`);
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking register button
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    router.push(`/events/${event._id}`);
  };

  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Card Header with Status Badge */}
      <div className="relative">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-3xl font-bold mb-1">
              {format(eventDate, 'dd')}
            </div>
            <div className="text-sm uppercase tracking-wide">
              {format(eventDate, 'MMM yyyy')}
            </div>
          </div>
        </div>
        
        {event.collabWith && (
          <div className="absolute top-3 right-3">
            <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Collaboration
            </span>
          </div>
        )}

        {!isUpcoming && (
          <div className="absolute top-3 left-3">
            <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Past Event
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {event.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {event.venue && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.venue}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-lg text-gray-900">₹{event.price}</span>
            </div>

            {event.coins > 0 && (
              <div className="flex items-center text-sm text-yellow-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{event.coins}</span>
              </div>
            )}
          </div>

          {/* Seats Info */}
          {event.availableSeats !== undefined && event.totalSeats !== undefined && (
            <div className="pt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Available Seats</span>
                <span className="font-semibold">{event.availableSeats} / {event.totalSeats}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (event.availableSeats / event.totalSeats) * 100 > 50 ? 'bg-green-500' :
                    (event.availableSeats / event.totalSeats) * 100 > 25 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(event.availableSeats / event.totalSeats) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isUpcoming && !isPast && (
          <button
            onClick={handleRegisterClick}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            View Details & Register
          </button>
        )}

        {isPast && (
          <div className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold text-center">
            Event Ended
          </div>
        )}
      </div>
    </div>
  );
}