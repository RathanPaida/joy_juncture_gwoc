// app/admin/blog/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaBlog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaChartLine,
  FaExclamationCircle,
  FaCrown,
  FaUser,
  FaStar,
  FaTag,
  FaUpload,
} from "react-icons/fa";
import "./admin-blog.css";

interface Blog {
  _id?: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  images: string[];
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  createdBy: {
    userId: string;
    userName: string;
    userRole: "admin" | "user" | "viewer" | "editor" | "super_admin";
  };
  status: "draft" | "published";
  featured: boolean;
  readTime?: number;
  publishedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BlogStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  adminBlogs: number;
  userBlogs: number;
}

const BLOG_CATEGORIES = [
  "Game Stories & Experiences",
  "Event Highlights",
  "Strategy & Storytelling",
  "Community Features",
];

const AdminBlogPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "my-blogs" | "stats">("all");

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [showBlogModal, setShowBlogModal] = useState(false);

  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        checkAdminAccess();
      } else {
        router.push("/login?redirect=/admin/blog");
      }
    }
  }, [user, authLoading]);

  const checkAdminAccess = async () => {
    if (!user) {
      setAccessDenied(true);
      setAccessError("Please login to access admin panel");
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        setAccessDenied(true);
        setAccessError("Failed to get authentication token");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/check-access", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setAccessDenied(true);
        setAccessError(errorData.error || "Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setIsAdmin(data.role === "admin" || data.role === "super_admin" || data.role === "editor");

      fetchAllData();
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      setAccessDenied(true);
      setAccessError(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        console.error("No token available");
        return;
      }

      try {
        const blogsRes = await fetch("/api/admin/blog", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (blogsRes.ok) {
          const data = await blogsRes.json();
          setBlogs(data.blogs || []);
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
      }

      try {
        const statsRes = await fetch("/api/admin/blog/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlog = async (blog: Blog, imageFile?: File, additionalFiles?: File[]) => {
    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        alert("Authentication token not available");
        return;
      }

      const formData = new FormData();
      formData.append("blogData", JSON.stringify(blog));

      if (imageFile) {
        formData.append("coverImage", imageFile);
      }

      if (additionalFiles && additionalFiles.length > 0) {
        additionalFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      if (blog._id) {
        formData.append("blogId", blog._id);
      }

      const method = blog._id ? "PUT" : "POST";
      const url = blog._id ? `/api/admin/blog/${blog._id}` : "/api/admin/blog";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(blog._id ? "Blog updated successfully!" : "Blog created successfully!");
        setShowBlogModal(false);
        setEditingBlog(null);
        fetchAllData();
      } else {
        const errorMessage = data.error || "Unknown error occurred";
        alert(`Failed to save blog: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Error saving blog:", error);
      alert(`Failed to save blog: ${error.message}`);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog? This action cannot be undone.")) {
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        alert("Authentication token not available");
        return;
      }

      const response = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Blog deleted successfully!");
        fetchAllData();
      } else {
        const errorMessage = data.error || "Unknown error occurred";
        alert(`Failed to delete blog: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Error deleting blog:", error);
      alert(`Failed to delete blog: ${error.message}`);
    }
  };

  const canEditBlog = (blog: Blog) => {
    const currentUserId = auth.currentUser?.uid;

    if (
      blog.createdBy.userId === currentUserId ||
      isAdmin ||
      auth.currentUser?.email === "paidarajarathan@gmail.com"
    ) {
      return true;
    }

    if (isAdmin) {
      if (["admin", "super_admin", "editor"].includes(blog.createdBy.userRole)) {
        return true;
      }
      if (blog.createdBy.userRole === "user" && blog.status === "draft") {
        return true;
      }
    }

    return false;
  };

  const getFilteredBlogs = () => {
    let filtered = blogs;
    const currentUserId = auth.currentUser?.uid;

    if (activeTab === "my-blogs") {
      filtered = filtered.filter((b) => b.createdBy.userId === currentUserId);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((b) => b.status === filterStatus);
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((b) => b.category === filterCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.excerpt.toLowerCase().includes(query) ||
          b.createdBy.userName.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  if (authLoading || loading) {
    return (
      <div className="admin-blog-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="admin-blog-page">
        <div className="access-denied">
          <FaExclamationCircle className="error-icon" />
          <h1>Access Denied</h1>
          <p>{accessError}</p>
          <div className="access-denied-actions">
            <button onClick={() => router.push("/")}>Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const filteredBlogs = getFilteredBlogs();
  const currentUserId = auth.currentUser?.uid;
  const currentUserName = auth.currentUser?.displayName || auth.currentUser?.email || "User";

  return (
    <div className="admin-blog-page">
      <div className="admin-header">
        <h1>
          <FaBlog /> Blog Management
        </h1>
        <p>Create, edit, and manage blog posts</p>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
          <FaBlog /> All Blogs ({blogs.length})
        </button>
        <button className={activeTab === "my-blogs" ? "active" : ""} onClick={() => setActiveTab("my-blogs")}>
          <FaUser /> My Blogs ({blogs.filter((b) => b.createdBy.userId === currentUserId).length})
        </button>
        <button className={activeTab === "stats" ? "active" : ""} onClick={() => setActiveTab("stats")}>
          <FaChartLine /> Statistics
        </button>
      </div>

      <div className="admin-content">
        {(activeTab === "all" || activeTab === "my-blogs") && (
          <div className="blogs-section">
            <div className="section-header">
              <div className="header-left">
                <h2>{activeTab === "all" ? "All Blog Posts" : "My Blog Posts"}</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingBlog({
                      title: "",
                      excerpt: "",
                      content: "",
                      category: BLOG_CATEGORIES[0],
                      tags: [],
                      author: {
                        name: currentUserName,
                        role: isAdmin ? "admin" : "user",
                      },
                      createdBy: {
                        userId: currentUserId!,
                        userName: currentUserName,
                        userRole: isAdmin ? "admin" : "viewer",
                      },
                      status: "draft",
                      featured: false,
                    });
                    setShowBlogModal(true);
                  }}
                >
                  <FaPlus /> Create New Blog
                </button>
              </div>

              <div className="header-filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search blogs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="filter-select">
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                  <option value="all">All Categories</option>
                  {BLOG_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="blogs-list">
              {filteredBlogs.length === 0 ? (
                <div className="empty-state">
                  <FaBlog className="empty-icon" />
                  <p>No blogs found. Create your first one!</p>
                </div>
              ) : (
                filteredBlogs.map((blog) => (
                  <div key={blog._id} className="blog-card">
                    <div className="blog-image">
                      {blog.coverImage ? (
                        <img src={blog.coverImage} alt={blog.title} />
                      ) : (
                        <div className="placeholder-image">
                          <FaBlog />
                        </div>
                      )}
                      {blog.featured && (
                        <div className="featured-badge">
                          <FaStar /> Featured
                        </div>
                      )}
                    </div>

                    <div className="blog-content">
                      <div className="blog-header">
                        <h3>{blog.title}</h3>
                        <div className="blog-badges">
                          <span className={`status-badge ${blog.status}`}>
                            {blog.status === "published" ? <FaEye /> : <FaEyeSlash />}
                            {blog.status}
                          </span>
                          <span className={`creator-badge ${blog.createdBy.userRole}`}>
                            {["admin", "super_admin", "editor"].includes(blog.createdBy.userRole) ? (
                              <>
                                <FaCrown /> Admin
                              </>
                            ) : (
                              <>
                                <FaUser /> User
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <p className="blog-excerpt">{blog.excerpt}</p>

                      <div className="blog-meta">
                        <span className="category">
                          <FaTag /> {blog.category}
                        </span>
                        <span className="author">By: {blog.createdBy.userName}</span>
                        {blog.tags.length > 0 && (
                          <span className="tags">
                            Tags: {blog.tags.slice(0, 3).join(", ")}
                            {blog.tags.length > 3 && ` +${blog.tags.length - 3}`}
                          </span>
                        )}
                      </div>

                      {canEditBlog(blog) && (
                        <div className="blog-actions">
                          <button
                            className="btn-edit"
                            onClick={() => {
                              setEditingBlog(blog);
                              setShowBlogModal(true);
                            }}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button className="btn-danger" onClick={() => handleDeleteBlog(blog._id!)}>
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "stats" && stats && (
          <div className="stats-section">
            <h2>Blog Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <FaBlog className="stat-icon" />
                <h3>Total Blogs</h3>
                <p className="stat-value">{stats.totalBlogs}</p>
              </div>
              <div className="stat-card published">
                <FaEye className="stat-icon" />
                <h3>Published</h3>
                <p className="stat-value">{stats.publishedBlogs}</p>
              </div>
              <div className="stat-card draft">
                <FaEyeSlash className="stat-icon" />
                <h3>Drafts</h3>
                <p className="stat-value">{stats.draftBlogs}</p>
              </div>
              <div className="stat-card admin">
                <FaCrown className="stat-icon" />
                <h3>Admin Posts</h3>
                <p className="stat-value">{stats.adminBlogs}</p>
              </div>
              <div className="stat-card user">
                <FaUser className="stat-icon" />
                <h3>User Posts</h3>
                <p className="stat-value">{stats.userBlogs}</p>
              </div>
              <div className="stat-card views">
                <FaChartLine className="stat-icon" />
                <h3>Total Views</h3>
                <p className="stat-value">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showBlogModal && editingBlog && (
        <BlogModal
          blog={editingBlog}
          onSave={handleSaveBlog}
          onClose={() => {
            setShowBlogModal(false);
            setEditingBlog(null);
          }}
          isAdmin={isAdmin}
          categories={BLOG_CATEGORIES}
        />
      )}
    </div>
  );
};

const BlogModal: React.FC<{
  blog: Blog;
  onSave: (blog: Blog, imageFile?: File, additionalFiles?: File[]) => Promise<void>;
  onClose: () => void;
  isAdmin: boolean;
  categories: string[];
}> = ({ blog, onSave, onClose, isAdmin, categories }) => {
  const [formData, setFormData] = useState<Blog>({ ...blog, images: blog.images || [] });
  const [tagsInput, setTagsInput] = useState(blog.tags.join(", "));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(blog.coverImage || "");

  // New State for Additional Images
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>(
    blog.images || []
  );

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMultiImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);

      if (validFiles.length < newFiles.length) {
        alert("Some files were skipped because they exceed 5MB.");
      }

      setAdditionalFiles(prev => [...prev, ...validFiles]);

      // Generate previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAdditionalPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, coverImage: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAdditionalImage = (index: number) => {
    // Logic: existing images come first in additionalPreviews
    // If we remove an image that is NOT in additionalFiles, it means it's an existing image.
    // But we need to track WHICH images are retained.

    const existingImageCount = (formData.images || []).length;

    if (index < existingImageCount) {
      // It's an existing image
      const updatedImages = [...(formData.images || [])];
      updatedImages.splice(index, 1);
      setFormData(prev => ({ ...prev, images: updatedImages }));
      // We also need to remove it from previews
      setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // It's a new file
      const fileIndex = index - existingImageCount;
      setAdditionalFiles(prev => prev.filter((_, i) => i !== fileIndex));
      setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await onSave(
        {
          ...formData,
          tags,
        },
        imageFile || undefined,
        additionalFiles // Pass array of new files
      );
    } catch (error) {
      console.error("Error saving blog:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{blog._id ? "Edit" : "Create"} Blog Post</h3>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {/* Cover Image Upload */}
          <div className="form-group">
            <label>Cover Image</label>
            <div className="image-upload-section">
              {imagePreview ? (
                <div className="image-preview-container">
                  <div className="blog-image-preview">
                    <Image src={imagePreview} alt="Cover preview" fill className="preview-img" unoptimized />
                  </div>
                  <button type="button" className="btn-remove-image" onClick={removeImage}>
                    <FaTrash /> Remove Image
                  </button>
                </div>
              ) : (
                <div className="image-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                  <FaUpload size={32} />
                  <p>Click to upload cover image</p>
                  <span>PNG, JPG, WebP (Max 5MB)</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter blog title"
              required
            />
          </div>

          <div className="form-group">
            <label>Excerpt *</label>
            <textarea
              value={formData.excerpt || ""}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short description (150-200 characters)"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={formData.content || ""}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full blog content (supports Markdown)"
              rows={12}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "draft" | "published",
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Strategy, Events, Tips, etc." />
          </div>

          {isAdmin && (
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                <FaStar /> Mark as Featured (Admin only)
              </label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <FaSave /> {saving ? "Saving..." : blog._id ? "Update" : "Create"} Blog
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogPage;