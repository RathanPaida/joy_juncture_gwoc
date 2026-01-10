// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Simple validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // Create user with Firebase
      await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // Store in localStorage
      localStorage.setItem("userName", formData.name);
      localStorage.setItem("userEmail", formData.email);

      // Check if admin (from .env)
      const isAdmin = formData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      localStorage.setItem("isAdmin", isAdmin ? "true" : "false");

      // Redirect
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/home");
      }
    } catch (err: any) {
      console.error("Registration error:", err);

      // Simple error messages
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Store user info
      localStorage.setItem("userName", user.displayName || "");
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userPhoto", user.photoURL || "");

      // Check if admin (compare with .env email)
      const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      localStorage.setItem("isAdmin", isAdmin ? "true" : "false");

      // Redirect
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/home");
      }
    } catch (err: any) {
      console.error("Google sign-up error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-up popup was closed. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Popup was blocked by your browser. Please allow popups for this site.",
        );
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Sign-up was cancelled.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError(
          "An account already exists with the same email address but different sign-in credentials.",
        );
      } else {
        setError("Failed to sign up with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="logo">
            Joy<span className="logo-accent">Juncture</span>
          </h1>
          <p className="tagline">Where Thoughts Converge</p>
          <h2>Create Account</h2>
          <p className="subtitle">Join our community of thinkers</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 6 characters)"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="terms-group">
            <label className="terms-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="terms-checkbox"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="terms-link">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="terms-link">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? "Signing up..." : "Sign up with Google"}
          </button>

          <p className="login-link">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
