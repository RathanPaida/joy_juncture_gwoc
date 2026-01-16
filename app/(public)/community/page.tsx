"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import {
  Trophy,
  Users,
  Gift,
  MessageSquare,
  TrendingUp,
  Star,
  Calendar,
  Award,
  ChevronRight,
  Plus,
  Flame,
  Clock,
  User,
  X,
  Trash2,
  Edit,
  Shield,
  Pin,
} from "lucide-react";
import "./community.css";
import CommunityScroll from "@/app/components/CommunityScroll";

interface Reply {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  replies: Reply[];
  likes: number;
  likedBy: string[];
  isHot: boolean;
  isPinned: boolean;
  tags: string[];
  viewCount: number;
  status: "active" | "archived" | "deleted";
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  participants: number;
  type: string;
}

export default function CommunityPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  // New discussion form
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
    category: "General",
    tags: "",
  });

  // Sample events data
  const events: Event[] = [
    {
      id: 1,
      title: "Friday Night Virtual Game Tournament",
      date: "Dec 15",
      time: "8:00 PM EST",
      participants: 42,
      type: "Tournament",
    },
    {
      id: 2,
      title: "Live Q&A with Game Designer",
      date: "Dec 18",
      time: "7:30 PM EST",
      participants: 87,
      type: "Workshop",
    },
    {
      id: 3,
      title: "Community Awards Ceremony",
      date: "Dec 22",
      time: "6:00 PM EST",
      participants: 120,
      type: "Social",
    },
  ];

  // Categories for filtering
  const categories = [
    "all",
    "Game Strategy",
    "Tips & Tricks",
    "Community",
    "News",
    "General",
  ];

  // Fetch discussions
  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/community/discussions?category=${activeFilter === "all" ? "" : activeFilter}&sort=${sortBy}`,
      );
      const data = await response.json();

      if (data.success) {
        // Sort pinned discussions to top
        const sortedDiscussions = data.discussions.sort(
          (a: Discussion, b: Discussion) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
          },
        );

        setDiscussions(sortedDiscussions);
      }
    } catch (error) {
      console.error("Error fetching discussions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check user role
  const checkUserRole = async () => {
    if (!authUser) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch("/api/user/role", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Failed to fetch user role");
        return;
      }

      const data = await response.json();

      // Handle both response formats
      if (data.success) {
        setIsAdmin(["admin", "super_admin"].includes(data.role));
      } else if (data.role) {
        // Alternative format
        setIsAdmin(["admin", "super_admin"].includes(data.role));
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  // Create new discussion
  const handleCreateDiscussion = async () => {
    if (!authUser) {
      router.push("/login?redirect=/community");
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const tagsArray = newDiscussion.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch("/api/community/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newDiscussion.title,
          content: newDiscussion.content,
          category: newDiscussion.category,
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setNewDiscussion({
          title: "",
          content: "",
          category: "General",
          tags: "",
        });
        fetchDiscussions(); // Refresh list

        // Show success message
        alert(`Discussion created! ${data.message}`);
      } else {
        alert(data.error || "Failed to create discussion");
      }
    } catch (error) {
      console.error("Error creating discussion:", error);
      alert("Failed to create discussion");
    }
  };

  // Delete discussion
  const handleDeleteDiscussion = async (discussionId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch(
        `/api/community/discussions/${discussionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();

      if (data.success) {
        setShowDeleteConfirm(null);
        fetchDiscussions(); // Refresh list
        alert("Discussion deleted successfully");
      } else {
        alert(data.error || "Failed to delete discussion");
      }
    } catch (error) {
      console.error("Error deleting discussion:", error);
      alert("Failed to delete discussion");
    }
  };

  // Toggle pin discussion (admin only)
  const handleTogglePin = async (
    discussionId: string,
    currentlyPinned: boolean,
  ) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch(
        `/api/community/discussions/${discussionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isPinned: !currentlyPinned }),
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchDiscussions(); // Refresh list
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;

    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchDiscussions();
    if (authUser) {
      checkUserRole();
    }
  }, [activeFilter, sortBy, authUser]);

  return (
    <main className="community-page bg-[#050505]">
      {/* Scrollytelling Hero */}
      <CommunityScroll />


      {/* Stats Section */}
      <section className="community-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">5,847</h3>
                <p className="stat-label">Active Members</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <MessageSquare size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{discussions.length}</h3>
                <p className="stat-label">Active Discussions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Trophy size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">238</h3>
                <p className="stat-label">Events Hosted</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Gift size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">1.2M+</h3>
                <p className="stat-label">JJ Points Earned</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid Section */}
      <section id="discussions" className="content-grid-section relative z-10 bg-[#050505] -mt-20 pt-32">
        <div className="container">
          <div className="content-grid">
            {/* Discussions Column */}
            <div className="discussions-column">
              <div className="column-header">
                <div className="header-left">
                  <h2 className="column-title">Discussions</h2>
                  <p className="column-subtitle">
                    Join the conversation with fellow community members
                  </p>
                </div>

                <div className="header-actions">
                  {/* Sort Dropdown */}
                  <select
                    className="sort-dropdown"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="popular">Most Popular</option>
                    <option value="hot">Hot</option>
                  </select>

                  {/* New Discussion Button */}
                  <button
                    className="new-discussion-btn"
                    onClick={() => {
                      if (!authUser) {
                        router.push("/login?redirect=/community");
                      } else {
                        setShowCreateModal(true);
                      }
                    }}
                  >
                    <Plus size={16} />
                    New Discussion
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              <div className="category-filters">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-filter ${activeFilter === category ? "active" : ""}`}
                    onClick={() => setActiveFilter(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Discussions List */}
              <div className="discussions-list">
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading discussions...</p>
                  </div>
                ) : discussions.length === 0 ? (
                  <div className="empty-state">
                    <MessageSquare size={48} />
                    <h3>No discussions yet</h3>
                    <p>Be the first to start a conversation!</p>
                    <button
                      className="primary-cta-btn"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Start First Discussion
                    </button>
                  </div>
                ) : (
                  discussions.map((discussion) => (
                    <div
                      key={discussion._id}
                      className={`discussion-card ${discussion.isPinned ? "pinned" : ""}`}
                      onClick={(e) => {
                        // Check if click is on action button or its children
                        const target = e.target as HTMLElement;
                        const isActionButton =
                          target.closest(".discussion-actions") ||
                          target.closest(".action-btn") ||
                          target.closest(".pinned-badge");

                        if (!isActionButton) {
                          router.push(
                            `/community/discussion/${discussion._id}`,
                          );
                        }
                      }}
                    >
                      {discussion.isPinned && (
                        <div className="pinned-badge">
                          <Pin size={12} />
                          Pinned
                        </div>
                      )}

                      <div className="discussion-header">
                        <span
                          className={`discussion-category ${discussion.isHot ? "hot" : ""}`}
                        >
                          {discussion.isHot && <Flame size={12} />}
                          {discussion.category}
                        </span>

                        <div className="discussion-actions">
                          {/* Admin Controls */}
                          {isAdmin && (
                            <>
                              <button
                                className="action-btn pin-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePin(
                                    discussion._id,
                                    discussion.isPinned,
                                  );
                                }}
                                title={discussion.isPinned ? "Unpin" : "Pin"}
                              >
                                <Pin size={14} />
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(discussion._id);
                                }}
                                title="Delete (Admin)"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}

                          {/* Author Delete Button */}
                          {authUser &&
                            discussion.authorId === authUser.uid &&
                            !isAdmin && (
                              <button
                                className="action-btn delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(discussion._id);
                                }}
                                title="Delete Your Discussion"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                        </div>
                      </div>

                      <h3 className="discussion-title">{discussion.title}</h3>
                      <p className="discussion-preview">
                        {discussion.content.length > 150
                          ? `${discussion.content.substring(0, 150)}...`
                          : discussion.content}
                      </p>

                      <div className="discussion-meta">
                        <span className="meta-item author">
                          <User size={14} />
                          {discussion.authorName}
                        </span>
                        <span className="meta-item">
                          <MessageSquare size={14} />
                          {discussion.replies?.length || 0} replies
                        </span>
                        <span className="meta-item">
                          <TrendingUp size={14} />
                          {discussion.likes || 0} likes
                        </span>
                        <span className="meta-item">
                          <Clock size={14} />
                          {formatDate(discussion.createdAt)}
                        </span>
                      </div>

                      {discussion.tags.length > 0 && (
                        <div className="discussion-tags">
                          {discussion.tags.map((tag, index) => (
                            <span key={index} className="tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Events Column */}
            <div className="events-column">
              <div className="column-header">
                <h2 className="column-title">Upcoming Events</h2>
                <p className="column-subtitle">
                  Don't miss out on community activities
                </p>
              </div>

              <div className="events-list">
                {events.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-date">
                      <span className="date-day">
                        {event.date.split(" ")[1]}
                      </span>
                      <span className="date-month">
                        {event.date.split(" ")[0]}
                      </span>
                    </div>
                    <div className="event-content">
                      <h3 className="event-title">{event.title}</h3>
                      <div className="event-details">
                        <span className="detail-item">
                          <Clock size={14} />
                          {event.time}
                        </span>
                        <span className="detail-item">
                          <Users size={14} />
                          {event.participants} joining
                        </span>
                        <span className="event-type">{event.type}</span>
                      </div>
                    </div>
                    <button className="join-btn">Join</button>
                  </div>
                ))}
              </div>

              {/* Admin Panel (Visible only to admins) */}
              {isAdmin && (
                <div className="admin-panel">
                  <h3 className="admin-title">
                    <Shield size={20} />
                    Admin Controls
                  </h3>
                  <div className="admin-actions">
                    <button
                      className="admin-btn"
                      onClick={() => router.push("/admin/community")}
                    >
                      Manage All Discussions
                    </button>
                    <button
                      className="admin-btn"
                      onClick={() => router.push("/admin/users")}
                    >
                      Manage Users
                    </button>
                    <button
                      className="admin-btn"
                      onClick={() => router.push("/admin/events")}
                    >
                      Create Event
                    </button>
                  </div>
                </div>
              )}

              <div className="leaderboard-card">
                <h3 className="leaderboard-title">
                  <Award size={20} />
                  Top Contributors
                </h3>
                <div className="leaderboard-list">
                  {[{ rank: 1, name: "", points: "" }].map((player) => (
                    <div key={player.rank} className="leaderboard-item">
                      <div className="player-info">
                        <span className="player-rank">#{player.rank}</span>
                        <span className="player-name">{player.name}</span>
                      </div>
                      <span className="player-points">{player.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Discussion</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="What's your discussion about?"
                  value={newDiscussion.title}
                  onChange={(e) =>
                    setNewDiscussion({
                      ...newDiscussion,
                      title: e.target.value,
                    })
                  }
                  maxLength={200}
                />
                <div className="char-count">
                  {newDiscussion.title.length}/200 characters
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={newDiscussion.category}
                  onChange={(e) =>
                    setNewDiscussion({
                      ...newDiscussion,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="General">General</option>
                  <option value="Game Strategy">Game Strategy</option>
                  <option value="Tips & Tricks">Tips & Tricks</option>
                  <option value="Community">Community</option>
                  <option value="News">News</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Share your thoughts, questions, or ideas..."
                  rows={6}
                  value={newDiscussion.content}
                  onChange={(e) =>
                    setNewDiscussion({
                      ...newDiscussion,
                      content: e.target.value,
                    })
                  }
                  maxLength={2000}
                />
                <div className="char-count">
                  {newDiscussion.content.length}/2000 characters
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tags (comma-separated)
                  <span className="form-hint">
                    Optional keywords for better discovery
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="strategy, tips, multiplayer, etc."
                  value={newDiscussion.tags}
                  onChange={(e) =>
                    setNewDiscussion({
                      ...newDiscussion,
                      tags: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-info">
                <div className="info-icon">💡</div>
                <div className="info-content">
                  <strong>Earn 50 JJ Points</strong> for creating a discussion!
                  Be respectful and follow community guidelines.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-submit"
                onClick={handleCreateDiscussion}
                disabled={
                  !newDiscussion.title.trim() || !newDiscussion.content.trim()
                }
              >
                Create Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2 className="modal-title">Delete Discussion</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <p className="warning-text">
                Are you sure you want to delete this discussion?
                {isAdmin
                  ? " As an admin, this will permanently delete the discussion."
                  : " This action cannot be undone."}
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="modal-delete"
                onClick={() => handleDeleteDiscussion(showDeleteConfirm)}
              >
                Delete Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="community-cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Join?</h2>
            <p className="cta-description">
              Create your account and start earning points, engaging with the
              community, and discovering endless joy.
            </p>
            <div className="cta-buttons">
              <button
                className="primary-cta-btn"
                onClick={() => {
                  if (!authUser) {
                    router.push("/signup");
                  } else {
                    setShowCreateModal(true);
                  }
                }}
              >
                {authUser ? "Start Discussion" : "Sign Up Free"}
              </button>
              <button className="secondary-cta-btn">
                Learn More About Rewards
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
