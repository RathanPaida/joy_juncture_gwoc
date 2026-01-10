// app/blog/create/page.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye } from "lucide-react";
import "./blog-create.css";

const CATEGORIES = [
  "Game Stories & Experiences",
  "Event Highlights",
  "Strategy & Storytelling",
  "Community Features",
];

export default function CreateBlogPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: CATEGORIES[0],
    tags: "",
    coverImage: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to create a blog post");
      router.push("/login");
      return;
    }

    if (!formData.title || !formData.excerpt || !formData.content) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken();

      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await fetch("/api/admin/blog", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          tags,
          coverImage:
            formData.coverImage ||
            "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800",
          status: "draft",
          featured: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          "Blog post created successfully! It will be reviewed before publishing.",
        );
        router.push("/blog");
      } else {
        alert(`Failed to create blog: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      alert("Failed to create blog post");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="create-blog-page">
        <div className="auth-required">
          <h2>Login Required</h2>
          <p>Please login to create a blog post</p>
          <button onClick={() => router.push("/login")}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-blog-page">
      <div className="create-blog-header">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Create Your Story</h1>
        <p>Share your gaming experiences with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="blog-form">
        <div className="form-section">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter an engaging title..."
            required
            maxLength={100}
          />
        </div>

        <div className="form-section">
          <label htmlFor="excerpt">Short Description *</label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) =>
              setFormData({ ...formData, excerpt: e.target.value })
            }
            placeholder="Write a brief description (150-200 characters)"
            rows={3}
            required
            maxLength={200}
          />
          <span className="char-count">{formData.excerpt.length}/200</span>
        </div>

        <div className="form-section">
          <label htmlFor="content">Your Story *</label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="Share your gaming story, strategy, or experience..."
            rows={15}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-section">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="Strategy, Tips, Events (comma-separated)"
            />
          </div>
        </div>

        <div className="form-section">
          <label htmlFor="coverImage">Cover Image URL (optional)</label>
          <input
            id="coverImage"
            type="url"
            value={formData.coverImage}
            onChange={(e) =>
              setFormData({ ...formData, coverImage: e.target.value })
            }
            placeholder="https://example.com/image.jpg"
          />
          <small>Leave empty for default image</small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>Creating...</>
            ) : (
              <>
                <Save size={18} />
                Create Blog Post
              </>
            )}
          </button>
        </div>

        <div className="form-note">
          <Eye size={16} />
          <p>
            Your blog post will be saved as a draft and reviewed before
            publishing.
          </p>
        </div>
      </form>
    </div>
  );
}
