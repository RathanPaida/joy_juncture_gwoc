"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email) {
            setError("Please enter your email address");
            setLoading(false);
            return;
        }

        console.log("🔄 Attempting password reset for:", email);
        console.log("🔧 Auth Status:", auth ? "Initialized" : "Not Initialized");
        if (auth) {
            console.log("🔧 Auth Config (partial):", {
                apiKey: auth.config?.apiKey ? "Present" : "Missing",
                apiScheme: auth.config?.apiScheme,
                apiHost: auth.config?.apiHost
            });

            // Ensure auth is ready
            try {
                console.log("⏳ Waiting for auth state readiness...");
                await auth.authStateReady();
                console.log("✅ Auth state ready");
            } catch (e) {
                console.warn("⚠️ Auth state ready check failed (non-fatal):", e);
            }
        }

        try {
            await sendPasswordResetEmail(auth, email);
            console.log("✅ Password reset email sent successfully");
            setSuccess(true);
        } catch (err: any) {
            console.error("❌ Password reset error full object:", err);
            console.error("❌ Error Code:", err.code);
            console.error("❌ Error Message:", err.message);

            if (err.code === "auth/user-not-found") {
                setError("No account found with this email address.");
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else if (err.code === "auth/network-request-failed") {
                setError("Network error. Please check your internet connection or try again later.");
            } else {
                setError("Failed to send reset email. " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="forgot-container">
                <div className="forgot-card">
                    <div className="forgot-header">
                        <h1 className="logo">
                            Joy<span className="logo-accent">Juncture</span>
                        </h1>
                    </div>

                    <div className="success-message">
                        <div className="success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h3>Check your email</h3>
                        <p>
                            We have sent a password reset link to <strong>{email}</strong>.
                            <br />
                            Please check your inbox (and spam folder) to reset your password.
                        </p>
                    </div>

                    <Link href="/login" className="reset-btn" style={{
                        display: 'block',
                        textAlign: 'center',
                        textDecoration: 'none'
                    }}>
                        Return to Login
                    </Link>

                    <div className="back-link">
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setEmail("");
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Resend email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <div className="forgot-header">
                    <h1 className="logo">
                        Joy<span className="logo-accent">Juncture</span>
                    </h1>
                    <p className="tagline">Where Thoughts Converge</p>
                    <h2>Reset Password</h2>
                    <p className="subtitle">
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-form">
                    {error && (
                        <div className="error-message">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                                required
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                            <Mail
                                size={18}
                                color="#64748b"
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="reset-btn" disabled={loading}>
                        {loading ? "Sending Link..." : "Send Reset Link"}
                    </button>

                    <div className="back-link">
                        <Link href="/login">
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <ArrowLeft size={14} /> Back to Login
                            </span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
