"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Upload, Trash2, X, Plus } from "lucide-react";

interface GalleryImage {
    _id: string;
    url: string;
    title: string;
    description: string;
    category: string;
}

import { useAuth } from "@/app/contexts/AuthContext";

export default function ExperiencesGalleryPage() {
    const { getToken } = useAuth();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Upload State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const res = await fetch("/api/admin/gallery?category=experiences");
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !title) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("category", "experiences");
        formData.append("title", title);
        formData.append("description", description);
        formData.append("image", uploadFile);

        try {
            const token = await getToken();
            const res = await fetch("/api/admin/gallery", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            if (res.ok) {
                setIsUploadModalOpen(false);
                setUploadFile(null);
                setPreviewUrl(null);
                setTitle("");
                setDescription("");
                fetchImages();
            } else {
                alert("Failed to upload image");
            }
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Error uploading image");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this image?")) return;

        try {
            const token = await getToken();
            const res = await fetch(`/api/admin/gallery?id=${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            if (res.ok) {
                setImages(images.filter((img) => img._id !== id));
            } else {
                alert("Failed to delete image");
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Experiences Gallery</h1>
                        <p className="text-gray-400 mt-1">Manage images for the Experiences page carousel</p>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Add Image
                    </button>
                </div>

                {/* Gallery Grid */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading gallery...</div>
                ) : images.length === 0 ? (
                    <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                        <p className="text-gray-400">No images found. Upload one to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {images.map((img) => (
                            <div key={img._id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 group">
                                <div className="relative aspect-video">
                                    <Image
                                        src={img.url}
                                        alt={img.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => handleDelete(img._id)}
                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-all"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-1">{img.title}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2">{img.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Modal with Scrollable Content */}
                {isUploadModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-lg my-8 flex flex-col border border-gray-700 max-h-[calc(100vh-4rem)]">
                            {/* Fixed Header */}
                            <div className="p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-800 sticky top-0 z-10">
                                <h2 className="text-xl font-bold">Add New Image</h2>
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <form onSubmit={handleUpload} className="p-6 space-y-4">
                                    {/* Image Upload Area */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${previewUrl ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'}`}
                                    >
                                        {previewUrl ? (
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                                <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={48} className="text-gray-400 mb-4" />
                                                <p className="text-gray-300 font-medium">Click to upload image</p>
                                                <span className="text-sm text-gray-500 mt-1">JPG, PNG, WebP</span>
                                            </>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                            placeholder="e.g. Wedding Setup"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                        <textarea
                                            required
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none h-32 resize-none"
                                            placeholder="Brief description of the image..."
                                        />
                                    </div>

                                    <div className="pt-4 pb-2 sticky bottom-0 bg-gray-800 -mx-6 px-6 border-t border-gray-700 mt-6">
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
                                        >
                                            {uploading ? "Uploading..." : "Upload Image"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(249, 115, 22, 0.5);
                    border-radius: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(249, 115, 22, 0.7);
                }
            `}</style>
        </div>
    );
}