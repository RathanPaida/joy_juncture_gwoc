"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Save, RefreshCw } from "lucide-react";
import "../dashboard/admin.css";
import "./settings.css";

interface Setting {
    _id: string;
    key: string;
    value: any;
    label: string;
    description?: string;
    type: "text" | "number" | "boolean" | "email";
    category: string;
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading, getToken } = useAuth();
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
                return;
            }
            fetchSettings();
        }
    }, [user, authLoading, router]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const res = await fetch("/api/admin/settings", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key: string, newValue: any) => {
        try {
            setSavingKey(key);
            const token = await getToken();
            if (!token) return;

            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ key, value: newValue })
            });

            if (res.ok) {
                // Optimistic update
                setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
            } else {
                alert("Failed to update setting");
            }
        } catch (error) {
            console.error("Failed to update setting", error);
        } finally {
            setSavingKey(null);
        }
    };

    // Group settings by category
    const categories = Array.from(new Set(settings.map(s => s.category)));

    if (loading || authLoading) return <div className="admin-loading">Loading...</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="admin-header-content">
                    <h1 className="admin-title">System Settings</h1>
                    <div className="admin-info">
                        <span className="admin-badge">Admin</span>
                    </div>
                </div>
            </div>

            <div className="admin-content">
                {categories.map(category => (
                    <div key={category} className="settings-section">
                        <h2 className="settings-category-title">{category}</h2>
                        <div className="settings-grid">
                            {settings.filter(s => s.category === category).map(setting => (
                                <div key={setting.key} className="setting-card">
                                    <div className="setting-header">
                                        <label className="setting-label">{setting.label}</label>
                                        {savingKey === setting.key && <RefreshCw size={14} className="animate-spin text-orange-500" />}
                                    </div>
                                    <p className="setting-description">{setting.description}</p>

                                    <div className="setting-control">
                                        {setting.type === 'boolean' ? (
                                            <div className="toggle-switch-container">
                                                <button
                                                    className={`toggle-switch ${setting.value ? 'active' : ''}`}
                                                    onClick={() => handleUpdate(setting.key, !setting.value)}
                                                >
                                                    <div className="toggle-thumb" />
                                                </button>
                                                <span className="toggle-label">{setting.value ? 'Enabled' : 'Disabled'}</span>
                                            </div>
                                        ) : (
                                            <div className="input-group">
                                                <input
                                                    type={setting.type}
                                                    value={setting.value}
                                                    onChange={(e) => {
                                                        const val = setting.type === 'number' ? Number(e.target.value) : e.target.value;
                                                        setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: val } : s));
                                                    }}
                                                    onBlur={(e) => handleUpdate(setting.key, setting.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                    className="setting-input"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
