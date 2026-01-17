"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
    getAuth,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "firebase/auth";
import {
    Shield,
    User,
    Bell,
    Lock,
    Check,
    AlertCircle,
    ChevronRight,
    Loader,
    Eye,
    EyeOff
} from "lucide-react";
import "./settings.css";

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const auth = getAuth();

    const [activeTab, setActiveTab] = useState("security");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/settings");
        }
    }, [user, authLoading, router]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords do not match");
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) {
                throw new Error("No user found");
            }

            // 1. Re-authenticate user
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                passwordData.currentPassword
            );

            await reauthenticateWithCredential(currentUser, credential);

            // 2. Update password
            await updatePassword(currentUser, passwordData.newPassword);

            setSuccess("Password updated successfully!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (err: any) {
            console.error("Password update error:", err);
            if (err.code === "auth/wrong-password") {
                setError("Incorrect current password");
            } else if (err.code === "auth/requires-recent-login") {
                setError("Please log out and log in again to change your password.");
            } else if (err.code === "auth/weak-password") {
                setError("Password is too weak.");
            } else {
                setError("Failed to update password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="settings-page">
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
                    <Loader className="animate-spin" size={32} color="#10b981" />
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-container">
                <div className="settings-header">
                    <h1>Account Settings</h1>
                    <p>Manage your account preferences and security</p>
                </div>

                <div className="settings-grid">
                    {/* Sidebar */}
                    <div className="settings-nav">
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={18} />
                            Profile
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <Shield size={18} />
                            Security
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notifications')}
                        >
                            <Bell size={18} />
                            Notifications
                        </button>
                    </div>

                    {/* Content */}
                    <div className="settings-content">

                        {activeTab === 'security' && (
                            <div className="security-section">
                                <h2 className="section-title">Password & Security</h2>

                                {auth.currentUser?.providerData[0]?.providerId === 'google.com' ? (
                                    <div className="alert alert-info" style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#60a5fa',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'start'
                                    }}>
                                        <div style={{ paddingTop: '2px' }}>
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#fff' }}>
                                                Signed in with Google
                                            </h3>
                                            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#cbd5e1' }}>
                                                You are currently signed in with your Google account. You don't have a separate password for Joy Juncture.
                                                <br /><br />
                                                To change your password or manage security settings, please visit your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Google Account Security</a> page.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {error && (
                                            <div className="alert alert-error">
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <AlertCircle size={18} />
                                                    {error}
                                                </div>
                                            </div>
                                        )}

                                        {success && (
                                            <div className="alert alert-success">
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <Check size={18} />
                                                    {success}
                                                </div>
                                            </div>
                                        )}

                                        <form onSubmit={handleUpdatePassword}>
                                            <div className="form-group">
                                                <label>Current Password</label>
                                                <div className="input-group-relative" style={{ position: 'relative' }}>
                                                    <input
                                                        type={showCurrent ? "text" : "password"}
                                                        name="currentPassword"
                                                        value={passwordData.currentPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Enter current password"
                                                        required
                                                        style={{ width: '100%', paddingRight: '40px' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrent(!showCurrent)}
                                                        style={{
                                                            position: 'absolute',
                                                            right: '12px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#64748b',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                <span className="help-text">For your security, please verify your current password.</span>
                                            </div>

                                            <div className="form-group">
                                                <label>New Password</label>
                                                <div className="input-group-relative" style={{ position: 'relative' }}>
                                                    <input
                                                        type={showNew ? "text" : "password"}
                                                        name="newPassword"
                                                        value={passwordData.newPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Enter new password"
                                                        required
                                                        minLength={6}
                                                        style={{ width: '100%', paddingRight: '40px' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNew(!showNew)}
                                                        style={{
                                                            position: 'absolute',
                                                            right: '12px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#64748b',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Confirm New Password</label>
                                                <div className="input-group-relative" style={{ position: 'relative' }}>
                                                    <input
                                                        type={showConfirm ? "text" : "password"}
                                                        name="confirmPassword"
                                                        value={passwordData.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Confirm new password"
                                                        required
                                                        style={{ width: '100%', paddingRight: '40px' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        style={{
                                                            position: 'absolute',
                                                            right: '12px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#64748b',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <button type="submit" className="btn-primary" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <Loader size={18} className="animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={18} />
                                                        Update Password
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="profile-section">
                                <h2 className="section-title">Public Profile</h2>
                                <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                                    Manage how you appear to others on Joy Juncture.
                                </p>
                                <div className="alert alert-info" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    To edit your profile details, please visit the <a href="/profile" style={{ color: 'white', textDecoration: 'underline' }}>Profile Page</a>.
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="notifications-section">
                                <h2 className="section-title">Notification Preferences</h2>
                                <p style={{ color: '#94a3b8' }}>
                                    Coming soon...
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
