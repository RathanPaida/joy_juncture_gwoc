import React from 'react';
import { motion } from 'framer-motion';
import { connectDb } from '@/lib/mongodb';
import { Event } from '@/models/Event';

import UpcomingEventsSection from '../../components/UpcomingEventsSection';
import GallerySection from '../../components/GallerySection';
import PlayStyleCards from '../../components/PlayStyleCards';

// Client component for hero animations and interactive elements
import HomeClientWrapper from '../../components/HomeClientWrapper';

async function getUpcomingEvents() {
  try {
    await connectDb();
    const events = await Event.find({
      date: { $gte: new Date() },
      isActive: { $ne: false }
    })
      .sort({ date: 1 })
      .limit(3)
      .lean();

    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    console.error('Error fetching events on server:', error);
    return [];
  }
}

export default async function App() {
  const initialEvents = await getUpcomingEvents();

  return (
    <div className="relative bg-black min-h-screen overflow-hidden">
      <HomeClientWrapper>
        {/* Play Style Cards Section */}
        <PlayStyleCards />

        {/* Upcoming Events Section */}
        <UpcomingEventsSection initialEvents={initialEvents} />

        {/* Gallery Section */}
        <GallerySection />

        {/* Footer Spacer */}
        <div className="h-20 bg-black"></div>
      </HomeClientWrapper>
    </div>
  );
}
