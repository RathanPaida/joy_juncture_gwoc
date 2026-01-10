// app/admin/wallet/page.tsx - FIXED getIdToken Error
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FaCoins,
  FaGift,
  FaTrophy,
  FaUsers,
  FaCog,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaChartLine,
  FaExclamationCircle,
  FaSpinner,
  FaHistory,
} from "react-icons/fa";
import "./admin-wallet.css";

interface PointsCriteria {
  _id?: string;
  type: string;
  pointsPerUnit: number;
  description: string;
  isActive: boolean;
}

interface Reward {
  _id?: string;
  name: string;
  description: string;
  points: number;
  category: string;
  icon: string;
  color: string;
  stock: number;
  isActive: boolean;
}

interface Achievement {
  _id?: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  requirement: number;
  category: string;
  isActive: boolean;
}

interface UserStats {
  totalUsers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalPointsInCirculation: number;
  activeRewards: number;
  activeAchievements: number;
  activeCriteria: number;
  recentTransactionsCount: number;
}

const AdminWalletPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "criteria" | "rewards" | "achievements" | "stats"
  >("rewards");

  // Data states
  const [pointsCriteria, setPointsCriteria] = useState<PointsCriteria[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  // Edit states
  const [editingCriteria, setEditingCriteria] = useState<PointsCriteria | null>(
    null,
  );
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editingAchievement, setEditingAchievement] =
    useState<Achievement | null>(null);

  // Modal states
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Helper function to get auth token
  const getAuthToken = async () => {
    if (!user) return null;

    try {
      // Try Firebase getIdToken method
      if (typeof user.getIdToken === "function") {
        return await user.getIdToken(true);
      }

      // Try accessing token directly (for some auth implementations)
      if (user.token) {
        return user.token;
      }

      // Try accessing accessToken
      if (user.accessToken) {
        return user.accessToken;
      }

      // If user has stsTokenManager (Firebase)
      if (user.stsTokenManager?.accessToken) {
        return user.stsTokenManager.accessToken;
      }

      console.warn("⚠️ Could not get auth token from user object");
      return null;
    } catch (error) {
      console.error("❌ Error getting auth token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        console.log("✅ User authenticated, fetching data...");
        fetchAllData();
      } else {
        console.log("❌ No user, redirecting...");
        router.push("/login?redirect=/admin/wallet");
      }
    }
  }, [user, authLoading]);

  const fetchAllData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log("📥 Fetching all admin data...");
      const token = await getAuthToken();

      if (!token) {
        console.error("❌ No auth token available");
        alert(
          "⚠️ Authentication token not available. Please try logging in again.",
        );
        router.push("/login?redirect=/admin/wallet");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch rewards
      try {
        const rewardsRes = await fetch("/api/admin/wallet/rewards", {
          headers,
        });
        if (rewardsRes.ok) {
          const data = await rewardsRes.json();
          setRewards(data.rewards || []);
          console.log("✅ Rewards loaded:", data.rewards?.length);
        } else if (rewardsRes.status === 401) {
          console.error("❌ Unauthorized - redirecting to login");
          router.push("/login?redirect=/admin/wallet");
        }
      } catch (err) {
        console.error("❌ Error fetching rewards:", err);
      }

      // Fetch achievements
      try {
        const achievementsRes = await fetch("/api/admin/wallet/achievements", {
          headers,
        });
        if (achievementsRes.ok) {
          const data = await achievementsRes.json();
          setAchievements(data.achievements || []);
          console.log("✅ Achievements loaded:", data.achievements?.length);
        }
      } catch (err) {
        console.error("❌ Error fetching achievements:", err);
      }

      // Fetch criteria
      try {
        const criteriaRes = await fetch("/api/admin/wallet/criteria", {
          headers,
        });
        if (criteriaRes.ok) {
          const data = await criteriaRes.json();
          setPointsCriteria(data.criteria || []);
          console.log("✅ Criteria loaded:", data.criteria?.length);
        }
      } catch (err) {
        console.error("❌ Error fetching criteria:", err);
      }

      // Fetch stats
      try {
        const statsRes = await fetch("/api/admin/wallet/stats", { headers });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
          console.log("✅ Stats loaded");
        }
      } catch (err) {
        console.error("❌ Error fetching stats:", err);
      }
    } catch (error) {
      console.error("❌ Error in fetchAllData:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReward = async (reward: Reward) => {
    if (!user) {
      alert("❌ Not logged in!");
      return;
    }

    try {
      console.log("💾 Saving reward...", reward);

      const token = await getAuthToken();
      if (!token) {
        alert("❌ Authentication error. Please login again.");
        return;
      }

      const method = reward._id ? "PUT" : "POST";
      const url = reward._id
        ? `/api/admin/wallet/rewards/${reward._id}`
        : "/api/admin/wallet/rewards";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reward),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ Reward saved successfully!");
        setShowRewardModal(false);
        setEditingReward(null);
        await fetchAllData();
      } else {
        alert(
          `❌ Failed to save: ${data.error || data.message || "Unknown error"}`,
        );
      }
    } catch (error: any) {
      console.error("❌ Error saving reward:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this reward?")) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/admin/wallet/rewards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("✅ Reward deleted!");
        fetchAllData();
      } else {
        const data = await response.json();
        alert(`❌ Failed to delete: ${data.error}`);
      }
    } catch (error: any) {
      console.error("❌ Error deleting reward:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleSaveAchievement = async (achievement: Achievement) => {
    if (!user) {
      alert("❌ Not logged in!");
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        alert("❌ Authentication error. Please login again.");
        return;
      }

      const method = achievement._id ? "PUT" : "POST";
      const url = achievement._id
        ? `/api/admin/wallet/achievements/${achievement._id}`
        : "/api/admin/wallet/achievements";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(achievement),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Achievement saved successfully!");
        setShowAchievementModal(false);
        setEditingAchievement(null);
        fetchAllData();
      } else {
        alert(`❌ Failed to save: ${data.error}`);
      }
    } catch (error: any) {
      console.error("❌ Error saving achievement:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/admin/wallet/achievements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("✅ Achievement deleted!");
        fetchAllData();
      } else {
        const data = await response.json();
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error("❌ Error deleting achievement:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleSaveCriteria = async (criteria: PointsCriteria) => {
    if (!user) {
      alert("❌ Not logged in!");
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        alert("❌ Authentication error. Please login again.");
        return;
      }

      const method = criteria._id ? "PUT" : "POST";
      const url = criteria._id
        ? `/api/admin/wallet/criteria/${criteria._id}`
        : "/api/admin/wallet/criteria";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(criteria),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ Criteria saved successfully!");
        setShowCriteriaModal(false);
        setEditingCriteria(null);
        await fetchAllData();
      } else {
        alert(
          `❌ Failed to save: ${data.error || data.message || "Unknown error"}`,
        );
      }
    } catch (error: any) {
      console.error("❌ Error saving criteria:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleDeleteCriteria = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this criteria?")) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/admin/wallet/criteria/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("✅ Criteria deleted!");
        fetchAllData();
      } else {
        const data = await response.json();
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error("❌ Error:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="admin-wallet-page">
        <div className="loading-container">
          <FaSpinner
            className="loading-spinner"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-wallet-page">
        <div className="access-denied">
          <FaExclamationCircle className="error-icon" />
          <h1>Not Logged In</h1>
          <p>Please login to access admin panel</p>
          <button onClick={() => router.push("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wallet-page">
      <div className="admin-header">
        <div>
          <h1>
            <FaCog /> Wallet System Management
          </h1>
          <p>Manage points criteria, rewards, and achievements</p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
            Logged in as: {user.email || "Unknown User"}
          </p>
        </div>
        <button className="btn-primary" onClick={fetchAllData}>
          🔄 Refresh Data
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "rewards" ? "active" : ""}
          onClick={() => setActiveTab("rewards")}
        >
          <FaGift /> Rewards ({rewards.length})
        </button>
        <button
          className={activeTab === "achievements" ? "active" : ""}
          onClick={() => setActiveTab("achievements")}
        >
          <FaTrophy /> Achievements ({achievements.length})
        </button>
        <button
          className={activeTab === "criteria" ? "active" : ""}
          onClick={() => setActiveTab("criteria")}
        >
          <FaCoins /> Points Criteria ({pointsCriteria.length})
        </button>
        <button
          className={activeTab === "stats" ? "active" : ""}
          onClick={() => setActiveTab("stats")}
        >
          <FaChartLine /> Statistics
        </button>
      </div>

      <div className="admin-content">
        {/* REWARDS TAB */}
        {activeTab === "rewards" && (
          <div className="rewards-section">
            <div className="section-header">
              <h2>Available Rewards</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingReward({
                    name: "",
                    description: "",
                    points: 100,
                    category: "discount",
                    icon: "FaGift",
                    color: "#FF8C00",
                    stock: 100,
                    isActive: true,
                  });
                  setShowRewardModal(true);
                }}
              >
                <FaPlus /> Add New Reward
              </button>
            </div>

            <div className="rewards-grid">
              {rewards.length === 0 ? (
                <div className="empty-state">
                  <FaGift
                    style={{
                      fontSize: "64px",
                      opacity: 0.3,
                      marginBottom: "20px",
                    }}
                  />
                  <p>No rewards yet. Click "Add New Reward" to create one!</p>
                </div>
              ) : (
                rewards.map((reward) => (
                  <div key={reward._id} className="reward-admin-card">
                    <div className="reward-header">
                      <h3>{reward.name}</h3>
                      <span
                        className={`status-badge ${reward.isActive ? "active" : "inactive"}`}
                      >
                        {reward.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p>{reward.description}</p>
                    <div className="reward-details">
                      <span>💰 {reward.points} points</span>
                      <span>📦 {reward.stock} stock</span>
                      <span>🏷️ {reward.category}</span>
                    </div>
                    <div className="reward-actions">
                      <button
                        onClick={() => {
                          setEditingReward(reward);
                          setShowRewardModal(true);
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteReward(reward._id!)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === "achievements" && (
          <div className="achievements-section">
            <div className="section-header">
              <h2>Achievements</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingAchievement({
                    name: "",
                    description: "",
                    icon: "FaTrophy",
                    points: 100,
                    requirement: 1,
                    category: "general",
                    isActive: true,
                  });
                  setShowAchievementModal(true);
                }}
              >
                <FaPlus /> Add New Achievement
              </button>
            </div>

            <div className="achievements-grid">
              {achievements.length === 0 ? (
                <div className="empty-state">
                  <FaTrophy
                    style={{
                      fontSize: "64px",
                      opacity: 0.3,
                      marginBottom: "20px",
                    }}
                  />
                  <p>No achievements yet. Add your first one!</p>
                </div>
              ) : (
                achievements.map((achievement) => (
                  <div key={achievement._id} className="achievement-admin-card">
                    <div className="achievement-header">
                      <h3>{achievement.name}</h3>
                      <span
                        className={`status-badge ${achievement.isActive ? "active" : "inactive"}`}
                      >
                        {achievement.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p>{achievement.description}</p>
                    <div className="achievement-details">
                      <span>🎁 {achievement.points} points</span>
                      <span>🎯 Requires: {achievement.requirement}</span>
                    </div>
                    <div className="achievement-actions">
                      <button
                        onClick={() => {
                          setEditingAchievement(achievement);
                          setShowAchievementModal(true);
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() =>
                          handleDeleteAchievement(achievement._id!)
                        }
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CRITERIA TAB */}
        {activeTab === "criteria" && (
          <div className="criteria-section">
            <div className="section-header">
              <h2>Points Earning Criteria</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingCriteria({
                    type: "",
                    pointsPerUnit: 10,
                    description: "",
                    isActive: true,
                  });
                  setShowCriteriaModal(true);
                }}
              >
                <FaPlus /> Add New Criteria
              </button>
            </div>

            <div className="criteria-list">
              {pointsCriteria.length === 0 ? (
                <div className="empty-state">
                  <FaCoins
                    style={{
                      fontSize: "64px",
                      opacity: 0.3,
                      marginBottom: "20px",
                    }}
                  />
                  <p>No criteria yet. Add your first one!</p>
                </div>
              ) : (
                pointsCriteria.map((criteria) => (
                  <div key={criteria._id} className="criteria-card">
                    <div className="criteria-info">
                      <h3>{criteria.type}</h3>
                      <p>{criteria.description}</p>
                      <span className="points-badge">
                        {criteria.pointsPerUnit} points
                      </span>
                      <span
                        className={`status-badge ${criteria.isActive ? "active" : "inactive"}`}
                      >
                        {criteria.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="criteria-actions">
                      <button
                        onClick={() => {
                          setEditingCriteria(criteria);
                          setShowCriteriaModal(true);
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteCriteria(criteria._id!)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && stats && (
          <div className="stats-section">
            <h2>Wallet System Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <FaUsers className="stat-icon" />
                <h3>Total Users</h3>
                <p className="stat-value">{stats.totalUsers}</p>
                <p className="stat-subtitle">Registered accounts</p>
              </div>

              {/* <div className="stat-card">
                <FaCoins className="stat-icon" />
                <h3>Points Issued</h3>
                <p className="stat-value">{stats.totalpoints.toLocaleString()}</p>
                <p className="stat-subtitle">Total earned by users</p>
              </div> */}

              <div className="stat-card">
                <FaGift className="stat-icon" />
                <h3>Points Redeemed</h3>
                <p className="stat-value">
                  {stats.totalPointsRedeemed.toLocaleString()}
                </p>
                <p className="stat-subtitle">Total spent on rewards</p>
              </div>

              <div className="stat-card">
                <FaTrophy className="stat-icon" />
                <h3>Active Rewards</h3>
                <p className="stat-value">{stats.activeRewards}</p>
                <p className="stat-subtitle">Available to redeem</p>
              </div>

              <div className="stat-card">
                <FaChartLine className="stat-icon" />
                <h3>Points in Circulation</h3>
                <p className="stat-value">
                  {stats.totalPointsInCirculation.toLocaleString()}
                </p>
                <p className="stat-subtitle">Current user balances</p>
              </div>

              <div className="stat-card">
                <FaTrophy className="stat-icon" />
                <h3>Active Achievements</h3>
                <p className="stat-value">{stats.activeAchievements}</p>
                <p className="stat-subtitle">Unlockable achievements</p>
              </div>

              <div className="stat-card">
                <FaCoins className="stat-icon" />
                <h3>Points Criteria</h3>
                <p className="stat-value">{stats.activeCriteria}</p>
                <p className="stat-subtitle">Ways to earn points</p>
              </div>

              <div className="stat-card">
                <FaHistory className="stat-icon" />
                <h3>Recent Activity</h3>
                <p className="stat-value">{stats.recentTransactionsCount}</p>
                <p className="stat-subtitle">Transactions (7 days)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showRewardModal && editingReward && (
        <RewardModal
          reward={editingReward}
          onSave={handleSaveReward}
          onClose={() => {
            setShowRewardModal(false);
            setEditingReward(null);
          }}
        />
      )}

      {showAchievementModal && editingAchievement && (
        <AchievementModal
          achievement={editingAchievement}
          onSave={handleSaveAchievement}
          onClose={() => {
            setShowAchievementModal(false);
            setEditingAchievement(null);
          }}
        />
      )}

      {showCriteriaModal && editingCriteria && (
        <CriteriaModal
          criteria={editingCriteria}
          onSave={handleSaveCriteria}
          onClose={() => {
            setShowCriteriaModal(false);
            setEditingCriteria(null);
          }}
        />
      )}
    </div>
  );
};

// Modal Components
const CriteriaModal: React.FC<{
  criteria: PointsCriteria;
  onSave: (criteria: PointsCriteria) => void;
  onClose: () => void;
}> = ({ criteria, onSave, onClose }) => {
  const [formData, setFormData] = useState(criteria);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{criteria._id ? "Edit" : "Add"} Points Criteria</h3>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Type *</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              placeholder="e.g., purchase, event, game"
            />
          </div>
          <div className="form-group">
            <label>Points Per Unit *</label>
            <input
              type="number"
              value={formData.pointsPerUnit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointsPerUnit: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              Active
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onSave(formData)}
            disabled={!formData.type || !formData.description}
          >
            <FaSave /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

const RewardModal: React.FC<{
  reward: Reward;
  onSave: (reward: Reward) => void;
  onClose: () => void;
}> = ({ reward, onSave, onClose }) => {
  const [formData, setFormData] = useState(reward);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{reward._id ? "Edit" : "Add"} Reward</h3>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., 10% Discount Code"
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Describe the reward..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Points Required *</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: Number(e.target.value) })
                }
              />
            </div>
            <div className="form-group">
              <label>Stock *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="discount">Discount</option>
                <option value="ticket">Event Ticket</option>
                <option value="bundle">Game Bundle</option>
                <option value="premium">Premium Access</option>
              </select>
            </div>
            <div className="form-group">
              <label>Icon</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="FaGift"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
            />
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              Active (visible to users)
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onSave(formData)}
            disabled={!formData.name || !formData.description}
          >
            <FaSave /> Save Reward
          </button>
        </div>
      </div>
    </div>
  );
};

const AchievementModal: React.FC<{
  achievement: Achievement;
  onSave: (achievement: Achievement) => void;
  onClose: () => void;
}> = ({ achievement, onSave, onClose }) => {
  const [formData, setFormData] = useState(achievement);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{achievement._id ? "Edit" : "Add"} Achievement</h3>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., First Steps"
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Describe the achievement..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Points Reward *</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: Number(e.target.value) })
                }
              />
            </div>
            <div className="form-group">
              <label>Requirement *</label>
              <input
                type="number"
                value={formData.requirement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requirement: Number(e.target.value),
                  })
                }
                placeholder="e.g., 5"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="general"
              />
            </div>
            <div className="form-group">
              <label>Icon</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="FaTrophy"
              />
            </div>
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              Active
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onSave(formData)}
            disabled={!formData.name || !formData.description}
          >
            <FaSave /> Save Achievement
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWalletPage;
