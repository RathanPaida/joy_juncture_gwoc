"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import "../dashboard/admin.css";

interface AnalyticsData {
    totalRevenue: number;
    productRevenue: number;
    eventRevenue: number;
    revenueTrend: { name: string; revenue: number; product: number; event: number }[];
    productData: { name: string; value: number }[];
    statusData: { name: string; value: number }[];
}

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#FF4444"];

export default function AdminAnalyticsPage() {
    const router = useRouter();
    const { user, loading: authLoading, getToken } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
                return;
            }
            fetchAnalytics();
        }
    }, [user, authLoading, router]);

    const fetchAnalytics = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const res = await fetch("/api/admin/analytics/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) return <div className="admin-loading">Loading...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="admin-header-content">
                    <h1 className="admin-title">Analytics Overview</h1>
                    <div className="admin-info">
                        <span className="admin-badge">Admin</span>
                    </div>
                </div>
            </div>

            <div className="admin-content">
                {/* Revenue Cards */}
                <div className="stats-grid">
                    <div className="stat-card" style={{ borderColor: '#10b981' }}>
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>💰</div>
                        <div className="stat-info">
                            <h3>Total Revenue</h3>
                            <p className="stat-number">
                                ₹{(data?.totalRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="stat-card" style={{ borderColor: '#f97316' }}>
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🛍️</div>
                        <div className="stat-info">
                            <h3>Product Revenue</h3>
                            <p className="stat-number">
                                ₹{(data?.productRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="stat-card" style={{ borderColor: '#8b5cf6' }}>
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎟️</div>
                        <div className="stat-info">
                            <h3>Event Revenue</h3>
                            <p className="stat-number">
                                ₹{(data?.eventRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="charts-section">
                    <div className="chart-card wide">
                        <h3>Revenue Trend (6 Months)</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data?.revenueTrend || []}>
                                    <defs>
                                        <linearGradient id="colorProduct" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEvent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                    <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} />
                                    <Area type="monotone" dataKey="product" name="Product Revenue" stackId="1" stroke="#f97316" fillOpacity={1} fill="url(#colorProduct)" />
                                    <Area type="monotone" dataKey="event" name="Event Revenue" stackId="1" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorEvent)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="charts-row">
                        <div className="chart-card">
                            <h3>Top Selling Products</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data?.productData || []} layout="vertical">
                                        <XAxis type="number" stroke="#666" hide />
                                        <YAxis dataKey="name" type="category" stroke="#999" width={100} style={{ fontSize: '0.8rem' }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: "#222", border: "none" }} />
                                        <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3>Order Status Distribution</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data?.statusData || []}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {(data?.statusData || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
