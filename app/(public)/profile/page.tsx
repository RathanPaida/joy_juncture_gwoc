// app/profile/page.tsx - FIXED TO SHOW POINTS
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import {
  User,
  Mail,
  Calendar,
  Award,
  Wallet,
  ShoppingBag,
  FileText,
  Edit,
  LogOut,
  Settings,
  ArrowRight,
  Trophy,
  Star,
  Clock,
  MapPin,
  Package,
  CreditCard,
  Users,
  Coins,
  Gamepad2,
  Flame,
  Gift
} from 'lucide-react';
import './profile.css';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: string;
  totalPoints: number; // ADDED
  walletBalance: number; // ADDED
  level: number; // ADDED
  streak: number; // ADDED
  createdAt: string;
  lastLogin?: string;
  redeemedCoupons?: Array<{
    rewardId: string;
    code: string;
    name: string;
    description: string;
    discountAmount: number;
    status: 'available' | 'used';
    redeemedAt: string;
    usedAt?: string;
  }>;
}

interface RegisteredEvent {
  _id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  participants: number;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  registeredAt: string;
}

interface PurchasedProduct {
  _id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  totalAmount: number;
  purchaseDate: string;
  status: 'delivered' | 'shipped' | 'processing' | 'cancelled';
}

interface UserBlog {
  _id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  status: 'draft' | 'published';
  views: number;
  likes: number;
  publishedDate: string;
  slug: string;
}

interface WalletInfo {
  balance: number;
  totalSpent: number;
  totalEarned: number;
  transactions: number;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  metadata?: any;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'products' | 'blogs' | 'history' | 'coupons'>('events');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [userBlogs, setUserBlogs] = useState<UserBlog[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchProfileData();
      } else {
        router.push('/login?redirect=/profile');
      }
    }
  }, [user, authLoading]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No Firebase user found');
        router.push('/login');
        return;
      }

      const token = await currentUser.getIdToken();

      // Fetch all profile data in parallel
      const [profileRes, eventsRes, productsRes, blogsRes, walletRes, transactionsRes] = await Promise.all([
        fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/registered-events', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/purchased-products', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/blogs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/wallet/transactions?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setRegisteredEvents(data.events || []);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setPurchasedProducts(data.products || []);
      }

      if (blogsRes.ok) {
        const data = await blogsRes.json();
        setUserBlogs(data.blogs || []);
      }

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWalletInfo(data.wallet);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <p>Failed to load profile</p>
          <button onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-banner"></div>

        <div className="profile-info-section">
          <div className="profile-page-avatar-container">
            <div className="profile-page-avatar">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} />
              ) : (
                <User size={48} />
              )}
            </div>
            <button className="edit-avatar-btn">
              <Edit size={16} />
            </button>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{profile.displayName}</h1>
            <p className="profile-email">
              <Mail size={16} />
              {profile.email}
            </p>
            <div className="profile-meta">
              <span className="profile-role">
                <Award size={14} />
                {profile.role.toUpperCase()}
              </span>
              <span className="profile-joined">
                <Calendar size={14} />
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
              {/* ADDED: Show level and points */}
              <span className="profile-level">
                <Trophy size={14} />
                Level {profile.level || 1}
              </span>
              <span className="profile-points">
                <Coins size={14} />
                {profile.totalPoints?.toLocaleString() || 0} pts
              </span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-secondary" onClick={() => router.push('/settings')}>
              <Settings size={18} />
              Settings
            </button>
            <button className="btn-danger" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => router.push('/walletandpoints')}>
          <div className="stat-icon wallet">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <h3>Wallet Balance</h3>
            <p className="stat-value">{profile.totalPoints?.toLocaleString() || 0}</p>
            <span className="stat-link">
              View Wallet <ArrowRight size={14} />
            </span>
          </div>
        </div>

        {/* ADDED: Total Points Card
        <div className="stat-card points">
          <div className="stat-icon points-icon">
            <Coins size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Points</h3>
            <p className="stat-value"></p>
            <span className="stat-label">Joy Points earned</span>
          </div>
        </div> */}

        <div className="stat-card">
          <div className="stat-icon events">
            <Trophy size={24} />
          </div>
          <div className="stat-content">
            <h3>Events Registered</h3>
            <p className="stat-value">{registeredEvents.length}</p>
            <span className="stat-label">Total events</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-content">
            <h3>Products Bought</h3>
            <p className="stat-value">{purchasedProducts.length}</p>
            <span className="stat-label">Total purchases</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blogs">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>Blogs Written</h3>
            <p className="stat-value">{userBlogs.length}</p>
            <span className="stat-label">Published & drafts</span>
          </div>
        </div>

        {/* ADDED: Streak Card */}
        <div className="stat-card streak">
          <div className="stat-icon streak-icon">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <h3>Login Streak</h3>
            <p className="stat-value">{profile.streak || 0}</p>
            <span className="stat-label">{profile.streak === 1 ? 'day' : 'days'} in a row</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Trophy size={18} />
          Registered Events ({registeredEvents.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} />
          Purchased Products ({purchasedProducts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'blogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('blogs')}
        >
          <FileText size={18} />
          My Blogs ({userBlogs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Wallet size={18} />
          Wallet History
        </button>
        <button
          className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <Gift size={18} />
          My Coupons ({profile?.redeemedCoupons?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-list">
            {registeredEvents.length === 0 ? (
              <div className="empty-state">
                <Trophy className="empty-icon" />
                <h3>No Events Yet</h3>
                <p>You haven't registered for any events yet</p>
                <button className="btn-primary" onClick={() => router.push('/events')}>
                  Browse Events
                </button>
              </div>
            ) : (
              registeredEvents.map((event) => (
                <div key={event._id} className="event-card">
                  <div className="event-header">
                    <h3>{event.eventName}</h3>
                    <span className={`status-badge ${event.status}`}>
                      {event.status}
                    </span>
                  </div>

                  <div className="event-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>{new Date(event.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span>{event.eventLocation}</span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span>{event.participants} Participants</span>
                    </div>
                    <div className="detail-item">
                      <CreditCard size={16} />
                      <span>₹{event.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="event-footer">
                    <span className="event-date">
                      Registered on {new Date(event.registeredAt).toLocaleDateString()}
                    </span>
                    <button
                      className="btn-view"
                      onClick={() => router.push(`/events/${event.eventId}`)}
                    >
                      View Details <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="products-list">
            {purchasedProducts.length === 0 ? (
              <div className="empty-state">
                <ShoppingBag className="empty-icon" />
                <h3>No Products Yet</h3>
                <p>You haven't purchased any products yet</p>
                <button className="btn-primary" onClick={() => router.push('/shop')}>
                  Browse Shop
                </button>
              </div>
            ) : (
              purchasedProducts.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    <img src={product.productImage} alt={product.productName} />
                  </div>

                  <div className="product-info">
                    <div className="product-header">
                      <h3>{product.productName}</h3>
                      <span className={`status-badge ${product.status}`}>
                        {product.status}
                      </span>
                    </div>

                    <div className="product-details">
                      <div className="detail-row">
                        <span>Quantity:</span>
                        <strong>{product.quantity}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Price:</span>
                        <strong>₹{product.price.toLocaleString()}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Total:</span>
                        <strong className="total-amount">₹{product.totalAmount.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="product-footer">
                      <span className="purchase-date">
                        <Clock size={14} />
                        {new Date(product.purchaseDate).toLocaleDateString()}
                      </span>
                      <button
                        className="btn-view"
                        onClick={() => router.push(`/orders/${product._id}`)}
                      >
                        Track Order <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Blogs Tab */}
        {activeTab === 'blogs' && (
          <div className="blogs-list">
            {userBlogs.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-icon" />
                <h3>No Blogs Yet</h3>
                <p>You haven't written any blogs yet</p>
                <button className="btn-primary" onClick={() => router.push('/admin/blog')}>
                  Write Your First Blog
                </button>
              </div>
            ) : (
              userBlogs.map((blog) => (
                <div key={blog._id} className="blog-card">
                  <div className="blog-image">
                    {blog.coverImage ? (
                      <img src={blog.coverImage} alt={blog.title} />
                    ) : (
                      <div className="blog-placeholder">
                        <FileText size={32} />
                      </div>
                    )}
                    <span className={`blog-status ${blog.status}`}>
                      {blog.status}
                    </span>
                  </div>

                  <div className="blog-content">
                    <h3>{blog.title}</h3>
                    <p>{blog.excerpt}</p>

                    <div className="blog-stats">
                      <span>
                        <Star size={14} />
                        {blog.likes} likes
                      </span>
                      <span>
                        <Users size={14} />
                        {blog.views} views
                      </span>
                      <span>
                        <Clock size={14} />
                        {new Date(blog.publishedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="blog-actions">
                      <button
                        className="btn-view"
                        onClick={() => router.push(`/blog/${blog.slug}`)}
                      >
                        View <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="coupons-list">
            {(!profile?.redeemedCoupons || profile.redeemedCoupons.length === 0) ? (
              <div className="empty-state">
                <Gift className="empty-icon" />
                <h3>No Coupons Yet</h3>
                <p>Redeem your Joy Points for exciting rewards!</p>
                <button className="btn-primary" onClick={() => router.push('/walletandpoints')}>
                  Go to Wallet
                </button>
              </div>
            ) : (
              <div className="coupons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {profile.redeemedCoupons.map((coupon, index) => (
                  <div key={index} className="coupon-card" style={{
                    background: '#1a1a1a',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #333',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div className="coupon-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <span className={`coupon-status ${coupon.status}`} style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        background: coupon.status === 'available' ? '#22c55e20' : '#ef444420',
                        color: coupon.status === 'available' ? '#22c55e' : '#ef4444'
                      }}>
                        {coupon.status}
                      </span>
                      <Gift size={20} color="#fca311" />
                    </div>

                    <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>{coupon.name}</h3>
                    <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>{coupon.description}</p>

                    <div className="coupon-code-box" style={{
                      background: '#000',
                      padding: '15px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px dashed #444',
                      marginBottom: '15px'
                    }}>
                      <span style={{
                        color: '#fca311',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        fontFamily: 'monospace'
                      }}>
                        {coupon.code}
                      </span>
                    </div>

                    <div className="coupon-footer" style={{
                      fontSize: '12px',
                      color: '#666',
                      borderTop: '1px solid #333',
                      paddingTop: '15px'
                    }}>
                      Redeemed on {new Date(coupon.redeemedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-list">

            <div className="filter-controls" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Transactions', icon: <Wallet size={16} /> },
                { id: 'purchase', label: 'Purchases', icon: <ShoppingBag size={16} /> },
                { id: 'event', label: 'Events', icon: <Calendar size={16} /> },
                { id: 'game', label: 'Games', icon: <Gamepad2 size={16} /> },
                { id: 'daily_login', label: 'Daily Login', icon: <Flame size={16} /> },
                { id: 'referral', label: 'Referrals', icon: <Users size={16} /> },
                { id: 'bonus', label: 'Bonuses', icon: <Star size={16} /> },
                { id: 'achievement', label: 'Achievements', icon: <Trophy size={16} /> },
                { id: 'redeem', label: 'Redemptions', icon: <Gift size={16} /> }
              ].map(filter => (
                <button
                  key={filter.id}
                  className={`filter-btn ${filterType === filter.id ? 'active' : ''}`}
                  onClick={() => setFilterType(filter.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '24px',
                    border: '1px solid #333',
                    background: filterType === filter.id ? '#fca311' : 'rgba(255, 255, 255, 0.05)',
                    color: filterType === filter.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>

            {transactions
              .filter(t => filterType === 'all' || t.type === filterType)
              .length === 0 ? (
              <div className="empty-state">
                <Wallet className="empty-icon" />
                <h3>No History Found</h3>
                <p>No transactions found for this category</p>
              </div>
            ) : (
              transactions
                .filter(t => filterType === 'all' || t.type === filterType)
                .map((t) => (
                  <div key={t._id} className="transaction-card" style={{
                    background: '#1a1a1a',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: `4px solid ${t.type === 'purchase' || t.type === 'redeem' ? '#ef4444' : '#22c55e'
                      }`
                  }}>
                    <div className="t-info">
                      <div className="t-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span className="t-type" style={{
                          textTransform: 'capitalize',
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#333',
                          color: '#bbb'
                        }}>{t.type}</span>
                        <span className="t-date" style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(t.createdAt).toLocaleDateString()} • {new Date(t.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{t.description}</h4>
                    </div>

                    <div className="t-amount" style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: t.amount >= 0 ? '#22c55e' : '#ef4444'
                    }}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}