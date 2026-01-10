// app/admin/community/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  Search, Filter, Trash2, Eye, Shield, MessageSquare,
  User, Clock, TrendingUp, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Pin, AlertTriangle, Archive, ArchiveRestore
} from "lucide-react";
import './community-admin.css';

interface Discussion {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorId: string;
  replies: number;
  likes: number;
  isHot: boolean;
  isPinned: boolean;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  tags: string[];
}

export default function AdminCommunityPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussions, setSelectedDiscussions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async () => {
    if (isAdmin) {
      router.push("/admin/community");
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch("/api/user/role", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        router.push("/community");
        return;
      }

      const data = await response.json();
      const userRole = data.success ? data.role : data.role;
      
      if (!['admin', 'super_admin'].includes(userRole)) {
        router.push("/community");
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin role:", error);
      router.push("/community");
    }
  };

  const fetchAdminDiscussions = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchQuery
      });

      const response = await fetch(`/api/admin/discussions?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        setDiscussions(data.discussions);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching admin discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated bulk actions with unarchive
  const handleBulkAction = async (action: 'delete' | 'archive' | 'unarchive' | 'pin' | 'unpin') => {
    if (selectedDiscussions.length === 0) return;

    const actionText = action === 'unarchive' ? 'unarchive' : action;
    const confirmMessage = `Are you sure you want to ${actionText} ${selectedDiscussions.length} discussion(s)?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Map 'unarchive' to 'restore' for the API
      const apiAction = action === 'unarchive' ? 'restore' : action;

      const response = await fetch("/api/admin/discussions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: apiAction,
          discussionIds: selectedDiscussions
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully ${actionText}d ${selectedDiscussions.length} discussion(s)`);
        setSelectedDiscussions([]);
        fetchAdminDiscussions();
      } else {
        alert(`Failed to ${actionText}: ${data.error}`);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert(`Failed to perform ${actionText} action`);
    }
  };

  // Single discussion action
  const handleSingleAction = async (discussionId: string, action: 'delete' | 'archive' | 'unarchive' | 'pin' | 'unpin') => {
    const actionText = action === 'unarchive' ? 'unarchive' : action;
    const confirmMessage = `Are you sure you want to ${actionText} this discussion?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Map 'unarchive' to 'restore' for the API
      const apiAction = action === 'unarchive' ? 'restore' : action;

      const response = await fetch("/api/admin/discussions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: apiAction,
          discussionIds: [discussionId]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully ${actionText}d discussion`);
        fetchAdminDiscussions();
      } else {
        alert(`Failed to ${actionText}: ${data.error}`);
      }
    } catch (error) {
      console.error("Error performing action:", error);
      alert(`Failed to perform ${actionText} action`);
    }
  };

  const toggleSelection = (discussionId: string) => {
    if (selectedDiscussions.includes(discussionId)) {
      setSelectedDiscussions(selectedDiscussions.filter(id => id !== discussionId));
    } else {
      setSelectedDiscussions([...selectedDiscussions, discussionId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDiscussions.length === discussions.length) {
      setSelectedDiscussions([]);
    } else {
      setSelectedDiscussions(discussions.map(d => d._id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if selected discussions are archived
  const hasArchivedSelected = selectedDiscussions.some(id => 
    discussions.find(d => d._id === id)?.status === 'archived'
  );

  // Check if selected discussions are active
  const hasActiveSelected = selectedDiscussions.some(id => 
    discussions.find(d => d._id === id)?.status === 'active'
  );

  useEffect(() => {
    checkAdminRole();
  }, [authUser]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminDiscussions();
    }
  }, [currentPage, statusFilter, searchQuery, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">
          <Shield size={24} />
          Community Management
        </h1>
        <p className="admin-subtitle">
          Manage discussions, moderate content, and oversee community activity
        </p>
      </div>

      {/* Stats Overview */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <MessageSquare size={20} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">
              {discussions.filter(d => d.status === 'active').length}
            </h3>
            <p className="stat-label">Active Discussions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon hot">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">
              {discussions.filter(d => d.isHot).length}
            </h3>
            <p className="stat-label">Hot Discussions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pinned">
            <Pin size={20} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">
              {discussions.filter(d => d.isPinned).length}
            </h3>
            <p className="stat-label">Pinned</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon archived">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">
              {discussions.filter(d => d.status === 'archived').length}
            </h3>
            <p className="stat-label">Archived</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="admin-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="deleted">Deleted</option>
          </select>

          <select
            className="filter-select"
            onChange={(e) => setCurrentPage(1)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDiscussions.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span className="selected-count">
              {selectedDiscussions.length} selected
            </span>
          </div>
          <div className="bulk-buttons">
            <button
              className="bulk-btn pin-btn"
              onClick={() => handleBulkAction('pin')}
            >
              <Pin size={16} />
              Pin
            </button>
            <button
              className="bulk-btn unpin-btn"
              onClick={() => handleBulkAction('unpin')}
            >
              <Pin size={16} />
              Unpin
            </button>
            {hasActiveSelected && (
              <button
                className="bulk-btn archive-btn"
                onClick={() => handleBulkAction('archive')}
              >
                <Archive size={16} />
                Archive
              </button>
            )}
            {hasArchivedSelected && (
              <button
                className="bulk-btn restore-btn"
                onClick={() => handleBulkAction('unarchive')}
              >
                <ArchiveRestore size={16} />
                Unarchive
              </button>
            )}
            <button
              className="bulk-btn delete-btn"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Discussions Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading discussions...</p>
          </div>
        ) : discussions.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <h3>No discussions found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th className="select-cell">
                  <input
                    type="checkbox"
                    checked={selectedDiscussions.length === discussions.length && discussions.length > 0}
                    onChange={toggleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th>Discussion</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discussions.map((discussion) => (
                <tr key={discussion._id}>
                  <td className="select-cell">
                    <input
                      type="checkbox"
                      checked={selectedDiscussions.includes(discussion._id)}
                      onChange={() => toggleSelection(discussion._id)}
                      className="checkbox"
                    />
                  </td>
                  <td className="discussion-cell">
                    <div className="discussion-info">
                      <div className="discussion-title">
                        {discussion.isPinned && (
                          <Pin size={12} className="pinned-icon" />
                        )}
                        {discussion.title}
                      </div>
                      <div className="discussion-meta">
                        <span className="meta-item">
                          <MessageSquare size={12} />
                          {discussion.replies} replies
                        </span>
                        <span className="meta-item">
                          <TrendingUp size={12} />
                          {discussion.likes} likes
                        </span>
                        {discussion.isHot && (
                          <span className="hot-badge">Hot</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="author-cell">
                    <div className="author-info">
                      <User size={14} />
                      {discussion.authorName}
                    </div>
                  </td>
                  <td className="category-cell">
                    <span className="category-badge">
                      {discussion.category}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${discussion.status}`}>
                      {discussion.status === 'active' && <CheckCircle size={12} />}
                      {discussion.status === 'archived' && <AlertTriangle size={12} />}
                      {discussion.status === 'deleted' && <XCircle size={12} />}
                      {discussion.status.charAt(0).toUpperCase() + discussion.status.slice(1)}
                    </span>
                  </td>
                  <td className="date-cell">
                    <div className="date-info">
                      <Clock size={12} />
                      {formatDate(discussion.createdAt)}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn"
                        onClick={() => router.push(`/community/discussion/${discussion._id}`)}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="action-btn pin-btn"
                        onClick={() => handleSingleAction(discussion._id, discussion.isPinned ? 'unpin' : 'pin')}
                        title={discussion.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin size={14} />
                      </button>
                      {discussion.status === 'active' && (
                        <button
                          className="action-btn archive-btn"
                          onClick={() => handleSingleAction(discussion._id, 'archive')}
                          title="Archive"
                        >
                          <Archive size={14} />
                        </button>
                      )}
                      {discussion.status === 'archived' && (
                        <button
                          className="action-btn restore-btn"
                          onClick={() => handleSingleAction(discussion._id, 'unarchive')}
                          title="Unarchive"
                        >
                          <ArchiveRestore size={14} />
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleSingleAction(discussion._id, 'delete')}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="page-dots">...</span>
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}