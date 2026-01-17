'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

// Types extracted from your Code A
export interface Event {
  detailedDescription: string;
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  coins: number;
  Venue: string;
  collabWith: string;
  isActive: boolean;
  availableSeats?: number;
  totalSeats?: number;
}

export interface RegisteredEvent extends Event {
  registrationId: string;
  registrationDate: string;
  paymentStatus: string;
  attendanceMarked: boolean;
}

export function useEventData() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegistered, setLoadingRegistered] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRegisteredEvents();
    } else {
      setLoadingRegistered(false);
      setRegisteredEvents([]);
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      const allEvents = Array.isArray(data) ? data : (data.events || []);
      const activeEvents = allEvents.filter((event: Event) => event.isActive);

      const now = new Date();
      const upcoming: Event[] = [];
      const past: Event[] = [];

      activeEvents.forEach((event: Event) => {
        const eventDate = new Date(event.date);
        if (eventDate >= now) upcoming.push(event);
        else past.push(event);
      });

      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    if (!user) return;
    try {
      setLoadingRegistered(true);
      const response = await fetch(`/api/registrations/user/${user.uid}`);
      if (!response.ok) {
        setRegisteredEvents([]);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setRegisteredEvents(data.registrations || []);
      }
    } catch (error) {
      console.error('Error fetching registered events:', error);
      setRegisteredEvents([]);
    } finally {
      setLoadingRegistered(false);
    }
  };

  return {
    upcomingEvents,
    pastEvents,
    registeredEvents,
    loading,
    loadingRegistered,
    refreshEvents: () => {
      fetchEvents();
      if (user) fetchRegisteredEvents();
    },
    user
  };
}