// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/app/contexts/AuthContext";
import { signOut } from "firebase/auth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import "./admin.css";

interface DashboardStats {
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };
  userGrowth: { name: string; users: number }[];
  activityData: { name: string; active: number }[];
  roleData: { name: string; value: number }[];
}

const COLORS = ["#ff8c00", "#ffaa00", "#ff4400", "#ea580c"];

export default function AdminDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const { user, loading: authLoading, getToken } = useAuth(); // Use useAuth hook

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      checkAdminRole();
    }
  }, [user, authLoading, router]);

  const checkAdminRole = async () => {
    try {
      if (!user) return;

      const token = await getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/user/role", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const isAdmin = ["admin", "super_admin"].includes(data.role);

        if (!isAdmin) {
          router.push("/");
          return;
        }

        setUserEmail(user.email || "");
        fetchStats();
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      router.push("/");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

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
          <h2>Welcome Back!</h2>
          <p>Here's what's happening with your platform today.</p>
        </div>

        {/* Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-number">
                {stats?.summary.totalUsers.toLocaleString() || "..."}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <h3>Active Users (30d)</h3>
              <p className="stat-number">
                {stats?.summary.activeUsers.toLocaleString() || "..."}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <h3>New Users (7d)</h3>
              <p className="stat-number">
                {stats?.summary.newUsers.toLocaleString() || "..."}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card wide">
            <h3>User Growth Trend</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.userGrowth || []}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ff8c00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#222", border: "none", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#ff8c00"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>User Activity (7 Days)</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.activityData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: "#222", border: "none", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="active" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3>User Roles Distribution</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats?.roleData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.roleData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#222", border: "none", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Actions Grid */}
        <div className="actions-grid">
          <button
            className="action-btn primary"
            onClick={() => router.push("/admin/products")}
          >
            <span className="action-icon">🛍️</span>
            <span>Manage Products</span>
          </button>
          <button
            className="action-btn secondary"
            onClick={() => router.push("/admin/users")}
          >
            <span className="action-icon">👥</span>
            <span>Manage Users</span>
          </button>
          <button
            className="action-btn warning"
            onClick={() => router.push("/admin/settings")}
          >
            <span className="action-icon">⚙️</span>
            <span>Settings</span>
          </button>
          <button
            className="action-btn success"
            onClick={() => router.push("/admin/analytics")}
          >
            <span className="action-icon">📊</span>
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
