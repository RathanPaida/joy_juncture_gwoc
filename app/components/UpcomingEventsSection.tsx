'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EventCard from '@/app/components/EventCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Calendar, ArrowRight, Zap } from 'lucide-react';

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  coins: number;
  registrationLink: string;
  collabWith: string;
}

export default function UpcomingEventsSection() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/events?type=upcoming&limit=3');
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setUpcomingEvents(data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-[#0B0B0B]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-[#0B0B0B] to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #FF5E00 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-6">
              <Zap size={12} className="text-pink-500" />
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
            className="text-5xl md:text-8xl font-black text-white mb-4 uppercase tracking-tighter italic"
          >
            UPCOMING <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500">EVENTS</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-xl max-w-2xl mx-auto font-semibold"
          >
            Join the community in unforgettable gaming experiences. Register now and earn bonus points!
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <EventCard
                event={event}
                isUpcoming={true}
                user={user}
                onRegisterSuccess={fetchUpcomingEvents}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group px-10 py-5 bg-gradient-to-r from-pink-500/30 to-rose-500/30 border-4 border-pink-500/60 rounded-2xl text-pink-200 font-black uppercase hover:border-pink-400 hover:bg-pink-500/40 transition-all flex items-center gap-4 mx-auto text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.6)]"
            onClick={() => window.location.href = '/events'}
          >
            <Calendar size={24} />
            <span>View All Events</span>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
