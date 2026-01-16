// app/components/admin/EventList.tsx
"use client";

import { useState } from "react";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import AddEventForm from "./AddEventForm";

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  coins: number;
  isActive: boolean;
  // ... other fields
}

interface EventListProps {
  events: Event[];
  onUpdate: () => void;
}

export default function EventList({ events, onUpdate }: EventListProps) {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (response.ok) {
        alert("Event deleted successfully!");
        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const toggleStatus = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...event, isActive: !event.isActive }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  if (editingEvent) {
    return (
      <div className="form-container">
        <AddEventForm
          editEvent={editingEvent}
          onSuccess={() => {
            setEditingEvent(null);
            onUpdate();
          }}
          onCancel={() => setEditingEvent(null)}
        />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📅</div>
        <h3>No Events Yet</h3>
        <p>Create your first event to get started!</p>
      </div>
    );
  }

  return (
    <table className="event-table">
      <thead>
        <tr>
          <th>Event Details</th>
          <th>Date</th>
          <th>Price</th>
          <th>Coins</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event._id}>
            <td>
              <div className="event-name">{event.name}</div>
              <div style={{ color: "#aaa", fontSize: "0.9rem" }}>
                {event.description}
              </div>
            </td>
            <td>{new Date(event.date).toLocaleDateString()}</td>
            <td>₹{event.price}</td>
            <td>{event.coins} coins</td>
            <td>
              <span className={`status-badge ${event.isActive ? "status-active" : "status-inactive"}`}>
                {event.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                <button
                  className="btn-edit"
                  onClick={() => setEditingEvent(event)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="btn-toggle"
                  onClick={() => toggleStatus(event)}
                >
                  {event.isActive ? <FaToggleOff /> : <FaToggleOn />}
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(event._id)}
                >
                  <FaTrash />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}