// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import "./admin.css";

export default function AdminDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const email = localStorage.getItem("userEmail") || "";

    if (!isAdmin) {
      router.push("/");
      return;
    }

    setUserEmail(email);
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Admin Dashboard</h1>
          <div className="admin-info">
            <span className="admin-email">{userEmail}</span>
            <span className="admin-badge">Admin</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="welcome-section">
          <h2>Welcome, Administrator!</h2>
          <p>Manage your website from here.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-number">1,234</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <h3>Blog Posts</h3>
              <p className="stat-number">56</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-info">
              <h3>Total Views</h3>
              <p className="stat-number">12.5K</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-info">
              <h3>Comments</h3>
              <p className="stat-number">342</p>
            </div>
          </div>
        </div>

        <div className="actions-grid">
          <button className="action-btn primary">
            <span className="action-icon">➕</span>
            <span>Add New Blog</span>
          </button>
          <button className="action-btn secondary">
            <span className="action-icon">👥</span>
            <span>Manage Users</span>
          </button>
          <button className="action-btn warning">
            <span className="action-icon">⚙️</span>
            <span>Settings</span>
          </button>
          <button className="action-btn success">
            <span className="action-icon">📊</span>
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
