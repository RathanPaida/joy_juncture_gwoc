'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './eventList.css';

interface Event {
  _id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  date: string;
  price: number;
  coins: number;
  registrationLink?: string;
  Venue?: string;
  venue?: string;
  address?: string;
  time?: string;
  collabWith?: string;
  isActive: boolean;
  imageUrl?: string;
  totalSeats?: number;
  availableSeats?: number;
}

interface EventListProps {
  events: Event[];
  onUpdate: () => void;
}

export default function EventList({ events, onUpdate }: EventListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Ensure events is always an array
  const eventList = Array.isArray(events) ? events : [];
  
  useEffect(() => {
    console.log('📋 EventList - Received events:', eventList.length, 'events');
  }, [events]);

  const handleDelete = async (id: string) => {
    console.log('🗑️ Attempting to delete event with ID:', id);
    
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
  
    setDeletingId(id);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
  
      const responseData = await response.json();
      console.log('Delete response:', response.status, responseData);
  
      if (response.ok) {
        onUpdate();
        alert('Event deleted successfully');
      } else {
        throw new Error(responseData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        onUpdate();
        alert(`Event ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      alert(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle null/undefined events
  if (!events) {
    console.error('❌ EventList - events prop is null/undefined');
    return (
      <div className="empty-events-list">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-2 text-red-600 font-medium">Error: No events data received</p>
          <p className="text-gray-500 text-sm mt-1">Please refresh the page or contact support</p>
        </div>
      </div>
    );
  }

  // Handle empty events list
  if (eventList.length === 0) {
    console.log('ℹ️ EventList - No events to display');
    return (
      <div className="empty-events-list">
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No events found</h3>
          <p className="mt-1 text-gray-500">Create your first event to get started!</p>
        </div>
      </div>
    );
  }

  console.log('✅ EventList - Rendering table with', eventList.length, 'events');

  return (
    <div className="event-list-wrapper">
      <div className="table-container">
        <table className="event-table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coins & Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {eventList.map((event, index) => {
              // Parse and validate date
              let eventDate;
              try {
                eventDate = new Date(event.date);
                if (isNaN(eventDate.getTime())) {
                  console.error(`Invalid date for event ${event.name}:`, event.date);
                  eventDate = new Date();
                }
              } catch (error) {
                console.error(`Error parsing date for event ${event.name}:`, error);
                eventDate = new Date();
              }
              
              const isPast = eventDate < new Date();
              const venueName = event.Venue || event.venue;

              return (
                <tr 
                  key={event._id || `event-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Event Details */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {event.name || 'Untitled Event'}
                        </h4>
                        {event.collabWith && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            Collab
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.description || 'No description'}
                      </p>
                      {venueName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{venueName}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{event.time}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Date & Price */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        {format(eventDate, 'PPP')}
                      </div>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isPast 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {isPast ? '📅 Past Event' : '🎯 Upcoming'}
                      </div>
                      <div className="text-base font-bold text-gray-900 mt-1">
                        ₹{event.price || 0}
                      </div>
                      {event.totalSeats !== undefined && (
                        <div className="text-xs text-gray-500">
                          {event.availableSeats || 0} / {event.totalSeats} seats
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Coins & Status */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-yellow-600">
                          {event.coins || 0} coins
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`mr-1.5 flex h-2 w-2 ${event.isActive ? 'bg-green-400' : 'bg-red-400'} rounded-full`} />
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleStatus(event._id, event.isActive)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          event.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {event.isActive ? '🔴 Deactivate' : '🟢 Activate'}
                      </button>

                      <button
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingId === event._id}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          deletingId === event._id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {deletingId === event._id ? (
                          <span className="flex items-center justify-center gap-1">
                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Deleting...
                          </span>
                        ) : (
                          '🗑️ Delete'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}