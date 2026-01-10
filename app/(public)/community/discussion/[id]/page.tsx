// app/community/discussion/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  User,
  Clock,
  TrendingUp,
  MoreVertical,
  Send,
  ThumbsUp,
  Flag,
  Trash2,
  Pin,
  Flame,
  Users,
} from "lucide-react";
import "./community.css";

interface Reply {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  likes: number;
  likedBy: string[];
  isAuthor: boolean;
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

export default function DiscussionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch discussion details
  const fetchDiscussion = async () => {
    setLoading(true);
    try {
      console.log("🔍 Fetching discussion with ID:", id);

      const response = await fetch(`/api/community/discussions/${id}`);
      const data = await response.json();

      console.log("📦 Response:", data);

      if (data.success) {
        setDiscussion(data.discussion);
        setReplies(data.discussion.replies || []);

        // Check if current user liked this discussion
        if (authUser) {
          setIsLiked(data.discussion.likedBy?.includes(authUser.uid) || false);
          checkUserRole();
        }
      } else {
        console.error("❌ Failed to fetch discussion:", data.error);
        alert(data.error || "Discussion not found");
      }
    } catch (error) {
      console.error("❌ Error fetching discussion:", error);
      alert("Failed to load discussion");
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

      if (response.ok) {
        const data = await response.json();
        const userRole = data.success ? data.role : data.role;
        setIsAdmin(["admin", "super_admin"].includes(userRole));
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  // Handle like discussion
  const handleLikeDiscussion = async () => {
    if (!authUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch(`/api/community/discussions/${id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setIsLiked(!isLiked);
        setDiscussion((prev) =>
          prev
            ? {
                ...prev,
                likes: isLiked ? prev.likes - 1 : prev.likes + 1,
                likedBy: isLiked
                  ? prev.likedBy.filter((uid) => uid !== authUser.uid)
                  : [...prev.likedBy, authUser.uid],
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Error liking discussion:", error);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async () => {
    if (!authUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }

    if (!newReply.trim()) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch(`/api/community/discussions/${id}/replies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newReply }),
      });

      const data = await response.json();

      if (data.success) {
        setNewReply("");
        fetchDiscussion(); // Refresh to get new reply
        alert("Reply posted successfully! +10 JJ Points");
      } else {
        alert(data.error || "Failed to post reply");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply");
    }
  };

  // Handle like reply
  const handleLikeReply = async (
    replyId: string,
    isCurrentlyLiked: boolean,
  ) => {
    if (!authUser) {
      router.push("/login?redirect=" + window.location.pathname);
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch(
        `/api/community/discussions/${id}/replies/${replyId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setReplies((prev) =>
          prev.map((reply) =>
            reply._id === replyId
              ? {
                  ...reply,
                  likes:
                    data.action === "like" ? reply.likes + 1 : reply.likes - 1,
                  likedBy:
                    data.action === "like"
                      ? [...reply.likedBy, authUser.uid]
                      : reply.likedBy.filter((uid) => uid !== authUser.uid),
                }
              : reply,
          ),
        );
      }
    } catch (error) {
      console.error("Error liking reply:", error);
    }
  };

  // Delete reply (author or admin only)
  const handleDeleteReply = async (replyId: string) => {
    if (!authUser) return;

    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch(
        `/api/community/discussions/${id}/replies/${replyId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchDiscussion(); // Refresh discussion
        alert("Reply deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
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

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (id) {
      console.log("🎯 Discussion ID from URL:", id);
      fetchDiscussion();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading discussion...</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="not-found-container">
        <h2>Discussion not found</h2>
        <p>
          The discussion you're looking for doesn't exist or has been deleted.
        </p>
        <button
          className="back-button"
          onClick={() => router.push("/community")}
        >
          <ArrowLeft size={16} />
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <main className="discussion-detail-page">
      {/* Navigation */}
      <div className="discussion-nav">
        <button
          className="back-button"
          onClick={() => router.push("/community")}
        >
          <ArrowLeft size={20} />
          Back to Community
        </button>
      </div>

      {/* Discussion Content */}
      <div className="discussion-container">
        <div className="discussion-main">
          {/* Discussion Header */}
          <div className="discussion-header">
            <span
              className={`discussion-category ${discussion.isHot ? "hot" : ""}`}
            >
              {discussion.isHot && <Flame size={12} />}
              {discussion.category}
              {discussion.isPinned && (
                <span className="pinned-indicator">
                  <Pin size={12} />
                  Pinned
                </span>
              )}
            </span>

            <div className="discussion-actions">
              <button
                className={`action-btn ${isBookmarked ? "active" : ""}`}
                onClick={() => setIsBookmarked(!isBookmarked)}
                title="Bookmark"
              >
                <Bookmark size={18} />
              </button>
              <button className="action-btn" title="Share">
                <Share2 size={18} />
              </button>
              {isAdmin && (
                <button className="action-btn" title="Admin Actions">
                  <MoreVertical size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Discussion Title */}
          <h1 className="discussion-title">{discussion.title}</h1>

          {/* Discussion Meta */}
          <div className="discussion-meta">
            <div className="author-info">
              <div className="author-avatar">
                {discussion.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="author-details">
                <span className="author-name">{discussion.authorName}</span>
                <span className="post-date">
                  <Clock size={12} />
                  {formatDate(discussion.createdAt)}
                </span>
              </div>
            </div>

            <div className="discussion-stats">
              <span className="stat-item">
                <Users size={14} />
                {discussion.viewCount} views
              </span>
              <span className="stat-item">
                <MessageSquare size={14} />
                {replies.length} replies
              </span>
              <span className="stat-item">
                <TrendingUp size={14} />
                {discussion.likes} likes
              </span>
            </div>
          </div>

          {/* Discussion Content */}
          <div className="discussion-content">
            {discussion.content.split("\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="discussion-tags">
              {discussion.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Discussion Actions */}
          <div className="discussion-footer">
            <button
              className={`like-button ${isLiked ? "liked" : ""}`}
              onClick={handleLikeDiscussion}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              <span>{isLiked ? "Liked" : "Like"}</span>
              <span className="like-count">{discussion.likes}</span>
            </button>

            <button
              className="reply-button"
              onClick={() => {
                document
                  .querySelector(".reply-input")
                  ?.scrollIntoView({ behavior: "smooth" });
                (
                  document.querySelector(".reply-input") as HTMLTextAreaElement
                )?.focus();
              }}
            >
              <MessageSquare size={20} />
              <span>Reply</span>
            </button>
          </div>

          {/* Replies Section */}
          <div className="replies-section">
            <h3 className="replies-title">
              <MessageSquare size={20} />
              Replies ({replies.length})
            </h3>

            {/* Reply Form */}
            <div className="reply-form">
              <div className="reply-input-wrapper">
                <div className="current-user-avatar">
                  {authUser?.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
                <textarea
                  className="reply-input"
                  placeholder="Share your thoughts..."
                  rows={3}
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  maxLength={1000}
                />
              </div>
              <div className="reply-actions">
                <div className="char-count">
                  {newReply.length}/1000 characters
                </div>
                <button
                  className="submit-reply-btn"
                  onClick={handleSubmitReply}
                  disabled={!newReply.trim()}
                >
                  <Send size={16} />
                  Post Reply
                </button>
              </div>
            </div>

            {/* Replies List */}
            <div className="replies-list">
              {replies.length === 0 ? (
                <div className="no-replies">
                  <MessageSquare size={48} />
                  <p>No replies yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                replies.map((reply) => {
                  const isReplyLiked = reply.likedBy?.includes(
                    authUser?.uid || "",
                  );
                  const canDelete =
                    isAdmin || (authUser && reply.authorId === authUser.uid);

                  return (
                    <div key={reply._id} className="reply-card">
                      <div className="reply-header">
                        <div className="reply-author">
                          <div className="reply-avatar">
                            {reply.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="reply-author-info">
                            <span className="reply-author-name">
                              {reply.authorName}
                              {reply.isAuthor && (
                                <span className="author-badge">Author</span>
                              )}
                            </span>
                            <span className="reply-date">
                              <Clock size={12} />
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="reply-actions">
                          <button
                            className={`action-btn like-reply-btn ${isReplyLiked ? "liked" : ""}`}
                            onClick={() =>
                              handleLikeReply(reply._id, isReplyLiked)
                            }
                            title="Like"
                          >
                            <ThumbsUp size={14} />
                            {reply.likes > 0 && (
                              <span className="like-count">{reply.likes}</span>
                            )}
                          </button>

                          {canDelete && (
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteReply(reply._id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          <button className="action-btn" title="Report">
                            <Flag size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="reply-content">{reply.content}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="discussion-sidebar">
          <div className="sidebar-card">
            <h4 className="sidebar-title">Community Guidelines</h4>
            <ul className="guidelines-list">
              <li>Be respectful and kind</li>
              <li>No spam or self-promotion</li>
              <li>Stay on topic</li>
              <li>Report inappropriate content</li>
            </ul>
          </div>

          <div className="sidebar-card">
            <h4 className="sidebar-title">Discussion Stats</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <Users size={16} />
                <span className="stat-label">Views</span>
                <span className="stat-value">{discussion.viewCount}</span>
              </div>
              <div className="stat-item">
                <MessageSquare size={16} />
                <span className="stat-label">Replies</span>
                <span className="stat-value">{replies.length}</span>
              </div>
              <div className="stat-item">
                <TrendingUp size={16} />
                <span className="stat-label">Likes</span>
                <span className="stat-value">{discussion.likes}</span>
              </div>
              <div className="stat-item">
                <Clock size={16} />
                <span className="stat-label">Created</span>
                <span className="stat-value">
                  {formatDate(discussion.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {discussion.isHot && (
            <div className="sidebar-card hot-card">
              <div className="hot-badge">
                <Flame size={20} />
                Hot Discussion
              </div>
              <p>This discussion is trending with high engagement!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
