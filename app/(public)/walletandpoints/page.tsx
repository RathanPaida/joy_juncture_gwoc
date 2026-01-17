// app/(public)/walletandpoints/page.tsx - COMPLETE FIXED VERSION
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "@/lib/firebase";
import {
  FaWallet,
  FaCoins,
  FaTrophy,
  FaGift,
  FaHistory,
  FaGamepad,
  FaUsers,
  FaCalendarAlt,
  FaShoppingCart,
  FaStar,
  FaFire,
  FaCrown,
  FaBolt,
  FaMedal,
  FaGem,
  FaSync,
  FaExclamationCircle,
  FaSignInAlt,
  FaInfoCircle,
  FaFilter,
  FaCheck,
} from "react-icons/fa";
import {
  calculateLevel,
  getLevelProgress,
  getLevelName,
  LEVEL_THRESHOLDS,
} from "@/lib/levelHelper";
import "./wallet.css";



interface Reward {
  _id: string;
  name: string;
  points: number;
  description: string;
  icon: string;
  color: string;
  category: string;
  stock: number;
  isActive: boolean;
}

interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  progress: number;
  requirement: number;
  category: string;
  isActive: boolean;
}

interface PointsCriteria {
  _id: string;
  type: string;
  pointsPerUnit: number;
  description: string;
  isActive: boolean;
}

interface WalletUser {
  _id: string;
  email: string;
  name: string;
  totalPoints: number;
  level: number;
  streak: number;
  lastActivity: string;
  lastLogin?: string;
  achievements: any[];
  redeemedCoupons: {
    rewardId: string;
    code: string;
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    redeemedAt: string;
    isUsed: boolean;
  }[];
}

const WalletPointsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Data
  const [walletUser, setWalletUser] = useState<WalletUser | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");

  // Dynamic Data

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pointsCriteria, setPointsCriteria] = useState<PointsCriteria[]>([]);



  // Daily login
  const [canClaimDaily, setCanClaimDaily] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>("");
  const [nextClaimDate, setNextClaimDate] = useState<Date | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [redeeming, setRedeeming] = useState<boolean>(false);

  const categories = [
    { id: "all", name: "All Rewards", color: "#FF8C00" },
    { id: "discount", name: "Discounts", color: "#4ECDC4" },
    { id: "ticket", name: "Event Tickets", color: "#9B59B6" },
    { id: "bundle", name: "Game Bundles", color: "#FFCC00" },
    { id: "premium", name: "Premium Access", color: "#3498DB" },
  ];



  // Level helper functions
  const getLevelProgressDisplay = () => {
    if (!walletUser) return 0;
    const progress = getLevelProgress(walletUser.totalPoints, walletUser.level);
    return progress.progressPercentage;
  };

  const getNextLevelPoints = () => {
    if (!walletUser) return 1000;
    const progress = getLevelProgress(walletUser.totalPoints, walletUser.level);
    return progress.nextLevelPoints;
  };

  const getPointsToNextLevel = () => {
    if (!walletUser) return 1000;
    const progress = getLevelProgress(walletUser.totalPoints, walletUser.level);
    return progress.pointsToNextLevel;
  };

  // FIXED: Get Firebase token directly
  const getFirebaseToken = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("❌ No authenticated user");
        throw new Error("Not authenticated");
      }

      console.log("✅ Getting token for user:", currentUser.email);

      // Force refresh to get fresh token
      const token = await currentUser.getIdToken(true);

      if (!token) {
        console.error("❌ Token is empty");
        throw new Error("Failed to get authentication token");
      }

      console.log("✅ Token obtained, length:", token.length);
      return token;
    } catch (error: any) {
      console.error("❌ Error getting token:", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  };

  const createWalletForUser = async () => {
    if (!user) throw new Error("No user found");

    try {
      const token = await getFirebaseToken();

      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "User",
          firebaseUid: user.uid,
          picture: user.photoURL || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create wallet: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("❌ Wallet creation error:", error);
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  };



  const fetchWalletData = async () => {
    if (!user) {
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);
      setError(null);

      console.log("🔄 Fetching wallet data for user:", user.email);

      const token = await getFirebaseToken();

      // Fetch user wallet data
      const walletRes = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (walletRes.status === 401 || walletRes.status === 404) {
        console.log("Creating wallet for new user...");
        await createWalletForUser();

        const retryRes = await fetch("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!retryRes.ok) {
          throw new Error("Failed to load wallet after creation");
        }

        const walletData = await retryRes.json();
        updateUserData(walletData);
      } else if (walletRes.ok) {
        const walletData = await walletRes.json();
        updateUserData(walletData);
      } else {
        throw new Error("Failed to load wallet data");
      }



      // Check daily reward status
      await checkDailyRewardStatus();

      // Fetch rewards
      const rewardsRes = await fetch("/api/wallet/rewards");
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        const activeRewards = (rewardsData.rewards || rewardsData || []).filter(
          (r: Reward) => r.isActive !== false,
        );
        setRewards(activeRewards);
      }

      // Fetch achievements
      const achievementsRes = await fetch("/api/wallet/achievements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        const activeAchievements = (
          achievementsData.achievements ||
          achievementsData ||
          []
        ).filter((a: Achievement) => a.isActive !== false);
        setAchievements(activeAchievements);
      }

      // Fetch points criteria
      const criteriaRes = await fetch("/api/wallet/points-criteria");
      if (criteriaRes.ok) {
        const criteriaData = await criteriaRes.json();
        const activeCriteria = (
          criteriaData.criteria ||
          criteriaData ||
          []
        ).filter((c: PointsCriteria) => c.isActive !== false);
        setPointsCriteria(activeCriteria);
      }
    } catch (err: any) {
      console.error("❌ Error fetching wallet data:", err);
      setError(
        err.message || "Failed to load wallet data. Please try refreshing.",
      );
    } finally {
      setPageLoading(false);
    }
  };

  const checkDailyRewardStatus = async () => {
    try {
      const token = await getFirebaseToken();

      const response = await fetch("/api/wallet/daily-login", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Failed to check daily reward status");
        return;
      }

      const data = await response.json();
      console.log("Daily reward status:", data);

      // Safety check: local storage override
      const localLastClaim = localStorage.getItem("lastDailyClaim");
      const today = new Date().toDateString();
      const localClaimedToday = localLastClaim === today;

      if (localClaimedToday) {
        setCanClaimDaily(false);
        // Ensure countdown is set if data didn't provide it (because API might think it's claimable)
        if (!data.nextClaimAt) {
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          setNextClaimDate(tomorrow);
        } else {
          setNextClaimDate(new Date(data.nextClaimAt));
        }
      } else {
        // If local storage doesn't block it, use API status
        setCanClaimDaily(data.canClaim);
        setStreak(data.currentStreak || 0);

        if (!data.canClaim && data.nextClaimAt) {
          const nextClaim = new Date(data.nextClaimAt);
          setNextClaimDate(nextClaim);
          updateCountdown(nextClaim);
        } else if (data.canClaim) {
          setTimeUntilNextClaim("");
          setNextClaimDate(null);
        }
      }
    } catch (error) {
      console.error("Daily reward status error:", error);
    }
  };

  const updateCountdown = (nextClaimAt: string | Date) => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const targetTime = new Date(nextClaimAt).getTime();
      const distance = targetTime - now;

      if (distance < 0) {
        setTimeUntilNextClaim("Available now!");
        setCanClaimDaily(true);
        setNextClaimDate(null);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeUntilNextClaim(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return interval;
  };

  const claimDailyReward = async () => {
    if (!canClaimDaily) {
      alert(`You've already claimed today's reward! Next claim in: ${timeUntilNextClaim}`);
      return;
    }

    try {
      setClaimingDaily(true);
      const token = await getFirebaseToken();

      console.log("🔥 Claiming daily reward...");

      const response = await fetch("/api/wallet/daily-login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Claim response:", data);

      if (response.ok && data.success) {
        setCanClaimDaily(false);
        setStreak(data.streak);
        setUserPoints(data.newBalance);

        if (data.nextClaimAt) {
          const nextClaim = new Date(data.nextClaimAt);
          setNextClaimDate(nextClaim);
          updateCountdown(nextClaim);
        }

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);

        let message = `🎁 Daily Reward Claimed!\n\n+${data.points} points!\n`;
        message += `Current streak: ${data.streak} days\n`;
        message += `New balance: ${data.newBalance} points`;

        if (data.leveledUp) {
          message += `\n\n🎉 LEVEL UP! You reached Level ${data.level}!`;
        }

        alert(message);

        // Save to local storage for persistence across refreshes
        localStorage.setItem("lastDailyClaim", new Date().toDateString());

        await fetchWalletData();
      } else {
        setCanClaimDaily(false);

        if (data.timeRemaining) {
          const nextClaim = new Date(data.canClaimAt);
          setNextClaimDate(nextClaim);
          updateCountdown(nextClaim);
        }

        alert(data.error || "Failed to claim daily reward");
      }
    } catch (error: any) {
      console.error("Error claiming daily reward:", error);
      alert(`Failed to claim daily reward: ${error.message}`);
    } finally {
      setClaimingDaily(false);
    }
  };

  const updateUserData = (walletData: any) => {
    console.log("XXX WALLET DATA RECEIVED:", walletData);
    console.log("XXX USER REDEEMED COUPONS:", walletData.user?.redeemedCoupons);
    setWalletUser(walletData.user);
    setUserPoints(walletData.user?.totalPoints || 0);
    setLevel(walletData.user?.level || 1);
    setStreak(walletData.user?.streak || 0);
    setUserName(
      walletData.user?.name ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Player",
    );
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchWalletData();
      } else {
        setPageLoading(false);
      }
    }
  }, [user, authLoading]);



  // Check local storage on mount
  useEffect(() => {
    const localLastClaim = localStorage.getItem("lastDailyClaim");
    if (localLastClaim) {
      const today = new Date().toDateString();
      if (localLastClaim === today) {
        setCanClaimDaily(false);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setNextClaimDate(tomorrow);
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!canClaimDaily && nextClaimDate) {
      interval = updateCountdown(nextClaimDate);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [canClaimDaily, nextClaimDate]);

  const filteredRewards =
    selectedCategory === "all"
      ? rewards
      : rewards.filter((reward) => reward.category === selectedCategory);

  const handleRedeem = (reward: Reward) => {
    if (userPoints >= reward.points) {
      setSelectedReward(reward);
      setShowRedeemModal(true);
    } else {
      alert(
        `You need ${reward.points - userPoints} more points to redeem this reward!`,
      );
    }
  };

  const confirmRedeem = async () => {
    if (!selectedReward || !user) return;

    try {
      setRedeeming(true);
      const token = await getFirebaseToken();

      const response = await fetch("/api/wallet/redeem", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardId: selectedReward._id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Redemption failed");
      }

      setUserPoints(data.newBalance);
      setShowRedeemModal(false);
      setShowConfetti(true);

      fetchWalletData();

      alert(
        `🎉 Success! You've redeemed ${selectedReward.name}.\n\nYOUR CODE: ${data.couponCode}\n\nYour new balance is ${data.newBalance} points.`,
      );

      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    } catch (err: any) {
      alert(`Redemption failed: ${err.message}`);
    } finally {
      setRedeeming(false);
    }
  };

  const renderIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      FaGamepad: <FaGamepad />,
      FaUsers: <FaUsers />,
      FaCalendarAlt: <FaCalendarAlt />,
      FaShoppingCart: <FaShoppingCart />,
      FaStar: <FaStar />,
      FaFire: <FaFire />,
      FaCrown: <FaCrown />,
      FaBolt: <FaBolt />,
      FaMedal: <FaMedal />,
      FaGem: <FaGem />,
      FaGift: <FaGift />,
      FaHistory: <FaHistory />,
      FaTrophy: <FaTrophy />,
      FaCoins: <FaCoins />,
      FaInfoCircle: <FaInfoCircle />,
    };
    return iconMap[iconName] || <FaStar />;
  };



  const getCriteriaIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("purchase") || lowerType.includes("shop"))
      return <FaShoppingCart />;
    if (lowerType.includes("event")) return <FaCalendarAlt />;
    if (lowerType.includes("game") || lowerType.includes("play"))
      return <FaGamepad />;
    if (lowerType.includes("refer") || lowerType.includes("friend"))
      return <FaUsers />;
    if (lowerType.includes("login") || lowerType.includes("daily"))
      return <FaFire />;
    return <FaStar />;
  };

  const getCriteriaColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("purchase") || lowerType.includes("shop"))
      return "#FF8C00";
    if (lowerType.includes("event")) return "#4ECDC4";
    if (lowerType.includes("game") || lowerType.includes("play"))
      return "#FFCC00";
    if (lowerType.includes("refer") || lowerType.includes("friend"))
      return "#9B59B6";
    if (lowerType.includes("login") || lowerType.includes("daily"))
      return "#E74C3C";
    return "#3498DB";
  };

  const getCriteriaAction = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("purchase") || lowerType.includes("shop"))
      return "/shop";
    if (lowerType.includes("event")) return "/events";
    if (lowerType.includes("game") || lowerType.includes("play"))
      return "/play";
    return null;
  };

  if (authLoading || pageLoading) {
    return (
      <div className="wallet-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your wallet...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wallet-page">
        <div className="auth-required">
          <FaSignInAlt className="auth-icon" />
          <h2>Login Required</h2>
          <p>Please login to view your wallet and points</p>
          <div className="auth-buttons">
            <a href="/login" className="login-btn">
              <FaSignInAlt /> Login Now
            </a>
            <a href="/register" className="register-btn">
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-page">
        <div className="error-container">
          <FaExclamationCircle className="error-icon" />
          <h2>Error Loading Wallet</h2>
          <p>{error}</p>
          <button onClick={fetchWalletData} className="retry-btn">
            <FaSync /> Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="wallet-page">
      {showConfetti && (
        <div className="confetti-overlay">
          <div className="confetti">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  animationDelay: `${Math.random() * 2}s`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [
                    "#FF8C00",
                    "#FFCC00",
                    "#4ECDC4",
                    "#9B59B6",
                    "#3498DB",
                  ][Math.floor(Math.random() * 5)],
                }}
              />
            ))}
          </div>
        </div>
      )}


      {/* Header */}
      <section className="wallet-hero">
        <div className="container">
          <div className="hero-content">
            <div className="header-top">
              <h1>
                Welcome, <span className="highlight">{userName}</span>!
              </h1>
              <button onClick={fetchWalletData} className="refresh-btn">
                <FaSync /> Refresh
              </button>
            </div>
            <p className="subtitle">
              Manage your Joy Points, unlock rewards, and track your gaming
              journey!
            </p>
          </div>
        </div>
      </section>

      {/* Wallet Overview */}
      <section className="wallet-overview">
        <div className="container">
          <div className="wallet-cards">
            <div className="wallet-card primary">
              <div className="card-header">
                <FaWallet className="card-icon" />
                <h3>Total Points</h3>
              </div>
              <div className="points-display">
                <FaCoins className="points-icon" />
                <span className="points-amount">
                  {userPoints.toLocaleString()}
                </span>
                <span className="points-label">Joy Points</span>
              </div>
              <p className="card-subtitle">Keep playing to earn more!</p>
            </div>

            <div className="wallet-card secondary">
              <div className="card-header">
                <FaTrophy className="card-icon" />
                <h3>Player Level</h3>
              </div>
              <div className="level-display">
                <span className="level-number">Level {level}</span>
                <span className="level-name">{getLevelName(level)}</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getLevelProgressDisplay()}%` }}
                  />
                </div>
                <p className="level-progress">
                  {getPointsToNextLevel().toLocaleString()} points to Level{" "}
                  {level + 1}
                </p>
                <p
                  className="level-progress-detail"
                  style={{ fontSize: "12px", opacity: 0.7, marginTop: "5px" }}
                >
                  {userPoints.toLocaleString()} /{" "}
                  {getNextLevelPoints().toLocaleString()} points
                </p>
              </div>
            </div>

            {/* UPDATED: Streak card with countdown */}
            <div className="wallet-card accent">
              <div className="card-header">
                <FaFire className="card-icon" />
                <h3>Daily Streak</h3>
              </div>
              <div className="streak-display">
                <div className="streak-count">
                  <span className="streak-number">{streak}</span>
                  <span className="streak-label">days</span>
                </div>
                {canClaimDaily ? (
                  <button
                    className="claim-daily-btn available"
                    onClick={claimDailyReward}
                    disabled={claimingDaily}
                  >
                    {claimingDaily ? (
                      <>
                        <FaSync className="spinning" /> Claiming...
                      </>
                    ) : (
                      <>🎁 Claim Daily Reward</>
                    )}
                  </button>
                ) : (
                  <div className="streak-info">
                    <p className="claimed-text">
                      <FaCheck /> Already claimed today!
                    </p>
                    {timeUntilNextClaim && (
                      <p className="countdown-text">
                        Next reward in: <strong>{timeUntilNextClaim}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* My Redeemed Coupons */}
      {walletUser?.redeemedCoupons && walletUser.redeemedCoupons.length > 0 && (
        <section className="redeemed-rewards mt-8">
          <div className="container">
            <div className="section-header">
              <h2>
                My <span className="highlight">Rewards & Coupons</span>
              </h2>
              <p className="section-subtitle">
                Exclusive discounts you have unlocked
              </p>
            </div>

            <div className="rewards-grid">
              {walletUser.redeemedCoupons.map((coupon, idx) => (
                <div key={idx} className="reward-card" style={{ borderColor: '#FF8C00' }}>
                  <div
                    className="reward-icon"
                    style={{ backgroundColor: "#FF8C00" }}
                  >
                    <FaGift />
                  </div>
                  <div className="reward-content">
                    <div className="reward-header">
                      <h4>{coupon.name}</h4>
                      <span className="stock-badge available" style={{ background: '#4CAF50' }}>Active</span>
                    </div>

                    <div className="bg-zinc-900 p-3 rounded-lg my-2 border border-dashed border-zinc-700 flex justify-between items-center group cursor-pointer hover:border-orange-500 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                        alert("Coupon code copied!");
                      }}
                    >
                      <span className="font-mono font-bold text-xl text-orange-500 tracking-wider">{coupon.code}</span>
                      <FaCheck className="text-zinc-600 group-hover:text-orange-500" size={14} />
                    </div>

                    <div className="reward-footer">
                      <span className="reward-points text-white">
                        {coupon.discountType === "percentage" ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                      </span>
                      <button
                        className="redeem-btn available"
                        onClick={() => {
                          // Copy and go to cart? Or just go to cart.
                          navigator.clipboard.writeText(coupon.code);
                          window.location.href = `/cart`;
                          // I can't easily auto-fill via URL params unless CartPage supports it. 
                          // I will just redirect to cart for now.
                        }}
                      >
                        Use Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How to Earn Points */}
      <section className="earn-points">
        <div className="container">
          <div className="section-header">
            <h2>
              How to <span className="highlight">Earn Points</span>
            </h2>
            <p className="section-subtitle">
              Multiple ways to grow your Joy Points balance
            </p>
          </div>

          {pointsCriteria.length === 0 ? (
            <div className="empty-state">
              <FaInfoCircle className="empty-icon" />
              <p>Points criteria will be available soon!</p>
            </div>
          ) : (
            <div className="earn-methods">
              {pointsCriteria.map((criteria) => {
                const actionUrl = getCriteriaAction(criteria.type);
                const icon = getCriteriaIcon(criteria.type);
                const color = getCriteriaColor(criteria.type);

                return (
                  <div
                    key={criteria._id}
                    className="method-card"
                    onClick={() =>
                      actionUrl && (window.location.href = actionUrl)
                    }
                    style={{ cursor: actionUrl ? "pointer" : "default" }}
                  >
                    <div
                      className="method-icon"
                      style={{ backgroundColor: color }}
                    >
                      {icon}
                    </div>
                    <h4>{criteria.type}</h4>
                    <p className="method-points">
                      {criteria.pointsPerUnit} points
                    </p>
                    <p className="method-desc">{criteria.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Available Rewards */}
      <section className="rewards-section">
        <div className="container">
          <div className="section-header">
            <h2>
              Redeem Your <span className="highlight">Points</span>
            </h2>
            <p className="section-subtitle">Choose from exciting rewards</p>
          </div>

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  borderColor: category.color,
                  backgroundColor:
                    selectedCategory === category.id
                      ? category.color
                      : "transparent",
                  color:
                    selectedCategory === category.id
                      ? "#0B0B0B"
                      : category.color,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {rewards.length === 0 ? (
            <div className="empty-state">
              <FaGift className="empty-icon" />
              <p>No rewards available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="rewards-grid">
              {filteredRewards.map((reward) => (
                <div key={reward._id} className="reward-card">
                  <div
                    className="reward-icon"
                    style={{ backgroundColor: reward.color || "#FF8C00" }}
                  >
                    {renderIcon(reward.icon)}
                  </div>
                  <div className="reward-content">
                    <div className="reward-header">
                      <h4>{reward.name}</h4>
                      {reward.stock > 0 && reward.stock < 10 && (
                        <span className="stock-badge">
                          Only {reward.stock} left!
                        </span>
                      )}
                      {reward.stock <= 0 && (
                        <span className="stock-badge out-of-stock">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <p className="reward-desc">{reward.description}</p>
                    <div className="reward-footer">
                      <span className="reward-points">
                        <FaCoins /> {reward.points} points
                      </span>
                      {(() => {
                        const redeemedCoupon = walletUser?.redeemedCoupons?.find((c: any) => String(c.rewardId) === String(reward._id));

                        if (redeemedCoupon) {
                          return (
                            <div className="flex flex-col items-center gap-2 w-full mt-2">
                              <div
                                className="w-full bg-zinc-900 py-2 rounded border border-dashed border-orange-500 text-center font-mono font-bold text-orange-500 cursor-pointer hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(redeemedCoupon.code);
                                  alert("Code copied!");
                                }}
                                title="Click to copy"
                              >
                                <span className="text-xs text-zinc-400 font-sans font-normal uppercase tracking-wider">Code:</span>
                                {redeemedCoupon.code}
                                <FaCheck size={12} />
                              </div>
                              <button
                                className="w-full py-2 rounded font-bold bg-green-500 text-white cursor-default shadow-lg"
                                disabled
                              >
                                Redeemed
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            className={`redeem-btn ${userPoints >= reward.points && reward.stock > 0
                              ? "available"
                              : "locked"
                              }`}
                            onClick={() => handleRedeem(reward)}
                            disabled={
                              userPoints < reward.points || reward.stock <= 0
                            }
                          >
                            {userPoints >= reward.points && reward.stock > 0
                              ? "Redeem"
                              : reward.stock <= 0
                                ? "Out of Stock"
                                : "Need More Points"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Achievements */}
      <section className="achievements-section">
        <div className="container">
          <div className="section-header">
            <h2>
              Your <span className="highlight">Achievements</span>
            </h2>
            <p className="section-subtitle">
              Complete challenges to unlock exclusive rewards
            </p>
          </div>

          <div className="achievements-grid">
            {achievements.length === 0 ? (
              <div className="empty-state">
                <FaTrophy className="empty-icon" />
                <p>
                  No achievements yet. Start playing to unlock achievements!
                </p>
              </div>
            ) : (
              achievements.map((achievement) => (
                <div
                  key={achievement._id}
                  className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`}
                >
                  <div
                    className="achievement-icon"
                    style={{
                      backgroundColor: achievement.unlocked
                        ? "#FF8C00"
                        : "#2A2A2A",
                    }}
                  >
                    {renderIcon(achievement.icon)}
                  </div>
                  <div className="achievement-content">
                    <div className="achievement-header">
                      <h4>{achievement.name}</h4>
                      {achievement.unlocked && (
                        <span className="achievement-badge">Unlocked!</span>
                      )}
                    </div>
                    <p className="achievement-desc">
                      {achievement.description}
                    </p>
                    {!achievement.unlocked && (
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(achievement.progress / achievement.requirement) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="progress-text">
                          {achievement.progress} / {achievement.requirement}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="achievement-points">
                    <FaCoins />
                    <span>+{achievement.points}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>



      {/* Redemption Modal */}
      {showRedeemModal && selectedReward && (
        <div className="modal-overlay">
          <div className="redeem-modal">
            <div className="modal-header">
              <h3>Redeem Reward</h3>
              <button
                className="close-modal"
                onClick={() => setShowRedeemModal(false)}
                disabled={redeeming}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="reward-preview">
                <div
                  className="reward-preview-icon"
                  style={{ backgroundColor: selectedReward.color || "#FF8C00" }}
                >
                  {renderIcon(selectedReward.icon)}
                </div>
                <h4>{selectedReward.name}</h4>
                <p className="reward-description">
                  {selectedReward.description}
                </p>
                <div className="points-cost">
                  <FaCoins />
                  <span>{selectedReward.points} points</span>
                </div>
              </div>
              <div className="current-balance">
                <p>
                  Your current balance: <strong>{userPoints} points</strong>
                </p>
                <p>
                  After redemption:{" "}
                  <strong>{userPoints - selectedReward.points} points</strong>
                </p>
                {selectedReward.stock <= 5 && selectedReward.stock > 0 && (
                  <p className="stock-warning">
                    ⚠️ Only {selectedReward.stock} left in stock!
                  </p>
                )}
              </div>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowRedeemModal(false)}
                  disabled={redeeming}
                >
                  Cancel
                </button>
                <button
                  className="confirm-redeem"
                  onClick={confirmRedeem}
                  disabled={redeeming}
                  style={{ backgroundColor: selectedReward.color || "#FF8C00" }}
                >
                  {redeeming ? "Processing..." : "Confirm Redemption"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPointsPage;
