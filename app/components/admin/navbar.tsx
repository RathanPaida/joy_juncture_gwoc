// app/components/admin/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import {
  LayoutDashboard,
  Store,
  Gamepad2,
  Calendar,
  Users,
  FileText,
  Wallet,
  LogOut,
  ChevronDown,
  User,
  Settings,
  Shield,
  Bell,
  Search,
  Menu,
  X
} from "lucide-react";
import "./admin-navbar.css";

const adminMenuItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    path: "/admin/dashboard",
    color: "#ff6600"
  },
  {
    title: "Store",
    icon: <Store size={20} />,
    path: "/admin/store",
    color: "#ff9900"
  },
  {
    title: "Experiences",
    icon: <Gamepad2 size={20} />,
    path: "/admin/experiences",
    color: "#ff3300"
  },
  {
    title: "Events",
    icon: <Calendar size={20} />,
    path: "/admin/events",
    color: "#ffcc00"
  },
  {
    title: "Community",
    icon: <Users size={20} />,
    path: "/admin/community",
    color: "#ff6666"
  },
  {
    title: "Blog",
    icon: <FileText size={20} />,
    path: "/admin/blog",
    color: "#ff9966"
  },
  {
    title: "Wallet",
    icon: <Wallet size={20} />,
    path: "/admin/wallet",
    color: "#ffcc66"
  }
];

const quickActions = [
  { label: "Settings", icon: <Settings size={16} />, path: "/admin/settings" },
  { label: "Users", icon: <Users size={16} />, path: "/admin/users" },
  { label: "Analytics", icon: <LayoutDashboard size={16} />, path: "/admin/analytics" }
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");

  // Check admin role
  const checkAdminRole = async () => {
    if (!authUser) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      const response = await fetch("/api/user/role", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const userRole = data.success ? data.role : data.role;
        setIsAdmin(['admin', 'super_admin'].includes(userRole));
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  const handleQuickAction = (path: string) => {
    router.push(path);
    setIsProfileOpen(false);
  };

  useEffect(() => {
    if (authUser) {
      checkAdminRole();
    }
  }, [authUser]);

  if (!isAdmin) {
    return null; // Don't show admin navbar if not admin
  }

  return (
    <nav className="admin-navbar">
      {/* Top Bar */}
      <div className="admin-navbar-top">
        <div className="navbar-left">
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="navbar-brand">
            <Shield size={28} className="brand-icon" />
            <div className="brand-text">
              <h1 className="brand-title">Joy Juncture</h1>
              <span className="brand-subtitle">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-container">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search admin panel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>

        {/* User Actions */}
        <div className="navbar-right">
          {/* Notifications */}
          <div className="notification-bell">
            <Bell size={22} />
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </div>

          {/* User Profile */}
          <div className="user-profile-container">
            <button 
              className="user-profile-btn"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="user-avatar">
                {authUser?.displayName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="user-name">
                {authUser?.displayName || 'Admin'}
              </span>
              <ChevronDown size={16} className={`dropdown-icon ${isProfileOpen ? 'open' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {authUser?.displayName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="dropdown-user-info">
                    <h3 className="dropdown-user-name">
                      {authUser?.displayName || 'Admin User'}
                    </h3>
                    <p className="dropdown-user-email">
                      {authUser?.email || 'admin@joyjuncture.com'}
                    </p>
                    <span className="dropdown-user-role">
                      <Shield size={12} /> Admin
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="quick-actions">
                  <h4 className="quick-actions-title">Quick Actions</h4>
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      className="quick-action-btn"
                      onClick={() => handleQuickAction(action.path)}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>

                <div className="dropdown-divider"></div>

                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className={`admin-navbar-main ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-menu">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            
            return (
              <button
                key={item.title}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  router.push(item.path);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  '--item-color': item.color
                } as React.CSSProperties}
              >
                <div className="nav-icon-wrapper">
                  <div className="nav-icon" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                </div>
                <span className="nav-text">{item.title}</span>
                {isActive && <div className="nav-indicator" style={{ background: item.color }} />}
              </button>
            );
          })}
        </div>

        {/* Stats Overview */}
        <div className="nav-stats">
          <div className="stats-header">
            <h3>Quick Stats</h3>
            <span className="stats-update">Today</span>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(255, 102, 0, 0.1)' }}>
                <Users size={16} />
              </div>
              <div className="stat-content">
                <span className="stat-value">1,248</span>
                <span className="stat-label">Active Users</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(255, 153, 0, 0.1)' }}>
                <Wallet size={16} />
              </div>
              <div className="stat-content">
                <span className="stat-value">$12,480</span>
                <span className="stat-label">Revenue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
}