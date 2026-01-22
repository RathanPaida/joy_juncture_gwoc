"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FaStore,
  FaStar,
  FaInfoCircle,
} from "react-icons/fa";
import "./Navbar.css";

// Move NavItem type here to avoid import issues
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  dropdown?: Omit<NavItem, 'dropdown' | 'icon'>[];
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const Navbar: React.FC = () => {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userData, setUserData] = useState({ points: 0, cartItems: 0 });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration issue by tracking client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getFirebaseToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    return await currentUser.getIdToken();
  }, [auth]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await getFirebaseToken();

      // Fetch user profile to get points
      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });

      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserData(prev => ({
          ...prev,
          points: data.profile?.totalPoints || 0
        }));
      }

      // Fetch cart items count
      const cartRes = await fetch('/api/cart/count', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setUserData(prev => ({
          ...prev,
          cartItems: cartData.count || 0
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getFirebaseToken]);

  // Debounced fetch user data
  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserData({ points: 0, cartItems: 0 });
    }
  }, [user, fetchUserData]);

  // Navigation items - moved inside component to avoid hydration issues
  const navItems = useMemo<NavItem[]>(() => [
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
      icon: <FaStore />,
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
      dropdown: [
        { id: "all-events", label: "All Events", href: "/events" },
        { id: "upcoming-events", label: "Upcoming Events", href: "/events/upcoming" },
        { id: "past-events", label: "Past Events", href: "/events/past" },
        { id: "registered-events", label: "Registered Events", href: "/events/registered", requiresAuth: true },
      ],
    },
    {
      id: "experiences",
      label: "Experiences",
      href: "/experiences",
      icon: <FaStar />,
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
      icon: <FaInfoCircle />,
    },
  ], []);

  // Filter nav items based on authentication and admin status
  const filteredNavItems = useMemo(() => {
    return navItems.map(item => {
      if (!item.dropdown) return item;

      return {
        ...item,
        dropdown: item.dropdown.filter(subItem => {
          if (subItem.requiresAuth && !user) return false;
          if (subItem.adminOnly && !isAdmin) return false;
          return true;
        })
      };
    });
  }, [navItems, user, isAdmin]);

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
  };

  const handleMenuToggle = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);

    if (newState) {
      setIsProfileOpen(false);
      setActiveDropdown(null);
    }
  };

  const handleNavLinkClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.dropdown && window.innerWidth <= 768) {
      e.preventDefault();
      toggleDropdown(item.id);
    } else {
      closeAllDropdowns();
      setIsMenuOpen(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <nav className="navbar loading">
        <div className="nav-content">
          <div className="nav-logo">
            <div className="logo-container">
              <div className="logo-skeleton"></div>
              <div className="logo-text-skeleton"></div>
            </div>
          </div>
          <div className="nav-actions-skeleton">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-content">
        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={handleMenuToggle}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span className={`hamburger ${isMenuOpen ? "active" : ""}`}></span>
        </button>

        {/* Logo - FIXED: Use consistent text rendering */}
        <Link href="/" className="nav-logo" onClick={closeAllDropdowns}>
          <div className="logo-container">
            <div className="logo-image">
              {/* Use a local image or absolute URL to avoid hydration mismatch */}
              {isMounted ? (
                <Image
                  src="/logo.png"
                  alt="JoyJuncture Logo"
                  width={48}
                  height={48}
                  className="logo-img"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.parentElement?.querySelector(".logo-fallback");
                    if (fallback) {
                      (fallback as HTMLElement).style.display = "flex";
                    }
                  }}
                />
              ) : (
                <div className="logo-img-placeholder"></div>
              )}
              <div className="logo-fallback">
                <span className="logo-icon">🎮</span>
              </div>
            </div>
            <span className="logo-text">JoyJuncture</span>
          </div>
        </Link>

        {/* Navigation Items */}
        <div className={`nav-items ${isMenuOpen ? "active" : ""}`}>
          {filteredNavItems.map((item) => (
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
                className={`nav-link ${pathname.startsWith(item.href) ? "active" : ""}`}
                onClick={(e) => handleNavLinkClick(e, item)}
                aria-haspopup={item.dropdown ? "true" : "false"}
                aria-expanded={activeDropdown === item.id}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                {item.label}
                {item.dropdown && (
                  <FaChevronDown className="dropdown-chevron" />
                )}
              </Link>

              {/* Dropdown Menu */}
              {item.dropdown && item.dropdown.length > 0 && activeDropdown === item.id && (
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

        {/* Right Side Actions - Use isMounted to prevent hydration mismatch */}
        <div className="nav-actions">
          {/* Admin Dashboard Button */}
          {isMounted && isAdmin && (
            <Link
              href="/admin/dashboard"
              className="admin-button"
              onClick={closeAllDropdowns}
            >
              <FaCogs />
              <span className="admin-text">Admin</span>
            </Link>
          )}

          {/* Wallet Balance - only show when mounted */}
          {isMounted && user && (
            <div
              className="wallet-balance"
              onClick={() => {
                router.push("/wallet");
                closeAllDropdowns();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  router.push("/wallet");
                  closeAllDropdowns();
                }
              }}
            >
              <FaWallet />
              <span className="wallet-amount">
                {isLoading ? (
                  <span className="loading-dots"></span>
                ) : (
                  `${userData.points.toLocaleString()} pts`
                )}
              </span>
            </div>
          )}

          {/* Cart Icon */}
          {isMounted && (
            <Link
              href="/cart"
              className="cart-icon"
              onClick={closeAllDropdowns}
              aria-label={`Shopping cart with ${userData.cartItems} items`}
            >
              <FaShoppingCart />
              {userData.cartItems > 0 && (
                <span className="cart-badge">
                  {userData.cartItems > 99 ? '99+' : userData.cartItems}
                </span>
              )}
            </Link>
          )}

          {/* User Profile or Auth Buttons */}
          {isMounted ? (
            user ? (
              <div
                className="user-profile"
                onMouseEnter={() =>
                  window.innerWidth > 768 && setIsProfileOpen(true)
                }
                onMouseLeave={() =>
                  window.innerWidth > 768 && setIsProfileOpen(false)
                }
              >
                <button
                  className="profile-button"
                  onClick={toggleProfile}
                  aria-label="User profile"
                  aria-expanded={isProfileOpen}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User avatar"}
                      className="profile-avatar"
                      loading="lazy"
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
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        <FaUser /> My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="profile-link"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        <FaShoppingCart /> My Orders
                      </Link>
                      <Link
                        href="/wallet"
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
                          href="/admin/dashboard"
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
                      <button
                        onClick={handleLogout}
                        className="logout-button"
                        aria-label="Logout"
                      >
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
                  <FaSignInAlt /> <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="signup-button"
                  onClick={closeAllDropdowns}
                >
                  <FaUserPlus /> <span>Sign Up</span>
                </Link>
              </div>
            )
          ) : (
            // Fallback for server-side rendering
            <div className="auth-buttons">
              <div className="login-button">
                <FaSignInAlt /> <span>Login</span>
              </div>
              <div className="signup-button">
                <FaUserPlus /> <span>Sign Up</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navbar;