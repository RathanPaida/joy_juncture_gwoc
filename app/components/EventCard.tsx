'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Event {
  _id: string;
  name: string;
  description: string;
  detailedDescription: string;
  date: string;
  price: number;
  coins: number;
  collabWith: string;
  Venue?: string;
  availableSeats?: number;
  totalSeats?: number;
  imageUrl?: string;
}

interface EventCardProps {
  event: Event;
  isUpcoming: boolean;
  user?: any;
  detailedDescription: string;
  onRegisterSuccess?: () => void;
}

export default function EventCard({ event, isUpcoming, user, onRegisterSuccess, detailedDescription }: EventCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/events/${event._id}`);
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    router.push(`/events/${event._id}`);
  };

  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const seatsPercentage = event.availableSeats && event.totalSeats 
    ? (event.availableSeats / event.totalSeats) * 100 
    : 0;

  return (
    <div onClick={handleCardClick} className="event-card">
      {/* Event Image */}
      {event.imageUrl && (
        <div className="event-card-image">
          <img src={event.imageUrl} alt={event.name} />
          <div className="event-card-overlay">
            {event.collabWith && (
              <div className="event-badge badge-collab">
                Collaboration
              </div>
            )}
            {!isUpcoming && (
              <div className="event-badge badge-past">
                Past Event
              </div>
            )}
          </div>
        </div>
      )}

      <div className="event-card-body">
        {/* Date displayed prominently after image */}
        <div className="event-date-display">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{format(eventDate, 'PPP')}</span>
        </div>

        <h3 className="event-title">{event.name}</h3>
        
        <p className="event-description">{event.description}</p>

        {event.Venue && (
          <div className="event-info">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.Venue}</span>
          </div>
        )}

        <div className="event-pricing">
          <div className="event-info">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="event-price">₹{event.price}</span>
          </div>

          {event.coins > 0 && (
            <div className="event-coins">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span>{event.coins}</span>
            </div>
          )}
        </div>

        {event.availableSeats !== undefined && event.totalSeats !== undefined && (
          <div className="seats-progress">
            <div className="seats-info">
              <span className="seats-label">Available Seats</span>
              <span className="seats-count">{event.availableSeats} / {event.totalSeats}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${seatsPercentage}%` }}
              />
            </div>
          </div>
        )}

        {isUpcoming && !isPast && (
          <button
            onClick={handleRegisterClick}
            className="event-action-button btn-register"
          >
            View Details & Register
          </button>
        )}

        {isPast && (
          <div className="event-action-button btn-ended">
            Event Ended
          </div>
        )}
      </div>
    </div>
  );
}