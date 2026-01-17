"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Search, ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import "../dashboard/admin.css"; // Reuse dashboard styles
import "./users.css";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    totalPoints: number;
    createdAt: string;
    lastLogin?: string;
}

interface Pagination {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, loading: authLoading, getToken } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10
    });

    // Verify Admin
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
                return;
            }
            // Admin check is handled by the API response implicitly, 
            // but explicit check is better. Relying on layout for now.
            fetchUsers(1, "");
        }
    }, [user, authLoading, router]);

    const fetchUsers = async (page: number, query: string) => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const res = await fetch(`/api/admin/users?page=${page}&limit=10&query=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(1, searchQuery);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchUsers(newPage, searchQuery);
        }
    };

    if (authLoading) return <div className="admin-loading">Loading...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="admin-header-content">
                    <h1 className="admin-title">Manage Users</h1>
                    <div className="admin-info">
                        <span className="admin-badge">Admin</span>
                    </div>
                </div>
            </div>

            <div className="admin-content">
                {/* Search Bar */}
                <div className="users-actions-bar">
                    <form onSubmit={handleSearch} className="users-search-form">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="users-search-input"
                        />
                    </form>
                </div>

                {/* Users Table */}
                <div className="users-table-container">
                    {loading ? (
                        <div className="users-loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Points</th>
                                    <th>Joined</th>
                                    <th>Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td>
                                            <div className="user-cell-info">
                                                <div className="user-avatar-small">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="user-name">{u.name}</div>
                                                    <div className="user-email">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${u.role}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="font-mono text-orange-400">
                                            {u.totalPoints.toLocaleString()}
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="pagination-controls">
                    <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="pagination-btn"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="pagination-info">
                        Page {pagination.currentPage} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.pages}
                        className="pagination-btn"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
