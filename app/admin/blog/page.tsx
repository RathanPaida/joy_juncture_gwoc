// app/admin/blog/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaBlog, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaEye, FaEyeSlash,
  FaChartLine, FaExclamationCircle, FaCrown, FaUser, FaStar, FaTag
} from 'react-icons/fa';
import './admin-blog.css';

interface Blog {
  _id?: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
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
    userRole: 'admin' | 'user';
  };
  status: 'draft' | 'published';
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
  'Game Stories & Experiences',
  'Event Highlights',
  'Strategy & Storytelling',
  'Community Features'
];

const AdminBlogPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'my-blogs' | 'stats'>('all');
  
  // Data states
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Edit states
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        console.log('User authenticated, checking admin access...');
        checkAdminAccess();
      } else {
        console.log('No user, redirecting to login...');
        router.push('/login?redirect=/admin/blog');
      }
    }
  }, [user, authLoading]);

  const checkAdminAccess = async () => {
    if (!user) {
      setAccessDenied(true);
      setAccessError('Please login to access admin panel');
      return;
    }

    try {
      console.log('Getting Firebase token...');
      const token = await user.getIdToken();
      
      console.log('Checking admin access...');
      const response = await fetch('/api/admin/check-access', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Admin check response:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Access denied:', errorData);
        
        setAccessDenied(true);
        setAccessError(errorData.error || 'Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Admin access granted:', data);
      setIsAdmin(data.role === 'admin' || data.role === 'super_admin');
      
      // Access granted, fetch all data
      fetchAllData();
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      setAccessDenied(true);
      setAccessError(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await user!.getIdToken();
      
      console.log('Fetching blog data...');
      
      // Fetch blogs
      try {
        const blogsRes = await fetch('/api/admin/blog', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (blogsRes.ok) {
          const data = await blogsRes.json();
          setBlogs(data.blogs || []);
          console.log('Blogs loaded:', data.blogs?.length);
        }
      } catch (err) {
        console.error('Error fetching blogs:', err);
      }

      // Fetch stats
      try {
        const statsRes = await fetch('/api/admin/blog/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
          console.log('Stats loaded');
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlog = async (blog: Blog) => {
    try {
      const token = await user!.getIdToken();
      const method = blog._id ? 'PUT' : 'POST';
      const url = blog._id 
        ? `/api/admin/blog/${blog._id}`
        : '/api/admin/blog';

      console.log('Saving blog:', { method, url, blog });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(blog)
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (response.ok) {
        alert('Blog saved successfully!');
        setShowBlogModal(false);
        setEditingBlog(null);
        fetchAllData();
      } else {
        alert(`Failed to save blog: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Failed to save blog');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const token = await user!.getIdToken();
      console.log('Deleting blog:', id);

      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Delete response:', data);

      if (response.ok) {
        alert('Blog deleted successfully!');
        fetchAllData();
      } else {
        alert(`Failed to delete blog: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  const canEditBlog = (blog: Blog) => {
    if (isAdmin) return true;
    return blog.createdBy.userId === user?.uid;
  };

  const getFilteredBlogs = () => {
    let filtered = blogs;

    // Filter by tab
    if (activeTab === 'my-blogs') {
      filtered = filtered.filter(b => b.createdBy.userId === user?.uid);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(b => b.category === filterCategory);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
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
            <button onClick={() => router.push('/')}>Go Home</button>
            <button onClick={() => router.push('/login')}>Login</button>
            <button onClick={() => router.push('/admin/setup')}>Setup Admin</button>
          </div>
          <div className="help-text">
            <h3>Need admin access?</h3>
            <p>1. Make sure you're logged in</p>
            <p>2. Your account must have 'admin' or 'super_admin' role</p>
            <p>3. Visit /admin/setup to make yourself admin (first time only)</p>
            <p>4. Or update your role in MongoDB directly</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredBlogs = getFilteredBlogs();

  return (
    <div className="admin-blog-page">
      <div className="admin-header">
        <h1><FaBlog /> Blog Management</h1>
        <p>Create, edit, and manage blog posts</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          <FaBlog /> All Blogs ({blogs.length})
        </button>
        <button
          className={activeTab === 'my-blogs' ? 'active' : ''}
          onClick={() => setActiveTab('my-blogs')}
        >
          <FaUser /> My Blogs ({blogs.filter(b => b.createdBy.userId === user?.uid).length})
        </button>
        <button
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          <FaChartLine /> Statistics
        </button>
      </div>

      <div className="admin-content">
        {/* Blogs Tab */}
        {(activeTab === 'all' || activeTab === 'my-blogs') && (
          <div className="blogs-section">
            <div className="section-header">
              <div className="header-left">
                <h2>{activeTab === 'all' ? 'All Blog Posts' : 'My Blog Posts'}</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingBlog({
                      title: '',
                      excerpt: '',
                      content: '',
                      category: BLOG_CATEGORIES[0],
                      tags: [],
                      author: {
                        name: user?.displayName || user?.email || 'User',
                        role: isAdmin ? 'admin' : 'user'
                      },
                      createdBy: {
                        userId: user!.uid,
                        userName: user?.displayName || user?.email || 'User',
                        userRole: isAdmin ? 'admin' : 'user'
                      },
                      status: 'draft',
                      featured: false
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
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  {BLOG_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
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
                            {blog.status === 'published' ? <FaEye /> : <FaEyeSlash />}
                            {blog.status}
                          </span>
                          <span className={`creator-badge ${blog.createdBy.userRole}`}>
                            {blog.createdBy.userRole === 'admin' ? (
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
                        <span className="author">
                          By: {blog.createdBy.userName}
                        </span>
                        {blog.tags.length > 0 && (
                          <span className="tags">
                            Tags: {blog.tags.slice(0, 3).join(', ')}
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
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteBlog(blog._id!)}
                          >
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

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
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

      {/* Blog Modal */}
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

// Blog Modal Component
const BlogModal: React.FC<{
  blog: Blog;
  onSave: (blog: Blog) => void;
  onClose: () => void;
  isAdmin: boolean;
  categories: string[];
}> = ({ blog, onSave, onClose, isAdmin, categories }) => {
  const [formData, setFormData] = useState(blog);
  const [tagsInput, setTagsInput] = useState(blog.tags.join(', '));

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({
      ...formData,
      tags
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{blog._id ? 'Edit' : 'Create'} Blog Post</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter blog title"
              required
            />
          </div>

          <div className="form-group">
            <label>Excerpt *</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short description (150-200 characters)"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Full blog content (supports Markdown)"
              rows={12}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Strategy, Events, Tips, etc."
            />
          </div>

          <div className="form-group">
            <label>Cover Image URL</label>
            <input
              type="url"
              value={formData.coverImage || ''}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {isAdmin && (
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <FaStar /> Mark as Featured (Admin only)
              </label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            <FaSave /> {blog._id ? 'Update' : 'Create'} Blog
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogPage;