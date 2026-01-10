// app/(public)/walletandpoints/page.tsx - FIXED getIdToken
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuth } from 'firebase/auth'; // ADDED
import { 
  FaWallet, FaCoins, FaTrophy, FaGift, FaHistory, 
  FaGamepad, FaUsers, FaCalendarAlt, FaShoppingCart,
  FaStar, FaFire, FaCrown, FaBolt, FaMedal, FaGem,
  FaSync, FaExclamationCircle, FaSignInAlt, FaInfoCircle
} from 'react-icons/fa';
import './wallet.css';

interface Transaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  metadata?: any;
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
  achievements: any[];
}

const WalletPointsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const auth = getAuth(); // ADDED
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User Data
  const [walletUser, setWalletUser] = useState<WalletUser | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  
  // Dynamic Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pointsCriteria, setPointsCriteria] = useState<PointsCriteria[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [redeeming, setRedeeming] = useState<boolean>(false);
  
  const categories = [
    { id: 'all', name: 'All Rewards', color: '#FF8C00' },
    { id: 'discount', name: 'Discounts', color: '#4ECDC4' },
    { id: 'ticket', name: 'Event Tickets', color: '#9B59B6' },
    { id: 'bundle', name: 'Game Bundles', color: '#FFCC00' },
    { id: 'premium', name: 'Premium Access', color: '#3498DB' }
  ];

  // ADDED: Helper function to get Firebase token
  const getFirebaseToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    return await currentUser.getIdToken();
  };

  // Create wallet for new user
  const createWalletForUser = async () => {
    if (!user) throw new Error('No user found');
    
    try {
      const token = await getFirebaseToken(); // CHANGED
      
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          firebaseUid: user.uid,
          picture: user.photoURL || null
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create wallet: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    if (!user) {
      setPageLoading(false);
      return;
    }
    
    try {
      setPageLoading(true);
      setError(null);
      
      const token = await getFirebaseToken(); // CHANGED
      
      // Fetch user wallet data
      const walletRes = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (walletRes.status === 401 || walletRes.status === 404) {
        // Create wallet if not found
        await createWalletForUser();
        
        // Retry fetching after creation
        const retryRes = await fetch('/api/wallet', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!retryRes.ok) {
          throw new Error('Failed to load wallet after creation');
        }
        
        const walletData = await retryRes.json();
        updateUserData(walletData);
      } else if (walletRes.ok) {
        const walletData = await walletRes.json();
        updateUserData(walletData);
      } else {
        throw new Error('Failed to load wallet data');
      }
      
      // Fetch active rewards (public endpoint)
      const rewardsRes = await fetch('/api/wallet/rewards');
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        // Filter only active rewards for public view
        const activeRewards = (rewardsData.rewards || rewardsData || []).filter(
          (r: Reward) => r.isActive !== false
        );
        setRewards(activeRewards);
      }
      
      // Fetch achievements (requires auth)
      const achievementsRes = await fetch('/api/wallet/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        // Filter only active achievements
        const activeAchievements = (achievementsData.achievements || achievementsData || []).filter(
          (a: Achievement) => a.isActive !== false
        );
        setAchievements(activeAchievements);
      }
      
      // Fetch points criteria (public endpoint for display)
      const criteriaRes = await fetch('/api/wallet/points-criteria');
      if (criteriaRes.ok) {
        const criteriaData = await criteriaRes.json();
        // Filter only active criteria
        const activeCriteria = (criteriaData.criteria || criteriaData || []).filter(
          (c: PointsCriteria) => c.isActive !== false
        );
        setPointsCriteria(activeCriteria);
        console.log('✅ Loaded points criteria:', activeCriteria.length);
      }
      
    } catch (err: any) {
      console.error('❌ Error fetching wallet data:', err);
      setError(err.message || 'Failed to load wallet data. Please try refreshing.');
    } finally {
      setPageLoading(false);
    }
  };

  const updateUserData = (walletData: any) => {
    setWalletUser(walletData.user);
    setUserPoints(walletData.user?.totalPoints || 0);
    setLevel(walletData.user?.level || 1);
    setStreak(walletData.user?.streak || 0);
    setUserName(walletData.user?.name || user?.displayName || user?.email?.split('@')[0] || 'Player');
    setTransactions(walletData.transactions || []);
  };

  // Initial data fetch
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchWalletData();
      } else {
        setPageLoading(false);
      }
    }
  }, [user, authLoading]);

  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards.filter(reward => reward.category === selectedCategory);

  const handleRedeem = (reward: Reward) => {
    if (userPoints >= reward.points) {
      setSelectedReward(reward);
      setShowRedeemModal(true);
    } else {
      alert(`You need ${reward.points - userPoints} more points to redeem this reward!`);
    }
  };

  const confirmRedeem = async () => {
    if (!selectedReward || !user) return;
    
    try {
      setRedeeming(true);
      
      const token = await getFirebaseToken(); // CHANGED
      
      const response = await fetch('/api/wallet/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardId: selectedReward._id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Redemption failed');
      }
      
      setUserPoints(data.newBalance);
      setShowRedeemModal(false);
      setShowConfetti(true);
      
      fetchWalletData();
      
      alert(`🎉 Success! You've redeemed ${selectedReward.name}. Your new balance is ${data.newBalance} points.`);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
    } catch (err: any) {
      alert(`Redemption failed: ${err.message}`);
    } finally {
      setRedeeming(false);
    }
  };

  const getLevelProgress = () => {
    if (!walletUser) return 0;
    const levelThresholds = [0, 1000, 2000, 3000, 5000, 7500, 10000];
    const currentLevelPoints = levelThresholds[walletUser.level - 1] || 0;
    const nextLevelPoints = levelThresholds[walletUser.level] || levelThresholds[walletUser.level - 1] || 10000;
    const progress = ((walletUser.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getLevelName = (level: number) => {
    const names = ['New Player', 'Casual Gamer', 'Game Enthusiast', 'Joy Champion', 'Master Player', 'Legendary Joymaker'];
    return names[level - 1] || names[names.length - 1];
  };

  const renderIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'FaGamepad': <FaGamepad />,
      'FaUsers': <FaUsers />,
      'FaCalendarAlt': <FaCalendarAlt />,
      'FaShoppingCart': <FaShoppingCart />,
      'FaStar': <FaStar />,
      'FaFire': <FaFire />,
      'FaCrown': <FaCrown />,
      'FaBolt': <FaBolt />,
      'FaMedal': <FaMedal />,
      'FaGem': <FaGem />,
      'FaGift': <FaGift />,
      'FaHistory': <FaHistory />,
      'FaTrophy': <FaTrophy />,
      'FaCoins': <FaCoins />,
      'FaInfoCircle': <FaInfoCircle />,
    };
    return iconMap[iconName] || <FaStar />;
  };

  // Map criteria type to appropriate icon and action
  const getCriteriaIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('purchase') || lowerType.includes('shop')) return <FaShoppingCart />;
    if (lowerType.includes('event')) return <FaCalendarAlt />;
    if (lowerType.includes('game') || lowerType.includes('play')) return <FaGamepad />;
    if (lowerType.includes('refer') || lowerType.includes('friend')) return <FaUsers />;
    return <FaStar />;
  };

  const getCriteriaColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('purchase') || lowerType.includes('shop')) return '#FF8C00';
    if (lowerType.includes('event')) return '#4ECDC4';
    if (lowerType.includes('game') || lowerType.includes('play')) return '#FFCC00';
    if (lowerType.includes('refer') || lowerType.includes('friend')) return '#9B59B6';
    return '#3498DB';
  };

  const getCriteriaAction = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('purchase') || lowerType.includes('shop')) return '/shop';
    if (lowerType.includes('event')) return '/events';
    if (lowerType.includes('game') || lowerType.includes('play')) return '/play';
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
          <p className="error-help">
            If the issue persists, please try logging out and back in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-overlay">
          <div className="confetti">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                animationDelay: `${Math.random() * 2}s`,
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FF8C00', '#FFCC00', '#4ECDC4', '#9B59B6', '#3498DB'][Math.floor(Math.random() * 5)]
              }} />
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
                Welcome, <span className="highlight">{userName || user.displayName || 'Player'}</span>!
              </h1>
              <button onClick={fetchWalletData} className="refresh-btn">
                <FaSync /> Refresh
              </button>
            </div>
            <p className="subtitle">
              Manage your Joy Points, unlock rewards, and track your gaming journey!
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
                <span className="points-amount">{userPoints.toLocaleString()}</span>
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
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
                <p className="level-progress">
                  {userPoints} / {(level * 1000)} points to next level
                </p>
              </div>
            </div>

            <div className="wallet-card accent">
              <div className="card-header">
                <FaFire className="card-icon" />
                <h3>Current Streak</h3>
              </div>
              <div className="streak-display">
                <div className="streak-count">
                  <span className="streak-number">{streak}</span>
                  <span className="streak-label">days</span>
                </div>
                <p className="streak-info">
                  Visit daily for bonus points!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Earn Points - DYNAMIC */}
      <section className="earn-points">
        <div className="container">
          <div className="section-header">
            <h2>How to <span className="highlight">Earn Points</span></h2>
            <p className="section-subtitle">Multiple ways to grow your Joy Points balance</p>
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
                    onClick={() => actionUrl && (window.location.href = actionUrl)}
                    style={{ cursor: actionUrl ? 'pointer' : 'default' }}
                  >
                    <div className="method-icon" style={{ backgroundColor: color }}>
                      {icon}
                    </div>
                    <h4>{criteria.type}</h4>
                    <p className="method-points">{criteria.pointsPerUnit} points</p>
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
            <h2>Redeem Your <span className="highlight">Points</span></h2>
            <p className="section-subtitle">Choose from exciting rewards</p>
          </div>

          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  borderColor: category.color,
                  backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                  color: selectedCategory === category.id ? '#0B0B0B' : category.color
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
              {filteredRewards.map(reward => (
                <div key={reward._id} className="reward-card">
                  <div 
                    className="reward-icon" 
                    style={{ backgroundColor: reward.color || '#FF8C00' }}
                  >
                    {renderIcon(reward.icon)}
                  </div>
                  <div className="reward-content">
                    <div className="reward-header">
                      <h4>{reward.name}</h4>
                      {reward.stock > 0 && reward.stock < 10 && (
                        <span className="stock-badge">Only {reward.stock} left!</span>
                      )}
                      {reward.stock <= 0 && (
                        <span className="stock-badge out-of-stock">Out of Stock</span>
                      )}
                    </div>
                    <p className="reward-desc">{reward.description}</p>
                    <div className="reward-footer">
                      <span className="reward-points">
                        <FaCoins /> {reward.points} points
                      </span>
                      <button
                        className={`redeem-btn ${
                          userPoints >= reward.points && reward.stock > 0 ? 'available' : 'locked'
                        }`}
                        onClick={() => handleRedeem(reward)}
                        disabled={userPoints < reward.points || reward.stock <= 0}
                      >
                        {userPoints >= reward.points && reward.stock > 0 
                          ? 'Redeem' 
                          : reward.stock <= 0 
                            ? 'Out of Stock' 
                            : 'Need More Points'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Achievements - DYNAMIC */}
      <section className="achievements-section">
        <div className="container">
          <div className="section-header">
            <h2>Your <span className="highlight">Achievements</span></h2>
            <p className="section-subtitle">Complete challenges to unlock exclusive rewards</p>
          </div>

          <div className="achievements-grid">
            {achievements.length === 0 ? (
              <div className="empty-state">
                <FaTrophy className="empty-icon" />
                <p>No achievements yet. Start playing to unlock achievements!</p>
              </div>
            ) : (
              achievements.map(achievement => (
                <div 
                  key={achievement._id} 
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div 
                    className="achievement-icon"
                    style={{ backgroundColor: achievement.unlocked ? '#FF8C00' : '#2A2A2A' }}
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
                    <p className="achievement-desc">{achievement.description}</p>
                    {!achievement.unlocked && (
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(achievement.progress / achievement.requirement) * 100}%` }}
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
            <h2>Points <span className="highlight">History</span></h2>
            <p className="section-subtitle">Track your points journey</p>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <FaHistory className="empty-icon" />
              <p>No transactions yet. Start earning points!</p>
            </div>
          ) : (
            <div className="transactions-table">
              <div className="table-header">
                <div className="col-1">Description</div>
                <div className="col-2">Date</div>
                <div className="col-3">Points</div>
                <div className="col-4">Type</div>
              </div>
              <div className="table-body">
                {transactions.map(transaction => (
                  <div key={transaction._id} className="transaction-row">
                    <div className="col-1">
                      <div 
                        className="transaction-icon" 
                        style={{ 
                          backgroundColor: transaction.type === 'redeem' ? '#E74C3C' : 
                                        transaction.type === 'bonus' ? '#9B59B6' : '#2ECC71' 
                        }}
                      >
                        {transaction.type === 'purchase' ? <FaShoppingCart /> :
                         transaction.type === 'event' ? <FaCalendarAlt /> :
                         transaction.type === 'game' ? <FaGamepad /> :
                         transaction.type === 'redeem' ? <FaGift /> :
                         transaction.type === 'bonus' ? <FaStar /> : <FaCoins />}
                      </div>
                      <span className="transaction-desc">{transaction.description}</span>
                    </div>
                    <div className="col-2">
                      <span className="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="col-3">
                      <span className={`points-amount ${
                        transaction.amount > 0 ? 'earned' : 'redeemed'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </div>
                    <div className="col-4">
                      <span className={`transaction-type ${transaction.type}`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  style={{ backgroundColor: selectedReward.color || '#FF8C00' }}
                >
                  {renderIcon(selectedReward.icon)}
                </div>
                <h4>{selectedReward.name}</h4>
                <p className="reward-description">{selectedReward.description}</p>
                <div className="points-cost">
                  <FaCoins />
                  <span>{selectedReward.points} points</span>
                </div>
              </div>
              <div className="current-balance">
                <p>Your current balance: <strong>{userPoints} points</strong></p>
                <p>After redemption: <strong>{userPoints - selectedReward.points} points</strong></p>
                {selectedReward.stock <= 5 && selectedReward.stock > 0 && (
                  <p className="stock-warning">⚠️ Only {selectedReward.stock} left in stock!</p>
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
                  style={{ backgroundColor: selectedReward.color || '#FF8C00' }}
                >
                  {redeeming ? 'Processing...' : 'Confirm Redemption'}
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