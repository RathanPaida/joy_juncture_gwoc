// components/blog/BlogAdminPanel.tsx
'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, X, Save, Eye, EyeOff } from 'lucide-react';

interface Blog {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  coverImage?: string;
  featured: boolean;
  status: 'draft' | 'published';
  publishedDate?: string;
  createdBy: {
    userId: string;
    userName: string;
    userRole: 'admin' | 'user';
  };
}

interface BlogAdminPanelProps {
  blogs: Blog[];
  currentUser: {
    id: string;
    name: string;
    role: 'admin' | 'user';
    email: string;
  };
  categories: string[];
}

export default function BlogAdminPanel({ blogs, currentUser, categories }: BlogAdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: categories[0] || '',
    tags: '',
    coverImage: '',
    featured: false,
    status: 'draft' as 'draft' | 'published',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        author: {
          name: currentUser.name,
          role: currentUser.role,
        },
        createdBy: {
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        },
      };

      const url = editingBlog ? `/api/blogs/${editingBlog._id}` : '/api/blogs';
      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save blog');

      setMessage({ type: 'success', text: `Blog ${editingBlog ? 'updated' : 'created'} successfully!` });
      
      // Reset form
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: categories[0] || '',
        tags: '',
        coverImage: '',
        featured: false,
        status: 'draft',
      });
      setEditingBlog(null);
      setIsCreating(false);

      // Refresh page after 1 second
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save blog. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete blog');

      setMessage({ type: 'success', text: 'Blog deleted successfully!' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete blog. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      tags: blog.tags.join(', '),
      coverImage: blog.coverImage || '',
      featured: blog.featured,
      status: blog.status,
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: categories[0] || '',
      tags: '',
      coverImage: '',
      featured: false,
      status: 'draft',
    });
    setEditingBlog(null);
    setIsCreating(false);
  };

  return (
    <>
      {/* Floating Admin Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-2xl hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-110 group"
        title="Admin Panel"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Pencil className="w-6 h-6" />}
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full text-xs flex items-center justify-center font-bold">
          {blogs.length}
        </span>
      </button>

      {/* Admin Panel Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 z-40 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">Blog Management</h2>
              <p className="text-sm text-gray-400 mt-1">
                {isAdmin ? 'Admin Panel' : 'User Panel'} • {currentUser.name}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-red-500/20 border border-red-500/50 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Create/Edit Form */}
          {isCreating ? (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingBlog ? 'Edit Blog' : 'Create New Blog'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Strategy, Events, Tips"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-700 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="featured" className="text-sm text-gray-300">
                    Mark as Featured (Admin only)
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : editingBlog ? 'Update Blog' : 'Create Blog'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Blog
            </button>
          )}

          {/* Blog List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center justify-between">
              <span>Your Blogs</span>
              <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                {blogs.filter(b => isAdmin || b.createdBy.userId === currentUser.id).length} blogs
              </span>
            </h3>

            {blogs
              .filter(blog => isAdmin || blog.createdBy.userId === currentUser.id)
              .map((blog) => (
                <div
                  key={blog._id}
                  className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate">{blog.title}</h4>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{blog.excerpt}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {blog.status === 'published' ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                          {blog.status}
                        </span>
                        <span>•</span>
                        <span>{blog.category}</span>
                        {blog.featured && (
                          <>
                            <span>•</span>
                            <span className="text-orange-500 font-semibold">Featured</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          blog.createdBy.userRole === 'admin'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        }`}>
                          {blog.createdBy.userRole === 'admin' ? '👑 Admin' : '👤 User'}: {blog.createdBy.userName}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(isAdmin || blog.createdBy.userId === currentUser.id) && (
                        <>
                          <button
                            onClick={() => handleEdit(blog)}
                            className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            disabled={loading}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {blogs.filter(b => isAdmin || b.createdBy.userId === currentUser.id).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No blogs yet. Create your first one!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}