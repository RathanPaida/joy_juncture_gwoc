// 'use client';

// import { useState, useEffect } from 'react';
// import EventForm from '@/app/components/admin/EventForm';
// import EventList from '@/app/components/admin/EventList';

// export default function AdminEventsPage() {
//   const [events, setEvents] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   const fetchEvents = async () => {
//     try {
//       const response = await fetch('/api/events');
//       if (response.ok) {
//         const data = await response.json();
//         setEvents(data);
//       }
//     } catch (error) {
//       console.error('Error fetching events:', error);
//     }
//   };

//   const handleEdit = (event: any) => {
//     setSelectedEvent(event);
//     setShowForm(true);
//   };

//   const handleFormSuccess = () => {
//     setShowForm(false);
//     setSelectedEvent(null);
//     fetchEvents();
//   };

//   const handleCancel = () => {
//     setShowForm(false);
//     setSelectedEvent(null);
//   };

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Manage Events</h2>
//           <p className="text-gray-600 mt-1">
//             Create, edit, and manage your events
//           </p>
//         </div>
//         <button
//           onClick={() => {
//             setSelectedEvent(null);
//             setShowForm(!showForm);
//           }}
//           className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
//         >
//           {showForm ? 'Cancel' : 'Create New Event'}
//         </button>
//       </div>

//       {showForm && (
//         <div className="mb-8">
//           <EventForm
//             event={selectedEvent}
//             onSuccess={handleFormSuccess}
//             onCancel={handleCancel}
//           />
//         </div>
//       )}

//       <EventList events={events} onUpdate={fetchEvents} />
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import EventList from '@/app/components/admin/EventList';
import AddEventForm from '@/app/components/admin/AddEventForm';

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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Fetched data:', data);
      
      // Handle both formats: direct array or nested in object
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
      } else if (data.error) {
        console.error('API error:', data.error);
        setEvents([]);
      } else {
        console.error('Unexpected data format:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Management</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Event</span>
          </button>
        )}
      </div>

      {showAddForm ? (
        <div className="mb-8">
          <AddEventForm 
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : (
        <EventList events={events} onUpdate={fetchEvents} />
      )}
    </div>
  );
}