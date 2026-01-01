'use client';

import { useState, useEffect } from 'react';
import EventForm from '@/app/components/admin/EventForm';
import EventList from '@/app/components/admin/EventList';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEdit = (event: any) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedEvent(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Events</h2>
          <p className="text-gray-600 mt-1">
            Create, edit, and manage your events
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? 'Cancel' : 'Create New Event'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <EventForm
            event={selectedEvent}
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}

      <EventList events={events} onUpdate={fetchEvents} />
    </div>
  );
}