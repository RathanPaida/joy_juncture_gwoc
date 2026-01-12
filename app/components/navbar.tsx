// components/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { getAuth } from "firebase/auth";
import Image from "next/image";
import {
  FaUser,
  FaShoppingCart,
  FaWallet,
  FaCrown,
  FaChevronDown,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaGamepad,
  FaCalendarAlt,
  FaUsers,
  FaBook,
  FaCogs,
  FaHome,
} from "react-icons/fa";
import "./Navbar.css";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  dropdown?: NavItem[];
}

const Navbar: React.FC = () => {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [cartItems, setCartItems] = useState<number>(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getFirebaseToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    return await currentUser.getIdToken();
  };

  // Fetch user points and cart items
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const token = await getFirebaseToken();

      // Fetch user profile to get points
      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserPoints(data.profile?.totalPoints || 0);
      }

      // TODO: Fetch cart items count from your cart API
      // const cartRes = await fetch('/api/cart', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // if (cartRes.ok) {
      //   const cartData = await cartRes.json();
      //   setCartItems(cartData.items?.length || 0);
      // }

      setCartItems(0); // Default to 0 for now
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserPoints(0);
      setCartItems(0);
    }
  };

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      href: "/home",
      icon: <FaHome />,
    },
    {
      id: "store",
      label: "Store",
      href: "/store",
    },
    {
      id: "games",
      label: "Games",
      href: "/games",
      icon: <FaGamepad />,
    },
    {
      id: "events",
      label: "Events",
      href: "/events",
      icon: <FaCalendarAlt />,
      dropdown: [
        { id: "all-events", label: "All Events", href: "/events" },
      ],
    },
    {
      id: "experiences",
      label: "Experiences",
      href: "/experiences",
    },
    {
      id: "community",
      label: "Community",
      href: "/community",
      icon: <FaUsers />,
    },
    {
      id: "blog",
      label: "Blog",
      href: "/blog",
      icon: <FaBook />,
    },
    {
      id: "about",
      label: "About",
      href: "/about",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
    setIsProfileOpen(false);
  };

  if (authLoading) {
    return (
      <nav className="navbar loading">
        <div className="nav-content">
          <div className="nav-logo">Joy Juncture</div>
          <div className="loading-nav"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-content">
        {/* Logo with Image */}
        <Link href="/" className="nav-logo" onClick={closeAllDropdowns}>
          <div className="logo-container">
            {/* Using Image component with external URL */}
            <div className="logo-image">
              <img
                src="https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png" // Replace with your actual logo URL
                alt="JoyJuncture Logo"
                className="logo-img"
                onError={(e) => {
                  // Fallback if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const fallback =
                    target.parentElement?.querySelector(".logo-fallback");
                  if (fallback) {
                    (fallback as HTMLElement).style.display = "flex";
                  }
                }}
              />
              {/* Fallback logo */}
              <div className="logo-fallback">
                <span className="logo-icon">🎮</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMenuOpen ? "active" : ""}`}></span>
        </button>

        {/* Navigation Items */}
        <div className={`nav-items ${isMenuOpen ? "active" : ""}`}>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeDropdown === item.id ? "active" : ""}`}
              onMouseEnter={() =>
                window.innerWidth > 768 &&
                item.dropdown &&
                setActiveDropdown(item.id)
              }
              onMouseLeave={() =>
                window.innerWidth > 768 &&
                item.dropdown &&
                setActiveDropdown(null)
              }
            >
              <Link
                href={item.href}
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
                onClick={() => {
                  if (!item.dropdown) {
                    closeAllDropdowns();
                    setIsMenuOpen(false);
                  }
                }}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                {item.label}
                {item.dropdown && (
                  <FaChevronDown className="dropdown-chevron" />
                )}
              </Link>

              {/* Dropdown Menu */}
              {item.dropdown && activeDropdown === item.id && (
                <div className="dropdown-menu">
                  {item.dropdown.map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className="dropdown-item"
                      onClick={() => {
                        closeAllDropdowns();
                        setIsMenuOpen(false);
                      }}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="nav-actions">
          {/* Admin Dashboard Button (only for admins) */}
          {(isAdmin || user?.email === "paidarajarathan@gmail.com") && (
            <Link
              href="/admin/wallet"
              className="admin-button"
              onClick={closeAllDropdowns}
            >
              <FaCogs />
              <span className="admin-text">Admin</span>
            </Link>
          )}

          {/* Wallet Balance (only for logged in users) */}
          {user && (
            <div
              className="wallet-balance"
              onClick={() => router.push("/walletandpoints")}
            >
              <FaWallet />
              <span className="wallet-amount">
                {userPoints.toLocaleString()} pts
              </span>
            </div>
          )}

          {/* Cart Icon */}
          <Link href="/cart" className="cart-icon" onClick={closeAllDropdowns}>
            <FaShoppingCart />
            {cartItems > 0 && <span className="cart-badge">{cartItems}</span>}
          </Link>

          {/* User Profile or Auth Buttons */}
          {user ? (
            <div
              className="user-profile"
              onMouseEnter={() =>
                window.innerWidth > 768 && setIsProfileOpen(true)
              }
            >
              <button
                className="profile-button"
                onClick={toggleProfile}
                aria-label="User profile"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-default">
                    <FaUser />
                  </div>
                )}
                <FaChevronDown
                  className={`profile-chevron ${isProfileOpen ? "active" : ""}`}
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div
                  className="profile-dropdown"
                  onMouseLeave={() =>
                    window.innerWidth > 768 && setIsProfileOpen(false)
                  }
                >
                  <div className="profile-header">
                    <div className="profile-info">
                      <h4>{user.displayName || "User"}</h4>
                      <p>{user.email}</p>
                      {isAdmin && (
                        <span className="admin-badge">
                          <FaCrown /> Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="profile-links">
                    <Link
                      href="/profile"
                      className="profile-link"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <FaUser /> My Profile
                    </Link>
                    <Link
                      href="/cart"
                      className="profile-link"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <FaShoppingCart /> My Orders
                    </Link>
                    <Link
                      href="/walletandpoints"
                      className="profile-link"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <FaWallet /> My Wallet
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="profile-link admin-link"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        <FaCogs /> Admin Dashboard
                      </Link>
                    )}
                  </div>

                  <div className="profile-footer">
                    <button onClick={handleLogout} className="logout-button">
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link
                href="/login"
                className="login-button"
                onClick={closeAllDropdowns}
              >
                <FaSignInAlt /> Login
              </Link>
              <Link
                href="/register"
                className="signup-button"
                onClick={closeAllDropdowns}
              >
                <FaUserPlus /> Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
