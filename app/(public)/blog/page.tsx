// app/blog/page.tsx - FIXED getIdToken
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth"; // ADDED
import {
  Search,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Clock,
  User,
  Tag,
  Filter,
  Calendar,
  Star,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Bookmark,
} from "lucide-react";
import "./blog.css";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  createdBy: {
    userId: string;
    userName: string;
    userRole: "admin" | "user";
  };
  status: "draft" | "published";
  featured: boolean;
  readTime?: number;
  publishedDate: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogStats {
  totalBlogs: number;
  publishedBlogs: number;
  totalViews: number;
  totalLikes: number;
}

const CATEGORIES = [
  "All Categories",
  "Game Stories & Experiences",
  "Event Highlights",
  "Strategy & Storytelling",
  "Community Features",
];

const POPULAR_TAGS = [
  "Strategy",
  "Events",
  "Community",
  "Tips",
  "Beginners",
  "Advanced",
  "Game Night",
  "Corporate",
  "Team Building",
];

export default function BlogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const auth = getAuth(); // ADDED

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    totalBlogs: 0,
    publishedBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [likedBlogs, setLikedBlogs] = useState<Set<string>>(new Set());
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState<Set<string>>(
    new Set(),
  );

  // ADDED: Helper function
  const getFirebaseToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    return await currentUser.getIdToken();
  };

  useEffect(() => {
    fetchBlogs();
    fetchStats();
    if (user) {
      fetchUserInteractions();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortBlogs();
  }, [blogs, searchQuery, selectedCategory, selectedTag, sortBy]);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs");
      const data = await response.json();
      if (response.ok) {
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/blogs/stats");
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUserInteractions = async () => {
    if (!user) return;
    try {
      const token = await getFirebaseToken(); // CHANGED
      const response = await fetch("/api/blogs/interactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setLikedBlogs(new Set(data.likedBlogs || []));
        setBookmarkedBlogs(new Set(data.bookmarkedBlogs || []));
      }
    } catch (error) {
      console.error("Error fetching interactions:", error);
    }
  };

  const filterAndSortBlogs = () => {
    let filtered = [...blogs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.excerpt.toLowerCase().includes(query) ||
          blog.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((blog) => blog.category === selectedCategory);
    }

    if (selectedTag) {
      filtered = filtered.filter((blog) => blog.tags.includes(selectedTag));
    }

    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case "views":
        filtered.sort((a, b) => b.views - a.views);
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.publishedDate).getTime() -
            new Date(b.publishedDate).getTime(),
        );
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.publishedDate).getTime() -
            new Date(a.publishedDate).getTime(),
        );
    }

    setFilteredBlogs(filtered);
  };

  const handleLike = async (blogId: string) => {
    if (!user) {
      alert("Please login to like articles");
      return;
    }

    try {
      const token = await getFirebaseToken(); // CHANGED
      const isLiked = likedBlogs.has(blogId);

      const response = await fetch("/api/blogs/like", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blogId, action: isLiked ? "unlike" : "like" }),
      });

      if (response.ok) {
        setLikedBlogs((prev) => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(blogId);
          } else {
            newSet.add(blogId);
          }
          return newSet;
        });

        setBlogs(
          blogs.map((blog) =>
            blog._id === blogId
              ? { ...blog, likes: blog.likes + (isLiked ? -1 : 1) }
              : blog,
          ),
        );
      }
    } catch (error) {
      console.error("Error liking blog:", error);
    }
  };

  const handleBookmark = async (blogId: string) => {
    if (!user) {
      alert("Please login to bookmark articles");
      return;
    }

    try {
      const token = await getFirebaseToken(); // CHANGED
      const isBookmarked = bookmarkedBlogs.has(blogId);

      const response = await fetch("/api/blogs/bookmark", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blogId,
          action: isBookmarked ? "remove" : "add",
        }),
      });

      if (response.ok) {
        setBookmarkedBlogs((prev) => {
          const newSet = new Set(prev);
          if (isBookmarked) {
            newSet.delete(blogId);
          } else {
            newSet.add(blogId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error bookmarking blog:", error);
    }
  };

  const handleShare = (blog: Blog) => {
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url: `${window.location.origin}/blog/${blog.slug}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/blog/${blog.slug}`,
      );
      alert("Link copied to clipboard!");
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!user || !confirm("Are you sure you want to delete this article?"))
      return;

    try {
      const token = await getFirebaseToken(); // CHANGED
      const response = await fetch(`/api/admin/blog/${blogId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setBlogs(blogs.filter((b) => b._id !== blogId));
        alert("Article deleted successfully!");
      } else {
        const data = await response.json();
        alert(`Failed to delete: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete article");
    }
  };

  const canEditBlog = (blog: Blog) => {
    if (!user) return false;
    return (
      blog.createdBy.userId === user.uid ||
      user.email === "paidarajarathan@gmail.com"
    );
  };

  const featuredBlogs = blogs.filter((b) => b.featured).slice(0, 3);

  if (loading) {
    return (
      <div className="blog-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <h1 className="blog-title">Game Stories & Strategies</h1>
        <p className="blog-subtitle">
          Discover expert gameplay guides, community stories, and winning
          strategies from players worldwide
        </p>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search articles, tags, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{stats.totalBlogs}</span>
            <span className="stat-label">Total Articles</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.publishedBlogs}</span>
            <span className="stat-label">Published</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {stats.totalViews.toLocaleString()}
            </span>
            <span className="stat-label">Total Views</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalLikes}</span>
            <span className="stat-label">Total Likes</span>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="tags-wrapper">
          {POPULAR_TAGS.slice(0, 6).map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
              className={`tag-btn ${selectedTag === tag ? "active" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Blogs */}
      {featuredBlogs.length > 0 &&
        !searchQuery &&
        !selectedTag &&
        selectedCategory === "All Categories" && (
          <section className="featured-section">
            <div className="section-header">
              <Star size={28} style={{ color: "var(--primary)" }} />
              <h2 className="section-title">Featured Articles</h2>
            </div>

            <div className="featured-grid">
              {featuredBlogs.map((blog) => (
                <div
                  key={blog._id}
                  className="featured-card"
                  onClick={() => router.push(`/blog/${blog.slug}`)}
                >
                  <div className="featured-image">
                    <img src={blog.coverImage} alt={blog.title} />
                    <div className="featured-badge">FEATURED</div>
                  </div>

                  <div className="featured-content">
                    <span className="category-tag">{blog.category}</span>
                    <h3 className="featured-title">{blog.title}</h3>
                    <p className="featured-excerpt">{blog.excerpt}</p>

                    <div className="featured-meta">
                      <div className="meta-item">
                        <Heart size={14} />
                        {blog.likes}
                      </div>
                      <div className="meta-item">
                        <Eye size={14} />
                        {blog.views}
                      </div>
                      <div className="meta-item">
                        <Clock size={14} />
                        {blog.readTime} min
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Categories */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <Filter size={20} />
              Categories
            </h3>
            <div className="category-list">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <Tag size={20} />
              Popular Tags
            </h3>
            <div className="tag-cloud">
              {POPULAR_TAGS.map((tag) => (
                <span
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                  className={`tag-item ${selectedTag === tag ? "active" : ""}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="sidebar-card cta-card">
            <h3 className="sidebar-title">Share Your Story</h3>
            <p className="cta-text">
              Got an amazing game story or strategy tip? Share it with our
              community!
            </p>
            <button
              className="btn-primary"
              onClick={() => router.push("/blog/create")}
            >
              <Plus size={18} />
              Write Article
            </button>
          </div>
        </aside>

        {/* Blog List */}
        <main className="blogs-main">
          <div className="blogs-header">
            <div className="header-left">
              <h2>
                {selectedTag
                  ? `Tagged: ${selectedTag}`
                  : selectedCategory !== "All Categories"
                    ? selectedCategory
                    : "All Articles"}
              </h2>
              <p className="results-count">
                {filteredBlogs.length} article
                {filteredBlogs.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="header-right">
              <button className="refresh-btn" onClick={fetchBlogs}>
                <RefreshCw size={16} />
                Refresh
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="views">Most Viewed</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Blog Cards */}
          <div className="blogs-grid">
            {filteredBlogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No articles found</h3>
                <p className="empty-text">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try different keywords.`
                    : "Try adjusting your filters or search query"}
                </p>
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <div key={blog._id} className="blog-card">
                  <div className="blog-card-content">
                    <div
                      className="blog-image-wrapper"
                      onClick={() => router.push(`/blog/${blog.slug}`)}
                    >
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="blog-image"
                      />
                      {blog.featured && (
                        <div className="blog-badge">
                          <Star size={12} />
                          FEATURED
                        </div>
                      )}
                    </div>

                    <div className="blog-info">
                      <div className="blog-header">
                        <span className="blog-category">{blog.category}</span>
                        <span className="blog-date">
                          <Calendar size={12} />
                          {new Date(blog.publishedDate).toLocaleDateString()}
                        </span>
                        <span className="blog-date">
                          <Clock size={12} />
                          {blog.readTime} min
                        </span>
                      </div>

                      <h3
                        className="blog-title"
                        onClick={() => router.push(`/blog/${blog.slug}`)}
                      >
                        {blog.title}
                      </h3>
                      <p className="blog-excerpt">{blog.excerpt}</p>

                      <div className="blog-tags">
                        {blog.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="blog-tag">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="blog-footer">
                        <div className="blog-author">
                          <img
                            src={blog.author.avatar || "/default-avatar.png"}
                            alt={blog.author.name}
                            className="author-avatar"
                          />
                          <div className="author-info">
                            <span className="author-name">
                              {blog.author.name}
                            </span>
                            <span className="author-role">
                              {blog.author.role}
                            </span>
                          </div>
                        </div>

                        <div className="blog-actions">
                          <button
                            onClick={() => handleLike(blog._id)}
                            className={`action-btn ${likedBlogs.has(blog._id) ? "liked" : ""}`}
                          >
                            <Heart
                              size={16}
                              fill={
                                likedBlogs.has(blog._id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                            {blog.likes}
                          </button>

                          <button
                            onClick={() => handleBookmark(blog._id)}
                            className={`action-btn ${bookmarkedBlogs.has(blog._id) ? "bookmarked" : ""}`}
                          >
                            <Bookmark
                              size={16}
                              fill={
                                bookmarkedBlogs.has(blog._id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>

                          <button
                            onClick={() => handleShare(blog)}
                            className="action-btn"
                          >
                            <Share2 size={16} />
                          </button>

                          {user && (
                            <>
                              {/* Case 1: User's own blog - always show buttons */}
                              {blog.createdBy.userId === user.uid ? (
                                <>
                                  {/* <button 
            className="action-btn edit-btn"
            onClick={() => router.push(`/admin/blog?edit=${blog._id}`)}
          >
            <Edit size={16} />
          </button> */}
                                  <button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDelete(blog._id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              ) : null
                              // /* Case 2: Admin reviewing user-created draft */
                              // ['admin', 'super_admin', 'editor'].includes(role) &&
                              // blog.createdBy.userRole === 'user' &&
                              // blog.status === 'draft' ? (
                              //   <>
                              //     <button
                              //       className="action-btn edit-btn"
                              //       onClick={() => router.push(`/admin/blog?edit=${blog._id}`)}
                              //       title="Review user-submitted draft"
                              //     >
                              //       <Edit size={16} />
                              //     </button>
                              //     <button
                              //       className="action-btn delete-btn"
                              //       onClick={() => handleDelete(blog._id)}
                              //       title="Delete user-submitted draft"
                              //     >
                              //       <Trash2 size={16} />
                              //     </button>
                              //   </>
                              // ) : null
                              }
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
