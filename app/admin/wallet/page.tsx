"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  FaCoins,
  FaGift,
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
  FaTicketAlt,
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


interface UserStats {
  totalUsers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalPointsInCirculation: number;
  activeRewards: number;
  activeCriteria: number;
  recentTransactionsCount: number;
}

const AdminWalletPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "criteria" | "rewards" | "stats" | "users"
  >("rewards");

  // Data states
  const [pointsCriteria, setPointsCriteria] = useState<PointsCriteria[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  // Edit states
  const [editingCriteria, setEditingCriteria] = useState<PointsCriteria | null>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Modal states
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Clear Wallet State
  const [clearIdentifier, setClearIdentifier] = useState("");
  const [clearing, setClearing] = useState(false);

  // FIXED: Get auth token directly from Firebase
  const getAuthToken = async () => {
    try {
      // Get current user from Firebase directly
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("❌ No authenticated user");
        return null;
      }

      console.log("✅ Getting token for user:", currentUser.email);

      // Force refresh token
      const token = await currentUser.getIdToken(true);

      if (!token) {
        console.error("❌ Token is empty");
        return null;
      }

      console.log("✅ Token obtained, length:", token.length);
      return token;
    } catch (error: any) {
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
        alert("⚠️ Authentication token not available. Please try logging in again.");
        router.push("/login?redirect=/admin/wallet");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch rewards
      try {
        const rewardsRes = await fetch("/api/admin/wallet/rewards", { headers });
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


      // Fetch criteria
      try {
        const criteriaRes = await fetch("/api/admin/wallet/criteria", { headers });
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
        alert(`❌ Failed to save: ${data.error || data.message || "Unknown error"}`);
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
        alert(`❌ Failed to save: ${data.error || data.message || "Unknown error"}`);
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

  const handleClearWallet = async () => {
    if (!user) return;
    if (!clearIdentifier) {
      alert("Please enter a User Email to clear.");
      return;
    }

    if (!confirm(`Are you sure you want to CLEAR the wallet for user: ${clearIdentifier}? This action cannot be undone.`)) {
      return;
    }

    setClearing(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Determine if input is email or ID (simple check)
      const isEmail = clearIdentifier.includes("@");
      const body = isEmail
        ? { targetUserEmail: clearIdentifier }
        : { targetUserId: clearIdentifier };

      const response = await fetch("/api/admin/wallet/clear", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Success! ${data.message}. Previous Balance: ${data.previousBalance}`);
        setClearIdentifier("");
        fetchAllData(); // Refresh stats
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error("❌ Error clearing wallet:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  // Clear Products Handler
  const [clearProductIdentifier, setClearProductIdentifier] = useState("");
  const [clearingProducts, setClearingProducts] = useState(false);

  const handleClearProducts = async () => {
    if (!clearProductIdentifier) {
      alert("Please enter a user email");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to clear this user's PURCHASED PRODUCTS? This cannot be undone.",
      )
    ) {
      return;
    }

    setClearingProducts(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const isEmail = clearProductIdentifier.includes("@");
      const body = isEmail
        ? { targetUserEmail: clearProductIdentifier }
        : { targetUserId: clearProductIdentifier };

      const response = await fetch("/api/admin/products/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully cleared ${data.deletedCount} products!`);
        setClearProductIdentifier("");
      } else {
        alert("Failed to clear products: " + data.error);
      }
    } catch (error) {
      console.error("Error clearing products:", error);
      alert("An error occurred");
    } finally {
      setClearingProducts(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="admin-wallet-page">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" style={{ animation: "spin 1s linear infinite" }} />
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => router.push('/admin/coupons')}
            style={{ backgroundColor: '#2563eb' }}
          >
            <FaTicketAlt /> Manage Coupons
          </button>
          <button className="btn-primary" onClick={fetchAllData}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "rewards" ? "active" : ""}
          onClick={() => setActiveTab("rewards")}
        >
          <FaGift /> Rewards ({rewards.length})
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
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          <FaUsers /> Manage Users
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
                <FaGift className="stat-icon" />
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
        {activeTab === "users" && (
          <div className="users-section">
            <div className="section-header">
              <h2>User Wallet Management</h2>
            </div>

            <div className="wallet-card">
              <div style={{ padding: '20px' }}>
                <h3>⚠️ Danger Zone: Clear User Wallet</h3>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  This action will reset a user's points and wallet balance to 0. It creates a transaction record of the clearing.
                </p>

                <div className="form-group" style={{ maxWidth: '400px' }}>
                  <label>User Email Address</label>
                  <input
                    type="text"
                    placeholder="Enter user email..."
                    value={clearIdentifier}
                    onChange={(e) => setClearIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      marginBottom: '10px'
                    }}
                  />
                  <button
                    className="btn-danger"
                    onClick={handleClearWallet}
                    disabled={clearing}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                  >
                    {clearing ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                    {clearing ? "Clearing..." : "Clear User Wallet"}
                  </button>
                </div>
              </div>
            </div>

            <div className="wallet-card" style={{ marginTop: '20px' }}>
              <div style={{ padding: '20px' }}>
                <h3>📦 Danger Zone: Clear Purchased Products</h3>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  This action will delete all PURCHASED PRODUCTS (orders) for a user.
                </p>

                <div className="form-group" style={{ maxWidth: '400px' }}>
                  <label>User Email Address</label>
                  <input
                    type="text"
                    placeholder="Enter user email..."
                    value={clearProductIdentifier}
                    onChange={(e) => setClearProductIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      marginBottom: '10px'
                    }}
                  />
                  <button
                    className="btn-danger"
                    onClick={handleClearProducts}
                    disabled={clearingProducts}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                  >
                    {clearingProducts ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                    {clearingProducts ? "Clearing Products..." : "Clear User Products"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {
        showRewardModal && editingReward && (
          <RewardModal
            reward={editingReward}
            onSave={handleSaveReward}
            onClose={() => {
              setShowRewardModal(false);
              setEditingReward(null);
            }}
          />
        )
      }


      {
        showCriteriaModal && editingCriteria && (
          <CriteriaModal
            criteria={editingCriteria}
            onSave={handleSaveCriteria}
            onClose={() => {
              setShowCriteriaModal(false);
              setEditingCriteria(null);
            }}
          />
        )
      }
    </div >
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


export default AdminWalletPage;
