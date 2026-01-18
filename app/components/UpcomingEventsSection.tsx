'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EventCard from '@/app/components/EventCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Calendar, ArrowRight, Zap, AlertCircle } from 'lucide-react';

// API Response Type (what we get from the server)
interface EventFromAPI {
  _id: string;
  name: string;
  description: string;
  detailedDescription?: string; // Optional in API response
  date: string;
  time?: string;
  price: number;
  coins: number;
  registrationLink?: string;
  Venue?: string;
  venue?: string;
  address?: string;
  collabWith?: string;
  isActive: boolean;
  imageUrl?: string;
  totalSeats?: number;
  availableSeats?: number;
}

// Event Type (what EventCard expects - all fields required or have defaults)
interface Event {
  _id: string;
  name: string;
  description: string;
  detailedDescription: string; // Required
  date: string;
  time: string; // Required
  price: number;
  coins: number;
  registrationLink: string; // Required
  Venue: string; // Required
  venue: string; // Required
  address: string; // Required
  collabWith: string; // Required
  isActive: boolean;
  imageUrl: string; // Required
  totalSeats?: number;
  availableSeats?: number;
}

interface EventAPIResponse {
  events?: EventFromAPI[];
  success?: boolean;
  error?: string;
}

// Transform API event to component event
function transformEvent(apiEvent: EventFromAPI): Event {
  return {
    ...apiEvent,
    detailedDescription: apiEvent.detailedDescription || apiEvent.description || 'Join us for an exciting event!',
    time: apiEvent.time || '',
    registrationLink: apiEvent.registrationLink || '',
    Venue: apiEvent.Venue || apiEvent.venue || '',
    venue: apiEvent.venue || apiEvent.Venue || '',
    address: apiEvent.address || '',
    collabWith: apiEvent.collabWith || '',
    imageUrl: apiEvent.imageUrl || '',
  };
}


interface UpcomingEventsSectionProps {
  initialEvents?: EventFromAPI[];
}

export default function UpcomingEventsSection({ initialEvents }: UpcomingEventsSectionProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>(() => {
    if (initialEvents) {
      return initialEvents
        .filter(event => event.isActive !== false)
        .map(transformEvent)
        .slice(0, 3);
    }
    return [];
  });
  const [loading, setLoading] = useState(!initialEvents);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!initialEvents) {
      fetchUpcomingEvents();
    }
  }, [initialEvents]);

  const fetchUpcomingEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events?type=upcoming&limit=3', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data: EventFromAPI[] | EventAPIResponse = await response.json();

      // Handle different API response formats
      let apiEvents: EventFromAPI[] = [];
      if (Array.isArray(data)) {
        apiEvents = data;
      } else if (data.events && Array.isArray(data.events)) {
        apiEvents = data.events;
      }

      // Transform and filter events
      const transformedEvents = apiEvents
        .filter(event => event.isActive !== false)
        .map(transformEvent)
        .slice(0, 3);

      setUpcomingEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setError(error instanceof Error ? error.message : 'Failed to load events');
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-[#0B0B0B] to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-6">
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">
                LOADING
              </span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black text-white mb-4 uppercase tracking-tighter italic">
              UPCOMING <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500">EVENTS</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 bg-white/5 rounded-[2rem] animate-pulse border border-white/10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-[#0B0B0B] to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                ERROR
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Unable to Load Events
            </h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchUpcomingEvents}
              className="px-6 py-3 bg-pink-500/20 border border-pink-500/40 rounded-lg text-pink-300 font-semibold hover:bg-pink-500/30 transition-all"
            >
              Try Again
            </motion.button>
          </div>
        </div>
      </section>
    );
  }

  // Empty state - hide section if no events
  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-[#0B0B0B] to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #FF5E00 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Gradient Blob */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-6">
              <Zap size={12} className="text-pink-500 animate-pulse" />
              <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">
                LIVE EVENTS
              </span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-4 uppercase tracking-tighter italic leading-tight"
          >
            UPCOMING{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 drop-shadow-[0_0_30px_rgba(249,115,22,0.3)] pr-4">
              EVENTS
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-semibold"
          >
            Join the community in unforgettable gaming experiences. Register now and earn bonus points!
          </motion.p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.15,
                duration: 0.5,
                ease: "easeOut"
              }}
            >
              <EventCard
                event={event}
                isUpcoming={true}
                user={user}
                onRegisterSuccess={fetchUpcomingEvents} detailedDescription={''} />
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              y: -4,
              boxShadow: '12px 12px 0px 0px rgba(0,0,0,0.6)'
            }}
            whileTap={{ scale: 0.98 }}
            className="group px-10 py-5 bg-gradient-to-r from-pink-500/30 to-rose-500/30 border-4 border-pink-500/60 rounded-2xl text-pink-200 font-black uppercase hover:border-pink-400 hover:bg-pink-500/40 transition-all flex items-center gap-4 mx-auto text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.6)]"
            onClick={() => window.location.href = '/events'}
          >
            <Calendar size={24} />
            <span>View All Events</span>
            <ArrowRight
              size={24}
              className="group-hover:translate-x-1 transition-transform"
            />
          </motion.button>
        </motion.div>
      </div>

      {/* Add shimmer animation style */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </section>
  );
}