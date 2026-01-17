"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Upload, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { FILTERS } from "@/app/components/StoreFilters";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  story: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string; images: string[] };
  images?: Array<{ url: string; isPrimary: boolean }>;
  meta: {
    players: string;
    duration: string;
    age: string;
    difficulty: string;
    moods: string[];
    badges: string[];
  };
  stock: { available: boolean; quantity: number };
  keyFeatures: string[];
  howToPlay: {
    setup: string;
    gameplay: string;
    winning: string;
  };
  category: string | string[];
  gametype: 'board-game' | 'card-game';
  faqs?: Array<{ question: string; answer: string }>;
  whatYouGet?: string[];
}

interface ImageFile {
  id: string;
  url: string; // Used for both preview and existing
  preview: string;
  isPrimary: boolean;
  file?: File; // Only for new images
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Product | null>(null);

  // Image Upload State
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${unwrappedParams.id}`);
      const data = await res.json();

      if (data.success) {
        setFormData(data.product);

        // Load existing images
        if (data.product.images && data.product.images.length > 0) {
          setImages(data.product.images.map((img: any, idx: number) => ({
            id: `existing-${idx}`,
            url: img.url,
            preview: img.url,
            isPrimary: img.isPrimary,
          })));
        } else if (data.product.media?.thumbnail) {
          // Fallback legacy
          setImages([{
            id: 'legacy-thumb',
            url: data.product.media.thumbnail,
            preview: data.product.media.thumbnail,
            isPrimary: true,
          }]);
        }
      } else {
        alert("Failed to load product");
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Error loading product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(Array.from(files));
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please select only image files');
      return;
    }

    const newImages: ImageFile[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: '',
      preview: URL.createObjectURL(file), // Create local preview
      isPrimary: images.length === 0, // Make primary if it's the first one
      file: file
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Ensure one primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);

    try {
      const submitData = new FormData();

      // Append basic fields
      submitData.append('name', formData.name);
      submitData.append('slug', formData.slug);
      submitData.append('shortDescription', formData.shortDescription);
      submitData.append('story', formData.story || ''); // Ensure story is sent

      const category = Array.isArray(formData.category) ? formData.category[0] : formData.category;
      submitData.append('category', category);
      submitData.append('gametype', formData.gametype);

      // Pricing & Stock
      submitData.append('price.amount', formData.price.amount.toString());
      submitData.append('price.currency', formData.price.currency);
      submitData.append('stock.quantity', formData.stock.quantity.toString());
      submitData.append('stock.available', formData.stock.available.toString());

      // Meta
      submitData.append('meta.players', formData.meta.players);
      submitData.append('meta.duration', formData.meta.duration);
      submitData.append('meta.age', formData.meta.age);
      submitData.append('meta.difficulty', formData.meta.difficulty);
      submitData.append('meta.moods', JSON.stringify(formData.meta.moods));
      submitData.append('meta.badges', JSON.stringify(formData.meta.badges));

      // How To Play
      submitData.append('howToPlay.setup', formData.howToPlay.setup);
      submitData.append('howToPlay.gameplay', formData.howToPlay.gameplay);
      submitData.append('howToPlay.winning', formData.howToPlay.winning);

      // Arrays
      if (formData.keyFeatures) submitData.append('keyFeatures', JSON.stringify(formData.keyFeatures));
      if (formData.faqs) submitData.append('faqs', JSON.stringify(formData.faqs));
      if (formData.whatYouGet) submitData.append('whatYouGet', JSON.stringify(formData.whatYouGet));

      // Images
      // 1. Separate existing (URL-based) and new (File-based)
      const existingImages = images.filter(img => !img.file).map(img => ({
        url: img.url,
        isPrimary: img.isPrimary
      }));

      submitData.append('existingImages', JSON.stringify(existingImages));

      // 2. Append new files
      const newImages = images.filter(img => img.file);
      newImages.forEach(img => {
        if (img.file) {
          submitData.append('newImages', img.file);
        }
      });

      // Calculate index of primary image within the NEW list if the primary is a new image
      // Note: Backend logic I wrote makes new images default to false unless explicitly handled.
      // But my backend logic also has a 'primaryImageIndex' check for new uploads which might clash if mixed.
      // Better strategy: My backend code currently calculates `finalImages` by concatting `existing` + `saved`.
      // I can calculate the absolute index of the primary image in the final merged array and send that.

      const primaryIndex = images.findIndex(img => img.isPrimary);
      submitData.append('primaryImageIndex', primaryIndex.toString());

      const res = await fetch(`/api/admin/products/${unwrappedParams.id}`, {
        method: "PUT",
        body: submitData, // Browser sets Content-Type: multipart/form-data
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Product updated successfully!");
        router.push("/admin/products");
      } else {
        alert(`❌ ${data.error || "Failed to update product"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error updating product");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          [parent]: { ...(prev as any)[parent], [field]: value },
        }
        : null,
    );
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          [field]: (prev as any)[field].map((item: string, i: number) =>
            i === index ? value : item,
          ),
        }
        : null,
    );
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) =>
      prev
        ? {
          ...prev,
          [field]: [...(prev as any)[field], ""],
        }
        : null,
    );
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Products
          </Link>
          <h1
            className="text-5xl font-black text-white mb-2"
            style={{
              fontFamily: '"Inter", sans-serif',
              letterSpacing: "-0.02em",
            }}
          >
            Edit Product
          </h1>
          <div
            className="h-1 w-24 rounded-full"
            style={{ backgroundColor: "#FF5F1F" }}
          ></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Product Name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="The Bloody Inheritance"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  URL Identifier (Website Link) <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="the-bloody-inheritance"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Short Description <span className="text-orange-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.shortDescription}
                  onChange={(e) =>
                    updateField("shortDescription", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all h-24 resize-none"
                  placeholder="A hands-on murder mystery case file..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Full Story
                </label>
                <textarea
                  value={formData.story || ""}
                  onChange={(e) => updateField("story", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all h-40 resize-none"
                  placeholder="Step inside a story that feels straight out of a crime thriller..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Price <span className="text-orange-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.price?.amount || 0}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? 0 : parseInt(e.target.value);
                    updateNestedField(
                      "price",
                      "amount",
                      isNaN(value) ? 0 : value,
                    );
                  }}
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="999"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Currency
                </label>
                <select
                  value={formData.price?.currency || "INR"}
                  onChange={(e) =>
                    updateNestedField("price", "currency", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white focus:ring-2 focus:border-transparent transition-all"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Media - Image Upload */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              Product Images
            </h2>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-gray-900/30 mb-6 ${dragActive
                ? "border-orange-500 bg-orange-500/10"
                : "border-gray-600 hover:border-gray-500"
                }`}
            >
              <Upload size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-300 font-medium text-lg mb-2">
                Drag and drop images here, or click to select
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Supports: JPG, PNG, WebP (Max 5MB each)
              </p>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="px-6 py-3 text-white font-bold rounded-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#FF5F1F" }}
              >
                Select Images
              </label>
            </div>

            {/* Image Preview Grid */}
            {(images.length > 0) && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  {images.length} image{images.length !== 1 ? 's' : ''} total. Click to set as primary.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${img.isPrimary
                        ? "border-orange-500 ring-2 ring-orange-500/30"
                        : "border-gray-700 hover:border-gray-500"
                        }`}
                      onClick={() => setPrimaryImage(img.id)}
                    >
                      <Image
                        src={img.preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />

                      {/* Primary Badge */}
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                          <CheckCircle size={10} />
                          Primary
                        </div>
                      )}

                      {/* New Badge */}
                      {img.file && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                          New
                        </div>
                      )}

                      {/* Overlay & Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-all shadow-lg"
                          title="Remove Image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Game Details */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              Game Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Players
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="2-6"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {FILTERS.players.options.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateNestedField("meta", "players", opt)}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.meta.duration || ""}
                  onChange={(e) =>
                    updateNestedField("meta", "duration", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="30-60 mins"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Age
                </label>
                <input
                  type="text"
                  value={formData.meta.age || ""}
                  onChange={(e) =>
                    updateNestedField("meta", "age", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="14+"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Difficulty
                </label>
                <select
                  value={formData.meta.difficulty || "Easy"}
                  onChange={(e) =>
                    updateNestedField("meta", "difficulty", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white focus:ring-2 focus:border-transparent transition-all"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Very Easy">Very Easy</option>
                </select>
              </div>
            </div>


            {/* Category & Moods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Category
                </label>
                <select
                  value={typeof formData.category === 'string' ? formData.category : formData.category?.[0] || ""}
                  onChange={(e) => updateField("category", e.target.value)} // Sending as string, backend likely handles it or we adapt
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white focus:ring-2 focus:border-transparent transition-all"
                >
                  <option value="" disabled>Select Occasion</option>
                  {FILTERS.occasion.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Gametype
                </label>
                <select
                  value={formData.gametype || "board-game"}
                  onChange={(e) => updateField("gametype", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white focus:ring-2 focus:border-transparent transition-all"
                >
                  <option value="board-game">Board Game</option>
                  <option value="card-game">Card Game</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Moods
                </label>
                <div className="flex flex-wrap gap-2">
                  {FILTERS.mood.options.map(mood => {
                    const currentMoods = formData.meta.moods || [];
                    const isActive = currentMoods.includes(mood);
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => {
                          const newMoods = isActive
                            ? currentMoods.filter(m => m !== mood)
                            : [...currentMoods, mood];
                          updateNestedField("meta", "moods", newMoods);
                        }}
                        className={`px-3 py-1 text-sm rounded-full border transition-all ${isActive
                          ? "bg-orange-600 border-orange-600 text-white"
                          : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
                          }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              Inventory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock?.quantity || 0}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? 0 : parseInt(e.target.value);
                    updateNestedField(
                      "stock",
                      "quantity",
                      isNaN(value) ? 0 : value,
                    );
                  }}
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Availability
                </label>
                <select
                  value={formData.stock?.available?.toString() || "true"}
                  onChange={(e) =>
                    updateNestedField(
                      "stock",
                      "available",
                      e.target.value === "true",
                    )
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white focus:ring-2 focus:border-transparent transition-all"
                >
                  <option value="true">Available</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              Key Features
            </h2>
            {formData.keyFeatures &&
              formData.keyFeatures.map((feature, index) => (
                <div key={index} className="mb-4">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) =>
                      updateArrayField("keyFeatures", index, e.target.value)
                    }
                    className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                    placeholder="Feature description..."
                  />
                </div>
              ))}
            <button
              type="button"
              onClick={() => addArrayItem("keyFeatures")}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
            >
              + Add Feature
            </button>
          </div>

          {/* How to Play */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              How to Play
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Setup
                </label>
                <textarea
                  value={formData.howToPlay.setup || ""}
                  onChange={(e) =>
                    updateNestedField("howToPlay", "setup", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all h-24 resize-none"
                  placeholder="Describe the setup process..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Gameplay
                </label>
                <textarea
                  value={formData.howToPlay.gameplay || ""}
                  onChange={(e) =>
                    updateNestedField("howToPlay", "gameplay", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all h-24 resize-none"
                  placeholder="Describe how to play..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  Winning
                </label>
                <textarea
                  value={formData.howToPlay.winning || ""}
                  onChange={(e) =>
                    updateNestedField("howToPlay", "winning", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all h-24 resize-none"
                  placeholder="Describe how to win..."
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 text-white font-black rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{ backgroundColor: "#FF5F1F" }}
            >
              <Save size={20} />
              {saving ? "Updating Product..." : "Update Product"}
            </button>
            <Link
              href="/admin/products"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div >
    </div >
  );
}
