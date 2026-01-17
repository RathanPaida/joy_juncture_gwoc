"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Trash2, Upload, Plus, X, Image as ImageIcon } from "lucide-react";
import "./gallery.css";

interface GalleryImage {
    _id: string;
    url: string;
    title: string;
    description: string;
    createdAt: string;
}

export default function AdminGalleryPage() {
    const { user, getToken, loading } = useAuth();
    const router = useRouter();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState({
        title: "",
        description: ""
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && user) {
            // Assuming user is an admin or has necessary permissions to view/manage gallery
            // The backend API for gallery management should enforce admin roles.
            fetchGallery();
        }
    }, [user, loading]);

    const fetchGallery = async () => {
        try {
            const res = await fetch("/api/gallery?category=general");
            const data = await res.json();
            if (data.success) {
                setImages(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch gallery", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this image?")) return;

        try {
            const token = await getToken();
            const res = await fetch(`/api/admin/gallery?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setImages(images.filter((img) => img._id !== id));
            } else {
                alert(data.error || "Failed to delete");
            }
        } catch (err) {
            alert("Failed to delete image");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !form.title || !form.description) {
            setError("Please fill all fields and select an image.");
            return;
        }

        setUploadLoading(true);
        setError(null);

        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("category", "general");
            formData.append("image", selectedFile);

            const res = await fetch("/api/admin/gallery", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setImages([data.data, ...images]);
                closeModal();
            } else {
                setError(data.error || "Upload failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setUploadLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setForm({ title: "", description: "" });
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
    };

    if (loading) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="admin-gallery-page">
            <div className="gallery-header">
                <h1>Gallery Management</h1>
                <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Add New Image
                </button>
            </div>

            {images.length === 0 ? (
                <div className="empty-state">
                    <ImageIcon size={48} />
                    <p>No images in gallery yet.</p>
                </div>
            ) : (
                <div className="gallery-grid">
                    {images.map((img) => (
                        <div key={img._id} className="gallery-card">
                            <div className="card-image">
                                <img src={img.url} alt={img.title} />
                            </div>
                            <div className="card-content">
                                <h3>{img.title}</h3>
                                <p>{img.description}</p>
                                <div className="card-actions">
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(img._id)}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Image</h2>
                            <button className="close-btn" onClick={closeModal}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="gallery-form">
                            {error && <div className="error-msg">{error}</div>}

                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Corporate Event"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Short description..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Image</label>
                                <div className="file-upload-box">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="upload-label">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="upload-preview" />
                                        ) : (
                                            <div className="upload-placeholder">
                                                <Upload size={24} />
                                                <span>Click to Upload</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={uploadLoading}>
                                    {uploadLoading ? "Uploading..." : "Save Image"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
