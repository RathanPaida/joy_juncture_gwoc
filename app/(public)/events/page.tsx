'use client';

import { useState, useEffect } from 'react';
import EventCard from '@/app/components/EventCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Calendar, MapPin, Users } from 'lucide-react';
import './events.css';

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  coins: number;
  registrationLink: string;
  collabWith: string;
  isActive: boolean;
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
      setLoading(true);
      
      // Fetch all events from the API
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      
      // Handle both array and object responses
      const allEvents = Array.isArray(data) ? data : (data.events || []);
      
      // Filter only active events
      const activeEvents = allEvents.filter((event: Event) => event.isActive);
      
      // Separate into upcoming and past events
      const now = new Date();
      const upcoming: Event[] = [];
      const past: Event[] = [];
      
      activeEvents.forEach((event: Event) => {
        const eventDate = new Date(event.date);
        if (eventDate >= now) {
          upcoming.push(event);
        } else {
          past.push(event);
        }
      });
      
      // Sort upcoming events by date (earliest first)
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Sort past events by date (most recent first)
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error fetching events:', error);
      setUpcomingEvents([]);
      setPastEvents([]);
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Joy Juncture Events
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our exciting board game tournaments and events. Register to earn coins!
          </p>
        </header>

        {/* User Info Bar */}
        {user && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm mb-10 border border-blue-100">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Welcome back, {user.name || user.displayName || 'Guest'}!
                </h3>
                <p className="text-gray-600 mt-1">
                  Ready for your next gaming adventure?
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="bg-white px-6 py-3 rounded-lg shadow-sm border">
                  <span className="text-gray-700">Your coins: </span>
                  <span className="text-2xl font-bold text-yellow-600 ml-2">
                    {user.totalPoints || user.coins || 0} 🪙
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
              <p className="text-gray-600 mt-2">
                Register now to secure your spot and earn coins!
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              {upcomingEvents.length} events
            </div>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  isUpcoming={true}
                  user={user}
                  onRegisterSuccess={fetchEvents}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No upcoming events scheduled
              </h3>
              <p className="text-gray-500">
                Check back soon for new events!
              </p>
            </div>
          )}
        </section>

        {/* Past Events Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Past Events</h2>
              <p className="text-gray-600 mt-2">
                Relive the memories from our previous tournaments
              </p>
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
              {pastEvents.length} events
            </div>
          </div>

          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  isUpcoming={false}
                  user={user}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="text-6xl mb-4">📜</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No past events yet
              </h3>
              <p className="text-gray-500">
                Our event history will appear here
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
