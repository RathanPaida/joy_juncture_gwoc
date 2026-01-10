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

"use client";

import { useEffect, useState } from "react";
// Remove the faulty import of EventList as a module
import EventList from "@/app/components/admin/EventList"; // Make sure this path is correct and that EventList is a valid component

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
  const [events, setEvents] = useState<Event[]>([]); // Add Event[] type
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("Fetched data:", data); // Debug log

      // Handle both formats: direct array or nested in object
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
      } else if (data.error) {
        console.error("API error:", data.error);
        setEvents([]);
      } else {
        console.error("Unexpected data format:", data);
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
      <h1 className="text-3xl font-bold mb-6">Event Management</h1>
      <EventList events={events} onUpdate={fetchEvents} />
    </div>
  );
}
