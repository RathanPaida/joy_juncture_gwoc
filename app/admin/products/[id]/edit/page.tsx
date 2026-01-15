"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  story: string;
  price: { amount: number; currency: string };
  media: { thumbnail: string; images: string[] };
  images?: Array<{ url: string; isPrimary: boolean }>; // NEW
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
  category: string[];
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

  // NEW: Multiple Media URLs State
  const [mediaUrls, setMediaUrls] = useState([{ url: "", isPrimary: true }]);

  const addMediaUrl = () => {
    setMediaUrls([...mediaUrls, { url: "", isPrimary: false }]);
  };

  const removeMediaUrl = (index: number) => {
    if (mediaUrls.length > 1) {
      setMediaUrls(mediaUrls.filter((_, i) => i !== index));
    }
  };

  const updateMediaUrl = (index: number, value: string) => {
    const newMediaUrls = [...mediaUrls];
    newMediaUrls[index].url = value;
    setMediaUrls(newMediaUrls);
  };

  const setPrimaryImage = (index: number) => {
    const newMediaUrls = mediaUrls.map((media, i) => ({
      ...media,
      isPrimary: i === index,
    }));
    setMediaUrls(newMediaUrls);
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${unwrappedParams.id}`);
      const data = await res.json();

      if (data.success) {
        setFormData(data.product);

        // Load existing images into mediaUrls state
        if (data.product.images && data.product.images.length > 0) {
          setMediaUrls(data.product.images);
        } else if (data.product.media?.thumbnail) {
          // Fallback to old thumbnail field
          setMediaUrls([
            { url: data.product.media.thumbnail, isPrimary: true },
          ]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare product data with multiple images
      const productData = {
        ...formData,
        images: mediaUrls.filter((m) => m.url.trim() !== ""),
        media: {
          thumbnail:
            mediaUrls.find((m) => m.isPrimary)?.url || mediaUrls[0]?.url,
          images: mediaUrls
            .filter((m) => m.url.trim() !== "")
            .map((m) => m.url),
        },
      };

      const res = await fetch(`/api/admin/products/${unwrappedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
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
                  Slug <span className="text-orange-500">*</span>
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

          {/* Media - UPDATED SECTION WITH MULTIPLE URLS */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: "#FF5F1F" }}
              ></div>
              Media
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">
                  Upload images to Cloudinary and paste URLs here
                </p>
                <button
                  type="button"
                  onClick={addMediaUrl}
                  className="px-4 py-2 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                  style={{ backgroundColor: "#FF5F1F" }}
                >
                  <span>+</span> Add More Media
                </button>
              </div>

              {mediaUrls.map((media, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-700 rounded-lg p-4 space-y-3 bg-gray-900/30"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-300">
                      Image URL {index + 1}
                      {media.isPrimary && (
                        <span
                          className="ml-2 px-2 py-1 text-white text-xs rounded font-bold"
                          style={{ backgroundColor: "#FF5F1F" }}
                        >
                          Primary
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      {!media.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-all font-semibold"
                        >
                          Set as Primary
                        </button>
                      )}
                      {mediaUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMediaUrl(index)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-all font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="url"
                    value={media.url}
                    onChange={(e) => updateMediaUrl(index, e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                    required={index === 0}
                  />
                </div>
              ))}
            </div>
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
                  type="text"
                  value={formData.meta.players || ""}
                  onChange={(e) =>
                    updateNestedField("meta", "players", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
                  placeholder="2-6"
                />
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
      </div>
    </div>
  );
}
