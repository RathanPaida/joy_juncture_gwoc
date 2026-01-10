// // 'use client';

// // import { useState, useEffect } from 'react';
// // import EventForm from '@/app/components/admin/EventForm';
// // import EventList from '@/app/components/admin/EventList';

// // export default function AdminEventsPage() {
// //   const [events, setEvents] = useState([]);
// //   const [showForm, setShowForm] = useState(false);
// //   const [selectedEvent, setSelectedEvent] = useState(null);

// //   useEffect(() => {
// //     fetchEvents();
// //   }, []);

// //   const fetchEvents = async () => {
// //     try {
// //       const response = await fetch('/api/events');
// //       if (response.ok) {
// //         const data = await response.json();
// //         setEvents(data);
// //       }
// //     } catch (error) {
// //       console.error('Error fetching events:', error);
// //     }
// //   };

// //   const handleEdit = (event: any) => {
// //     setSelectedEvent(event);
// //     setShowForm(true);
// //   };

// //   const handleFormSuccess = () => {
// //     setShowForm(false);
// //     setSelectedEvent(null);
// //     fetchEvents();
// //   };

// //   const handleCancel = () => {
// //     setShowForm(false);
// //     setSelectedEvent(null);
// //   };

// //   return (
// //     <div>
// //       <div className="flex justify-between items-center mb-8">
// //         <div>
// //           <h2 className="text-2xl font-bold text-gray-900">Manage Events</h2>
// //           <p className="text-gray-600 mt-1">
// //             Create, edit, and manage your events
// //           </p>
// //         </div>
// //         <button
// //           onClick={() => {
// //             setSelectedEvent(null);
// //             setShowForm(!showForm);
// //           }}
// //           className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
// //         >
// //           {showForm ? 'Cancel' : 'Create New Event'}
// //         </button>
// //       </div>

// //       {showForm && (
// //         <div className="mb-8">
// //           <EventForm
// //             event={selectedEvent}
// //             onSuccess={handleFormSuccess}
// //             onCancel={handleCancel}
// //           />
// //         </div>
// //       )}

// //       <EventList events={events} onUpdate={fetchEvents} />
// //     </div>
// //   );
// // }
// 'use client';

// import { useEffect, useState } from 'react';
// import EventList from '@/app/components/admin/EventList';
// import AddEventForm from '@/app/components/admin/AddEventForm';
// import './adminEvents.css';

// interface Event {
//   _id: string;
//   name: string;
//   description: string;
//   detailedDescription: string;
//   date: string;
//   price: number;
//   coins: number;
//   Venue: string;
//   collabWith: string;
//   isActive: boolean;
//   totalSeats: number;
//   availableSeats: number;
// }

// export default function AdminEventsPage() {
//   const [events, setEvents] = useState<Event[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAddForm, setShowAddForm] = useState(false);

//   const fetchEvents = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch('/api/events');
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();
      
//       console.log('Fetched data:', data);
      
//       if (Array.isArray(data)) {
//         setEvents(data);
//       } else if (data.events && Array.isArray(data.events)) {
//         setEvents(data.events);
//       } else if (data.error) {
//         console.error('API error:', data.error);
//         setEvents([]);
//       } else {
//         console.error('Unexpected data format:', data);
//         setEvents([]);
//       }
//     } catch (error) {
//       console.error('Error fetching events:', error);
//       setEvents([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   const handleAddSuccess = () => {
//     setShowAddForm(false);
//     fetchEvents();
//   };

//   if (loading) {
//     return (
//       <div className="admin-events-container">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <div className="loading-text">Loading events...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="admin-events-container">
//       <div className="admin-header">
//         <h1>Event Management</h1>
//         {!showAddForm && (
//           <button
//             onClick={() => setShowAddForm(true)}
//             className="add-event-btn"
//           >
//             <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//             </svg>
//             <span>Add New Event</span>
//           </button>
//         )}
//       </div>

//       {showAddForm ? (
//         <div className="form-container">
//           <AddEventForm 
//             onSuccess={handleAddSuccess}
//             onCancel={() => setShowAddForm(false)}
//           />
//         </div>
//       ) : (
//         <div className="events-list-container">
//           {/* @ts-expect-error: EventList props typing needs to be updated */}
//           <EventList events={events} onUpdate={fetchEvents} />
//         </div>
//       )}
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import EventList from '@/app/components/admin/EventList';
import AddEventForm from '@/app/components/admin/AddEventForm';
import './adminEvents.css';

interface Event {
  _id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  date: string;
  price: number;
  coins: number;
  Venue?: string;
  address?: string;
  time?: string;
  collabWith?: string;
  isActive: boolean;
  totalSeats?: number;
  availableSeats?: number;
  imageUrl?: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching events...');
      
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📦 Fetched data:', data);
      console.log('📦 Data type:', typeof data);
      console.log('📦 Is array:', Array.isArray(data));
      
      if (Array.isArray(data)) {
        console.log('✅ Setting events from array, count:', data.length);
        setEvents(data);
      } else if (data.events && Array.isArray(data.events)) {
        console.log('✅ Setting events from data.events, count:', data.events.length);
        setEvents(data.events);
      } else if (data.error) {
        console.error('❌ API error:', data.error);
        setEvents([]);
      } else {
        console.error('❌ Unexpected data format:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    console.log('📊 Events state updated:', events);
    console.log('📊 Events count:', events.length);
  }, [events]);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="admin-events-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-events-container">
      <div className="admin-header">
        <h1>Event Management</h1>
        <div className="header-info">
          <span className="events-count">{events.length} Total Events</span>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="add-event-btn"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Event</span>
            </button>
          )}
        </div>
      </div>

      {showAddForm ? (
        <div className="form-container">
          <AddEventForm 
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : (
        <div className="events-list-container">
          <EventList events={events} onUpdate={fetchEvents} />
        </div>
      )}
    </div>
  );
}