"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, Calendar, Users, Percent, DollarSign, Tag, Filter } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

interface Coupon {
    _id: string;
    code: string;
    name: string;
    description: string;
    discountType: 'fixed' | 'percentage';
    discountValue: number;
    minPurchaseAmount: number;
    maxDiscountAmount: number | null;
    expiryDate: string;
    usageLimit: number;
    usagePerUser: number;
    category: string;
    isActive: boolean;
    usedCount: number;
}

export default function CouponAdmin() {
    const { getToken } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        discountType: 'fixed' as 'fixed' | 'percentage',
        discountValue: 0,
        minPurchaseAmount: 0,
        maxDiscountAmount: null as number | null,
        expiryDate: '',
        usageLimit: 1000,
        usagePerUser: 1,
        category: 'general',
        isActive: true,
    });

    useEffect(() => {
        fetchCoupons();
    }, [page, statusFilter, categoryFilter, searchTerm]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(categoryFilter !== 'all' && { category: categoryFilter }),
                ...(searchTerm && { search: searchTerm }),
            });

            const response = await fetch(`/api/admin/coupons?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCoupons(data.coupons);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const token = await getToken();
            const url = '/api/admin/coupons';
            const method = editingCoupon ? 'PUT' : 'POST';
            const body = editingCoupon ? { id: editingCoupon._id, ...formData } : formData;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                setShowModal(false);
                resetForm();
                fetchCoupons();
                alert(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to save coupon');
            }
        } catch (error) {
            console.error('Error saving coupon:', error);
            alert('Failed to save coupon');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        try {
            const token = await getToken();
            const response = await fetch(`/api/admin/coupons?id=${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchCoupons();
                alert('Coupon deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting coupon:', error);
            alert('Failed to delete coupon');
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minPurchaseAmount: coupon.minPurchaseAmount || 0,
            maxDiscountAmount: coupon.maxDiscountAmount || null,
            expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
            usageLimit: coupon.usageLimit,
            usagePerUser: coupon.usagePerUser,
            category: coupon.category,
            isActive: coupon.isActive,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            name: '',
            description: '',
            discountType: 'fixed',
            discountValue: 0,
            minPurchaseAmount: 0,
            maxDiscountAmount: null,
            expiryDate: '',
            usageLimit: 1000,
            usagePerUser: 1,
            category: 'general',
            isActive: true,
        });
    };

    const isExpired = (date: string) => new Date(date) < new Date();
    const isUsageLimitReached = (coupon: Coupon) => coupon.usedCount >= coupon.usageLimit;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Coupon Management</h1>
                        <p className="text-gray-400">Create and manage discount coupons</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition"
                    >
                        <Plus size={20} /> Create Coupon
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-gray-900 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                placeholder="Search coupons..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="expired">Expired</option>
                        </select>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                        >
                            <option value="all">All Categories</option>
                            <option value="general">General</option>
                            <option value="product">Product</option>
                            <option value="event">Event</option>
                            <option value="seasonal">Seasonal</option>
                            <option value="first_order">First Order</option>
                            <option value="referral">Referral</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setCategoryFilter('all');
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Coupons Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Code</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Discount</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Usage</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Expiry</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {coupons.map((coupon) => (
                                        <tr key={coupon._id} className="hover:bg-gray-800/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={16} className="text-orange-500" />
                                                    <span className="font-mono font-bold text-orange-400">{coupon.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium">{coupon.name}</div>
                                                    <div className="text-sm text-gray-400 truncate max-w-xs">{coupon.description}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {coupon.discountType === 'percentage' ? (
                                                        <>
                                                            <Percent size={14} className="text-green-500" />
                                                            <span>{coupon.discountValue}%</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign size={14} className="text-green-500" />
                                                            <span>₹{coupon.discountValue}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {coupon.minPurchaseAmount > 0 && (
                                                    <div className="text-xs text-gray-500">Min: ₹{coupon.minPurchaseAmount}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Users size={14} />
                                                        <span>{coupon.usedCount} / {coupon.usageLimit}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">Per user: {coupon.usagePerUser}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span className={`text-sm ${isExpired(coupon.expiryDate) ? 'text-red-500' : ''}`}>
                                                        {new Date(coupon.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isExpired(coupon.expiryDate) ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-red-900/30 text-red-400">Expired</span>
                                                ) : isUsageLimitReached(coupon) ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400">Limit Reached</span>
                                                ) : coupon.isActive ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400">Active</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-400">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(coupon)}
                                                        className="p-2 hover:bg-gray-700 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(coupon._id)}
                                                        className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-800">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-400">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                            <h2 className="text-2xl font-bold">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Coupon Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none font-mono"
                                        placeholder="SUMMER2024"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Category *</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                    >
                                        <option value="general">General</option>
                                        <option value="product">Product</option>
                                        <option value="event">Event</option>
                                        <option value="seasonal">Seasonal</option>
                                        <option value="first_order">First Order</option>
                                        <option value="referral">Referral</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Coupon Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                    placeholder="Summer Sale 2024"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                    rows={3}
                                    placeholder="Get 20% off on all products"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Discount Type *</label>
                                    <select
                                        required
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'fixed' | 'percentage' })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                    >
                                        <option value="fixed">Fixed Amount (₹)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Discount Value *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step={formData.discountType === 'percentage' ? '1' : '0.01'}
                                        max={formData.discountType === 'percentage' ? '100' : undefined}
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                        placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Min Purchase Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.minPurchaseAmount}
                                        onChange={(e) => setFormData({ ...formData, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Discount Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.maxDiscountAmount || ''}
                                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Total Usage Limit *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                        placeholder="1000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Usage Per User *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.usagePerUser}
                                        onChange={(e) => setFormData({ ...formData, usagePerUser: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-orange-500 focus:outline-none"
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-4 bg-gray-800/50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-700 rounded focus:ring-orange-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                                    Coupon is Active
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition"
                                >
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}