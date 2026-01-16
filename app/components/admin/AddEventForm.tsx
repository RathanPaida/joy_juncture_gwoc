// app/components/admin/AddEventForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { FaUpload, FaTimes } from "react-icons/fa";

interface Event {
  _id?: string;
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

interface AddEventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editEvent?: Event | null;
}

export default function AddEventForm({ onSuccess, onCancel, editEvent }: AddEventFormProps) {
  const [formData, setFormData] = useState<Event>({
    name: "",
    description: "",
    detailedDescription: "",
    date: "",
    price: 0,
    coins: 0,
    Venue: "",
    address: "",
    time: "",
    collabWith: "",
    isActive: true,
    totalSeats: 0,
    availableSeats: 0,
    imageUrl: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form if editing
  useEffect(() => {
    if (editEvent) {
      setFormData({
        name: editEvent.name || "",
        description: editEvent.description || "",
        detailedDescription: editEvent.detailedDescription || "",
        date: editEvent.date || "",
        price: editEvent.price || 0,
        coins: editEvent.coins || 0,
        Venue: editEvent.Venue || "",
        address: editEvent.address || "",
        time: editEvent.time || "",
        collabWith: editEvent.collabWith || "",
        isActive: editEvent.isActive ?? true,
        totalSeats: editEvent.totalSeats || 0,
        availableSeats: editEvent.availableSeats || 0,
        imageUrl: editEvent.imageUrl || "",
      });
      if (editEvent.imageUrl) {
        setImagePreview(editEvent.imageUrl);
      }
    }
  }, [editEvent]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, imageUrl: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default"); // Replace with your Cloudinary preset
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dwvb2cgmq/image/upload`, // Replace with your cloud name
        {
          method: "POST",
          body: formData,
        }
      );
      
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.imageUrl;

      // Upload image if new file selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const eventData = { ...formData, imageUrl };
      const url = editEvent ? `/api/events/${editEvent._id}` : "/api/events";
      const method = editEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        alert(editEvent ? "Event updated successfully!" : "Event created successfully!");
        onSuccess();
      } else {
        let errorMessage = "Unknown error";
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || "Unknown error";
        } catch {
          // If response body is empty or not JSON
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        alert(`Failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ color: "#ff6b00", marginBottom: "2rem", fontSize: "2rem" }}>
        {editEvent ? "Edit Event" : "Add New Event"}
      </h2>

      {/* Image Upload */}
      <div className="form-group">
        <label>Event Image</label>
        <div
          className={`image-upload-container ${imagePreview ? "has-image" : ""}`}
          onClick={() => !imagePreview && fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
              >
                <FaTimes /> Remove
              </button>
            </>
          ) : (
            <div className="upload-placeholder">
              <FaUpload className="upload-icon" />
              <p>Click to upload event image</p>
              <span style={{ fontSize: "0.875rem", color: "#888" }}>
                PNG, JPG up to 5MB
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Event Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleInputChange}
          required
          placeholder="e.g., Annual Tech Summit 2024"
        />
      </div>

      <div className="form-group">
        <label>Short Description *</label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          required
          placeholder="Brief description of the event"
        />
      </div>

      <div className="form-group">
        <label>Detailed Description</label>
        <textarea
          name="detailedDescription"
          value={formData.detailedDescription || ""}
          onChange={handleInputChange}
          placeholder="Full event details, schedule, etc."
          style={{ minHeight: "150px" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date || ""}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Time</label>
          <input
            type="time"
            name="time"
            value={formData.time || ""}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="form-group">
          <label>Price (₹) *</label>
          <input
            type="number"
            name="price"
            value={formData.price || 0}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Coins Reward *</label>
          <input
            type="number"
            name="coins"
            value={formData.coins || 0}
            onChange={handleInputChange}
            required
            min="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Venue</label>
        <input
          type="text"
          name="Venue"
          value={formData.Venue || ""}
          onChange={handleInputChange}
          placeholder="Event venue name"
        />
      </div>

      <div className="form-group">
        <label>Address</label>
        <textarea
          name="address"
          value={formData.address || ""}
          onChange={handleInputChange}
          placeholder="Full address"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div className="form-group">
          <label>Total Seats</label>
          <input
            type="number"
            name="totalSeats"
            value={formData.totalSeats || 0}
            onChange={handleInputChange}
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Available Seats</label>
          <input
            type="number"
            name="availableSeats"
            value={formData.availableSeats || 0}
            onChange={handleInputChange}
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select
            name="isActive"
            value={formData.isActive.toString()}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.value === "true" })
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Collaboration With</label>
        <input
          type="text"
          name="collabWith"
          value={formData.collabWith || ""}
          onChange={handleInputChange}
          placeholder="Partner organizations"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? "Saving..." : editEvent ? "Update Event" : "Create Event"}
        </button>
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}