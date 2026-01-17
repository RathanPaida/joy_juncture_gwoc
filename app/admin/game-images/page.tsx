"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Image, Eye, EyeOff, Save, X } from "lucide-react";

interface GameImage {
  _id: string;
  name: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminGameImages() {
  const [images, setImages] = useState<GameImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GameImage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    category: "general",
    isActive: true,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/admin/game-images");
      const data = await res.json();
      if (data.success) {
        setImages(data.data);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      const url = editingImage 
        ? `/api/admin/game-images/${editingImage._id}`
        : "/api/admin/game-images";
      
      const method = editingImage ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success) {
        fetchImages();
        resetForm();
      } else {
        alert("Error saving image: " + data.error);
      }
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`/api/admin/game-images/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      
      if (data.success) {
        fetchImages();
      } else {
        alert("Error deleting image: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  const handleEdit = (image: GameImage) => {
    setEditingImage(image);
    setFormData({
      name: image.name,
      imageUrl: image.imageUrl,
      category: image.category,
      isActive: image.isActive,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
      category: "general",
      isActive: true,
    });
    setEditingImage(null);
    setShowAddModal(false);
  };

  const toggleActive = async (image: GameImage) => {
    try {
      const res = await fetch(`/api/admin/game-images/${image._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...image,
          isActive: !image.isActive,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        fetchImages();
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: '"Inter", sans-serif', letterSpacing: "-0.02em" }}>
          Game Images
        </h1>
        <div className="h-1 w-32 rounded-full" style={{ backgroundColor: "#FF5F1F" }}></div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all hover:scale-105"
          style={{ backgroundColor: "#FF5F1F" }}
        >
          <Plus size={20} />
          Add New Image
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <div
            key={image._id}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl"
          >
            <div className="relative h-48 bg-gray-700">
              <img
                src={image.imageUrl}
                alt={image.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => toggleActive(image)}
                  className={`p-2 rounded-lg ${image.isActive ? 'bg-green-600' : 'bg-gray-600'} hover:opacity-80`}
                >
                  {image.isActive ? <Eye size={16} className="text-white" /> : <EyeOff size={16} className="text-white" />}
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-white font-bold text-lg mb-2">{image.name}</h3>
              <p className="text-gray-400 text-sm mb-3">Category: {image.category}</p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(image)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(image._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12">
          <Image size={48} className="text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No game images yet. Add your first image!</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingImage ? "Edit Image" : "Add New Image"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-medium">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              {formData.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-600">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-300 mb-2 font-medium">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="isActive" className="text-gray-300 font-medium">
                  Active (visible in games)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white font-bold rounded-lg transition-all"
                  style={{ backgroundColor: "#FF5F1F" }}
                >
                  <Save size={20} />
                  {editingImage ? "Update" : "Create"}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}