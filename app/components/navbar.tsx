// components/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { getAuth } from "firebase/auth";
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
  FaTimes,
  FaBars,
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
  const [scrolled, setScrolled] = useState(false);

  const getFirebaseToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    return await currentUser.getIdToken();
  };

  // Handle scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Fetch user points and cart items
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const token = await getFirebaseToken();

      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserPoints(data.profile?.totalPoints || 0);
      }

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
      href: "/zone",
      icon: <FaGamepad />,
    },
    {
      id: "events",
      label: "Events",
      href: "/events",
      icon: <FaCalendarAlt />,
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
      setIsMenuOpen(false);
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
    setIsMenuOpen(false);
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
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-content">
        {/* Logo */}
        <Link href="/" className="nav-logo" onClick={closeAllDropdowns}>
          <div className="logo-container">
            <div className="logo-image">
              <img
                src="https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png"
                alt="JoyJuncture Logo"
                className="logo-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const fallback =
                    target.parentElement?.querySelector(".logo-fallback");
                  if (fallback) {
                    (fallback as HTMLElement).style.display = "flex";
                  }
                }}
              />
              <div className="logo-fallback">
                <span className="logo-icon">🎮</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Items */}
        <div className="nav-items desktop-nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeDropdown === item.id ? "active" : ""}`}
              onMouseEnter={() => item.dropdown && setActiveDropdown(item.id)}
              onMouseLeave={() => item.dropdown && setActiveDropdown(null)}
            >
              <Link
                href={item.href}
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
                onClick={() => !item.dropdown && closeAllDropdowns()}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                {item.label}
                {item.dropdown && (
                  <FaChevronDown className="dropdown-chevron" />
                )}
              </Link>

              {item.dropdown && activeDropdown === item.id && (
                <div className="dropdown-menu">
                  {item.dropdown.map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className="dropdown-item"
                      onClick={closeAllDropdowns}
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
          {/* Admin Dashboard Button (Desktop) */}
          {(isAdmin || user?.email === "paidarajarathan@gmail.com") && (
            <Link
              href="/admin/wallet"
              className="admin-button desktop-only"
              onClick={closeAllDropdowns}
            >
              <FaCogs />
              <span className="admin-text">Admin</span>
            </Link>
          )}

          {/* Wallet Balance (Desktop) */}
          {user && (
            <button
              className="wallet-balance desktop-only"
              onClick={() => {
                router.push("/walletandpoints");
                closeAllDropdowns();
              }}
            >
              <FaWallet />
              <span className="wallet-amount">
                {userPoints.toLocaleString()} pts
              </span>
            </button>
          )}

          {/* Cart Icon */}
          <Link href="/cart" className="cart-icon" onClick={closeAllDropdowns}>
            <FaShoppingCart />
            {cartItems > 0 && <span className="cart-badge">{cartItems}</span>}
          </Link>

          {/* Desktop User Profile */}
          {user ? (
            <div
              className="user-profile desktop-only"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <button className="profile-button" aria-label="User profile">
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

              {isProfileOpen && (
                <div className="profile-dropdown">
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
                      onClick={closeAllDropdowns}
                    >
                      <FaUser /> My Profile
                    </Link>
                    <Link
                      href="/cart"
                      className="profile-link"
                      onClick={closeAllDropdowns}
                    >
                      <FaShoppingCart /> My Orders
                    </Link>
                    <Link
                      href="/walletandpoints"
                      className="profile-link"
                      onClick={closeAllDropdowns}
                    >
                      <FaWallet /> My Wallet
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="profile-link admin-link"
                        onClick={closeAllDropdowns}
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
            <div className="auth-buttons desktop-only">
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

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? "active" : ""}`}>
        <div className="mobile-menu-content">
          {/* Mobile User Info */}
          {user && (
            <div className="mobile-user-info">
              <div className="mobile-user-avatar">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="mobile-avatar-img"
                  />
                ) : (
                  <div className="mobile-avatar-default">
                    <FaUser />
                  </div>
                )}
              </div>
              <div className="mobile-user-details">
                <h4>{user.displayName || "User"}</h4>
                <p>{user.email}</p>
                {isAdmin && (
                  <span className="mobile-admin-badge">
                    <FaCrown /> Admin
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mobile Wallet */}
          {user && (
            <Link
              href="/walletandpoints"
              className="mobile-wallet"
              onClick={closeAllDropdowns}
            >
              <FaWallet />
              <span>Wallet Balance</span>
              <span className="mobile-wallet-amount">
                {userPoints.toLocaleString()} pts
              </span>
            </Link>
          )}

          {/* Mobile Navigation Items */}
          <div className="mobile-nav-items">
            {navItems.map((item) => (
              <div key={item.id} className="mobile-nav-item">
                {item.dropdown ? (
                  <>
                    <button
                      className="mobile-nav-link"
                      onClick={() => toggleDropdown(item.id)}
                    >
                      {item.icon && (
                        <span className="mobile-nav-icon">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                      <FaChevronDown
                        className={`mobile-dropdown-chevron ${activeDropdown === item.id ? "active" : ""}`}
                      />
                    </button>
                    {activeDropdown === item.id && (
                      <div className="mobile-dropdown">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.id}
                            href={subItem.href}
                            className="mobile-dropdown-item"
                            onClick={closeAllDropdowns}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`mobile-nav-link ${pathname === item.href ? "active" : ""}`}
                    onClick={closeAllDropdowns}
                  >
                    {item.icon && (
                      <span className="mobile-nav-icon">{item.icon}</span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Mobile User Actions */}
          {user ? (
            <div className="mobile-user-actions">
              <Link
                href="/profile"
                className="mobile-action-link"
                onClick={closeAllDropdowns}
              >
                <FaUser /> My Profile
              </Link>
              <Link
                href="/cart"
                className="mobile-action-link"
                onClick={closeAllDropdowns}
              >
                <FaShoppingCart /> My Orders
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="mobile-action-link admin"
                  onClick={closeAllDropdowns}
                >
                  <FaCogs /> Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="mobile-logout-button">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          ) : (
            <div className="mobile-auth-buttons">
              <Link
                href="/login"
                className="mobile-login-button"
                onClick={closeAllDropdowns}
              >
                <FaSignInAlt /> Login
              </Link>
              <Link
                href="/register"
                className="mobile-signup-button"
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