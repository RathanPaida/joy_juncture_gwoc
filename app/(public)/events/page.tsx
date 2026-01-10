"use client";

import { useState, useEffect } from "react";
import EventCard from "@/app/components/EventCard";
import { useAuth } from "@/app/contexts/AuthContext";
import { Calendar, MapPin, Users } from "lucide-react";
import "./events.css";

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

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        fetch("/api/events?type=upcoming"),
        fetch("/api/events?type=past"),
      ]);

      if (!upcomingRes.ok || !pastRes.ok) {
        throw new Error("Failed to fetch events");
      }

      const upcomingData = await upcomingRes.json();
      const pastData = await pastRes.json();

      setUpcomingEvents(upcomingData);
      setPastEvents(pastData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-orange-500 selection:text-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-orange-500 mb-4 uppercase">
            Joy Juncture <span className="text-white">Events</span>
          </h1>
          <div className="h-1.5 w-24 bg-orange-600 mx-auto mb-6 rounded-full" />
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            Join our exciting board game tournaments and events.
            <span className="text-orange-400 font-semibold ml-1">
              Register to earn coins!
            </span>
          </p>
        </header>

        {/* Upcoming Events */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-10 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-orange-500" size={28} />
              <h2 className="text-3xl font-black uppercase">Upcoming Events</h2>
            </div>
            <span className="hidden md:block bg-orange-500 text-black px-4 py-1.5 rounded-md font-bold text-sm">
              {upcomingEvents.length} ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => (
              <div key={event._id} className="event-card">
                <EventCard
                  event={event}
                  isUpcoming
                  user={user}
                  onRegisterSuccess={fetchEvents}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Past Events */}
        <section className="pb-20">
          <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
            <MapPin className="text-neutral-500" size={28} />
            <h2 className="text-3xl font-black text-neutral-400 uppercase">
              Event History
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastEvents.map((event) => (
              <div key={event._id} className="event-card">
                <EventCard event={event} isUpcoming={false} user={user} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
