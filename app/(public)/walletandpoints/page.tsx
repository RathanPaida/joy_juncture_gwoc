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

interface Transaction {
  _id: string;
  userId: string;
  type:
  | "purchase"
  | "event"
  | "game"
  | "daily_login"
  | "referral"
  | "bonus"
  | "achievement"
  | "redeem";
  amount: number;
  description: string;
  createdAt: string;
  metadata?: any;
  balance?: number;
}

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
  redeemedCoupons?: any[];
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pointsCriteria, setPointsCriteria] = useState<PointsCriteria[]>([]);

  // Transaction filters
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [transactionPage, setTransactionPage] = useState(1);
  const [totalTransactionPages, setTotalTransactionPages] = useState(1);

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

  const transactionTypes = [
    { id: "all", name: "All Transactions", icon: <FaHistory /> },
    { id: "purchase", name: "Purchases", icon: <FaShoppingCart /> },
    { id: "event", name: "Events", icon: <FaCalendarAlt /> },
    { id: "game", name: "Games", icon: <FaGamepad /> },
    { id: "daily_login", name: "Daily Login", icon: <FaFire /> },
    { id: "referral", name: "Referrals", icon: <FaUsers /> },
    { id: "bonus", name: "Bonuses", icon: <FaStar /> },
    { id: "achievement", name: "Achievements", icon: <FaTrophy /> },
    { id: "redeem", name: "Redemptions", icon: <FaGift /> },
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
        throw new Error(errorData.error ? `${errorData.error}: ${errorData.details || ''}` : `Failed to create wallet: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("❌ Wallet creation error:", error);
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  };

  const fetchTransactions = async (
    page: number = 1,
    filter: string = "all",
  ) => {
    try {
      const token = await getFirebaseToken();

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filter !== "all" && { type: filter }),
      });

      const response = await fetch(`/api/wallet/transactions?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalTransactionPages(data.pagination?.pages || 1);
        console.log("✅ Loaded transactions:", data.transactions?.length);
      }
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
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

      // Fetch transactions
      await fetchTransactions(transactionPage, transactionFilter);

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

  useEffect(() => {
    if (user) {
      fetchTransactions(transactionPage, transactionFilter);
    }
  }, [transactionPage, transactionFilter]);

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
        `🎉 Success! You've redeemed ${selectedReward.name}. Your new balance is ${data.newBalance} points.`,
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

  const getRedeemedCoupon = (rewardId: string) => {
    return walletUser?.redeemedCoupons?.find(c => c.rewardId === rewardId);
  };

  const getTransactionIcon = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      purchase: <FaShoppingCart />,
      event: <FaCalendarAlt />,
      game: <FaGamepad />,
      daily_login: <FaFire />,
      referral: <FaUsers />,
      bonus: <FaStar />,
      achievement: <FaTrophy />,
      redeem: <FaGift />,
    };
    return iconMap[type] || <FaCoins />;
  };

  const getTransactionColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      purchase: "#FF8C00",
      event: "#4ECDC4",
      game: "#FFCC00",
      daily_login: "#E74C3C",
      referral: "#9B59B6",
      bonus: "#3498DB",
      achievement: "#2ECC71",
      redeem: "#E74C3C",
    };
    return colorMap[type] || "#2ECC71";
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
                    className="claim-daily-btn"
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
              {filteredRewards.map((reward) => {
                const redeemedCoupon = getRedeemedCoupon(reward._id);
                const isRedeemed = !!redeemedCoupon;

                return (
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

                      {isRedeemed ? (
                        <div className="redeemed-info" style={{
                          background: '#f0fdf4',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px dashed #22c55e',
                          margin: '10px 0'
                        }}>
                          <p style={{ color: '#166534', fontSize: '0.9em', marginBottom: '5px' }}>
                            <FaCheck /> Redeemed! Code:
                          </p>
                          <p style={{
                            fontFamily: 'monospace',
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            color: '#15803d',
                            textAlign: 'center',
                            letterSpacing: '1px'
                          }}>
                            {redeemedCoupon?.code}
                          </p>
                          <p style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                            Status: {redeemedCoupon?.status === 'used' ? 'Used' : 'Available'}
                          </p>
                        </div>
                      ) : (
                        <div className="reward-footer">
                          <span className="reward-points">
                            <FaCoins /> {reward.points} points
                          </span>
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
                        </div>
                      )}

                      {isRedeemed && (
                        <button
                          className="redeem-btn"
                          disabled
                          style={{
                            background: '#e5e7eb',
                            color: '#6b7280',
                            cursor: 'not-allowed',
                            width: '100%',
                            marginTop: '5px'
                          }}
                        >
                          Already Redeemed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Transaction History */}
      <section className="transactions-section">
        <div className="container">
          <div className="section-header">
            <h2>
              Points <span className="highlight">History</span>
            </h2>
            <p className="section-subtitle">Track all your point activities</p>
          </div>

          <div className="transaction-filters">
            <FaFilter className="filter-icon" />
            <div className="filter-buttons">
              {transactionTypes.map((type) => (
                <button
                  key={type.id}
                  className={`filter-btn ${transactionFilter === type.id ? "active" : ""}`}
                  onClick={() => {
                    setTransactionFilter(type.id);
                    setTransactionPage(1);
                  }}
                >
                  {type.icon}
                  <span>{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <FaHistory className="empty-icon" />
              <p>
                {transactionFilter === "all"
                  ? "No transactions yet. Start earning points!"
                  : `No ${transactionFilter} transactions found.`}
              </p>
            </div>
          ) : (
            <>
              <div className="transactions-list">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="transaction-item">
                    <div
                      className="transaction-icon-wrapper"
                      style={{
                        backgroundColor: getTransactionColor(transaction.type),
                      }}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>

                    <div className="transaction-details">
                      <h4 className="transaction-description">
                        {transaction.description}
                      </h4>
                      <div className="transaction-meta">
                        <span
                          className="transaction-type-badge"
                          style={{
                            backgroundColor: `${getTransactionColor(transaction.type)}20`,
                            color: getTransactionColor(transaction.type),
                          }}
                        >
                          {transaction.type.replace("_", " ")}
                        </span>
                        <span className="transaction-date">
                          {new Date(transaction.createdAt).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>

                      {transaction.metadata &&
                        Object.keys(transaction.metadata).length > 0 && (
                          <div className="transaction-metadata">
                            {transaction.metadata.streak && (
                              <span className="meta-tag">
                                <FaFire /> Streak: {transaction.metadata.streak}{" "}
                                days
                              </span>
                            )}
                            {transaction.metadata.eventName && (
                              <span className="meta-tag">
                                <FaCalendarAlt />{" "}
                                {transaction.metadata.eventName}
                              </span>
                            )}
                            {transaction.metadata.gameName && (
                              <span className="meta-tag">
                                <FaGamepad /> {transaction.metadata.gameName}
                              </span>
                            )}
                            {transaction.metadata.productName && (
                              <span className="meta-tag">
                                <FaShoppingCart />{" "}
                                {transaction.metadata.productName}
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="transaction-amount">
                      <span
                        className={`amount ${transaction.amount > 0 ? "positive" : "negative"}`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                      <span className="amount-label">points</span>
                      {transaction.balance !== undefined && (
                        <span className="balance-info">
                          Balance: {transaction.balance}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalTransactionPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setTransactionPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={transactionPage === 1}
                  >
                    Previous
                  </button>

                  <div className="page-info">
                    Page {transactionPage} of {totalTransactionPages}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setTransactionPage((prev) =>
                        Math.min(totalTransactionPages, prev + 1),
                      )
                    }
                    disabled={transactionPage === totalTransactionPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
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
