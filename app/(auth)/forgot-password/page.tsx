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

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            console.error("Password reset error:", err);
            if (err.code === "auth/user-not-found") {
                // For security reasons, we might want to show success even if user not found,
                // but for better UX in this app we'll show a specific error or generic one.
                setError("No account found with this email address.");
            } else if (err.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else {
                setError("Failed to send reset email. Please try again.");
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
