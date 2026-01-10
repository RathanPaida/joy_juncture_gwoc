'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import './eventList.css';

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

interface EventListProps {
  events: Event[];
  onUpdate: () => void;
}

export default function EventList({ events, onUpdate }: EventListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const eventList = Array.isArray(events) ? events : [];

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
  
      console.log('Delete response status:', response.status);
      const responseData = await response.json();
      console.log('Delete response data:', responseData);
  
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

  if (eventList.length === 0) {
    return (
      <div className="empty-events-list">
        <p>No events found. Create your first event!</p>
      </div>
    );
  }

  return (
    <div className="event-list-wrapper">
      <div className="table-container">
        <table className="event-table">
          <thead>
            <tr>
              <th>Event Details</th>
              <th>Date & Price</th>
              <th>Coins & Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventList.map((event) => {
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();
              
              return (
                <tr key={event._id}>
                  <td>
                    <div className="event-details-cell">
                      <div className="event-name-row">
                        <h4>{event.name}</h4>
                        {event.collabWith && (
                          <span className="collab-badge">Collab</span>
                        )}
                      </div>
                      <p className="event-description">{event.description}</p>
                      {event.registrationLink && (
                        <a
                          href={event.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="registration-link"
                        >
                          Registration Link
                        </a>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="date-price-cell">
                      <div className="event-date">
                        {format(eventDate, 'PPP')}
                      </div>
                      <div className={`event-timing ${isPast ? 'past' : 'upcoming'}`}>
                        {isPast ? 'Past Event' : 'Upcoming'}
                      </div>
                      <div className="event-price">
                        ₹{event.price}
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="coins-status-cell">
                      <div className="event-coins">
                        {event.coins} coins
                      </div>
                      <div>
                        <span className={`status-badge ${event.isActive ? 'active' : 'inactive'}`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleToggleStatus(event._id, event.isActive)}
                        className={`btn-toggle ${event.isActive ? 'deactivate' : 'activate'}`}
                      >
                        {event.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingId === event._id}
                        className="btn-delete"
                      >
                        {deletingId === event._id ? 'Deleting...' : 'Delete'}
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