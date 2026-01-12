// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  getRedirectResult 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Helper function to sync user to MongoDB
  const syncUserToMongoDB = async (user: any) => {
    try {
      const idToken = await user.getIdToken();
      
      console.log('🔄 Syncing user to MongoDB on login...', user.uid);
      
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          avatar: user.photoURL || 'https://i.pravatar.cc/150?img=12',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('⚠️ MongoDB sync failed:', errorData);
        return null;
      }

      const data = await response.json();
      console.log('✅ User synced to MongoDB on login:', data);
      return data;
    } catch (error: any) {
      console.error('❌ MongoDB sync error on login:', error);
      // Don't throw - allow login to continue even if sync fails
      return null;
    }
  };

  // Handle redirect result from Google Sign-In
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const wasGoogleSignIn = sessionStorage.getItem('googleSignInAttempt');
        if (!wasGoogleSignIn) return;

        setGoogleLoading(true);
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          sessionStorage.removeItem('googleSignInAttempt');
          const user = result.user;

          // Sync to MongoDB
          await syncUserToMongoDB(user);

          // Store user info
          localStorage.setItem("userEmail", user.email || "");
          localStorage.setItem("userName", user.displayName || "");
          localStorage.setItem("userPhoto", user.photoURL || "");

          // Check if admin
          const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
          localStorage.setItem("isAdmin", isAdmin ? "true" : "false");

          // Redirect
          if (isAdmin) {
            router.push("/admin/dashboard");
          } else {
            router.push("/home");
          }
        }
      } catch (err: any) {
        console.error("Redirect result error:", err);
        sessionStorage.removeItem('googleSignInAttempt');
        setError("Google sign-in failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    };

    handleRedirectResult();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ User logged in:", user.uid);

      // Sync to MongoDB - CRITICAL for old users
      await syncUserToMongoDB(user);

      // Check if it's admin (from .env)
      const isAdmin = email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      if (isAdmin) {
        // Store in localStorage that this is admin
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("userEmail", email);
        router.push("/admin/dashboard");
      } else {
        localStorage.setItem("isAdmin", "false");
        localStorage.setItem("userEmail", email);
        router.push("/home");
      }
    } catch (err: any) {
      console.error("Login error:", err);

      // Simple error messages
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/invalid-credential") {
        setError(
          "Incorrect Email id or password, If you are new please register",
        );
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      let result;
      
      // Try popup first
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupError: any) {
        // If popup is blocked, use redirect
        if (popupError.code === 'auth/popup-blocked') {
          console.log('Popup blocked, using redirect...');
          sessionStorage.setItem('googleSignInAttempt', 'true');
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(auth, googleProvider);
          return; // Function will complete after redirect
        }
        throw popupError;
      }

      const user = result.user;
      console.log("✅ Google login successful:", user.uid);

      // Sync to MongoDB - CRITICAL for all users
      await syncUserToMongoDB(user);

      // Store user info
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userName", user.displayName || "");
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
      console.error("Google sign-in error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "Popup was blocked by your browser. Please allow popups for this site.",
        );
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email address but different sign-in credentials.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="logo">
            Joy<span className="logo-accent">Juncture</span>
          </h1>
          <p className="tagline">Where Thoughts Converge</p>
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="options">
            <label className="remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{
              opacity: googleLoading ? 0.7 : 1,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
            }}
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
            {googleLoading ? "Signing in..." : "Sign in with Google"}
          </button>

          {googleLoading && (
            <p style={{ 
              textAlign: 'center', 
              color: '#64748B', 
              fontSize: '13px',
              marginTop: '12px'
            }}>
              Please wait, processing...
            </p>
          )}

          <p className="register-link">
            Don&apos;t have an account? <Link href="/register">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}