'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EventCard from '@/app/components/EventCard'; // Your existing component
import { useAuth } from '@/app/contexts/AuthContext';
import { Event, RegisteredEvent } from '@/hooks/useEventData';
import '@/app/(public)/events/events.css'; 

interface Props {
  title: string;
  subtitle: string;
  events: (Event | RegisteredEvent)[];
  loading: boolean;
  type: 'upcoming' | 'past' | 'registered';
  onRefresh: () => void;
}

export default function EventsListLayout({ title, subtitle, events, loading, type, onRefresh }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#1a1a1a] events-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] pt-32 pb-16 px-6 relative overflow-hidden">
        <button 
            onClick={() => router.push('/events')}
            className="absolute top-8 left-8 flex items-center gap-2 text-black font-bold uppercase tracking-wider text-sm hover:opacity-70 transition-opacity z-20"
        >
            <ArrowLeft className="w-4 h-4" /> Back to Deck
        </button>
        
        <div className="max-w-7xl mx-auto relative z-10">
            <h1 className="text-5xl md:text-7xl font-black text-[#1a1a1a] mb-4 uppercase italic tracking-tighter">
                {title}
            </h1>
            <p className="text-[#1a1a1a] font-medium text-xl max-w-2xl opacity-90">
                {subtitle}
            </p>
        </div>
        
        {/* Abstract Pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] mix-blend-overlay"></div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
           <div className="loading-container"><div className="loading-spinner"></div></div>
        ) : events.length > 0 ? (
          <div className="events-grid">
            {events.map((event) => (
              <div key={type === 'registered' ? (event as RegisteredEvent).registrationId : event._id}>
                <EventCard
                  event={event}
                  isUpcoming={type === 'upcoming' || (type === 'registered' && new Date(event.date) >= new Date())}
                  user={user}
                  onRegisterSuccess={onRefresh}
                  detailedDescription={event.detailedDescription}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>No events found</h3>
            <p>Check back later or browse other categories.</p>
          </div>
        )}
      </div>
    </div>
  );
}