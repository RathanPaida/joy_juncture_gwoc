'use client';

import { useState } from 'react';
import './adminForms.css';

interface AddEventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddEventForm({ onSuccess, onCancel }: AddEventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailedDescription: '',
    date: '',
    price: 0,
    coins: 0,
    registrationLink: '',
    collabWith: '',
    isActive: true,
    totalSeats: 0,
    availableSeats: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name || !formData.description || !formData.date) {
        throw new Error('Please fill in all required fields');
      }

      const submissionData = {
        ...formData,
        availableSeats: formData.totalSeats
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      alert('Event created successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-form-container">
      <div className="form-header">
        <h2>Add New Event</h2>
        <button
          onClick={onCancel}
          className="close-button"
          type="button"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-grid">
          {/* Event Name */}
          <div className="form-field full-width">
            <label htmlFor="name" className="form-label">
              Event Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="e.g., DMD Pune Tournament Day 1"
            />
          </div>

          {/* Description */}
          <div className="form-field full-width">
            <label htmlFor="description" className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="form-textarea"
              placeholder="Describe your event..."
            />
          </div>

          {/* Detailed Description */}
          <div className="form-field full-width">
            <label htmlFor="detailedDescription" className="form-label">
              Detailed Description <span className="required">*</span>
            </label>
            <textarea
              id="detailedDescription"
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleChange}
              required
              rows={4}
              className="form-textarea"
              placeholder="Provide detailed information about the event..."
            />
          </div>

          {/* Date */}
          <div className="form-field">
            <label htmlFor="date" className="form-label">
              Event Date <span className="required">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          {/* Price */}
          <div className="form-field">
            <label htmlFor="price" className="form-label">
              Price (₹)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="form-input"
              placeholder="0"
            />
          </div>

          {/* Total Seats */}
          <div className="form-field">
            <label htmlFor="totalSeats" className="form-label">
              Total Seats Available
            </label>
            <input
              type="number"
              id="totalSeats"
              name="totalSeats"
              value={formData.totalSeats}
              onChange={handleChange}
              min="0"
              step="1"
              className="form-input"
              placeholder="0"
            />
          </div>

          {/* Coins */}
          <div className="form-field">
            <label htmlFor="coins" className="form-label">
              Reward Coins
            </label>
            <input
              type="number"
              id="coins"
              name="coins"
              value={formData.coins}
              onChange={handleChange}
              min="0"
              className="form-input"
              placeholder="0"
            />
          </div>

          {/* Registration Link */}
          <div className="form-field">
            <label htmlFor="registrationLink" className="form-label">
              Registration Link
            </label>
            <input
              type="url"
              id="registrationLink"
              name="registrationLink"
              value={formData.registrationLink}
              onChange={handleChange}
              className="form-input"
              placeholder="https://..."
            />
          </div>

          {/* Collaboration */}
          <div className="form-field full-width">
            <label htmlFor="collabWith" className="form-label">
              Collaboration With
            </label>
            <input
              type="text"
              id="collabWith"
              name="collabWith"
              value={formData.collabWith}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Partner Organization Name"
            />
          </div>

          {/* Active Status */}
          <div className="form-field full-width">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="form-checkbox"
              />
              <span>Set event as active (visible to users)</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}