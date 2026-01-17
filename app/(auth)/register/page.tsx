"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);

  // Helper function to sync user to MongoDB
  const syncUserToMongoDB = async (user: any, additionalData: any = {}) => {
    try {
      const idToken = await user.getIdToken();

      console.log('🔄 Syncing user to MongoDB...', user.uid);

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firebaseUid: user.uid, // FIXED: Add firebaseUid
          email: user.email,
          name: additionalData.name || user.displayName || user.email?.split('@')[0],
          avatar: additionalData.avatar || user.photoURL || 'https://i.pravatar.cc/150?img=12',
          authProvider: additionalData.authProvider || 'firebase', // FIXED: Add authProvider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('⚠️ MongoDB sync failed:', errorData);
        throw new Error(errorData.message || 'Sync failed');
      }

      const data = await response.json();
      console.log('✅ User synced to MongoDB successfully:', data);
      return data;
    } catch (error: any) {
      console.error('❌ MongoDB sync error:', error);
      throw error; // FIXED: Throw error instead of returning null to handle it properly
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
          const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

          // Save to Firestore
          if (db) {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              username: user.email?.split('@')[0] || 'user',
              name: user.displayName || '',
              photoURL: user.photoURL || 'https://i.pravatar.cc/150?img=12',
              occupation: null,
              phone: null,
              dob: null,
              gender: null,
              isProfileComplete: false,
              role: isAdmin ? 'admin' : 'user',
              status: 'active',
              theme: 'dark',
              reminders: true,
              emailVerified: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }

          // Sync to MongoDB
          await syncUserToMongoDB(user, {
            name: user.displayName,
            avatar: user.photoURL,
            authProvider: 'google', // FIXED: Specify Google provider
          });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP via Backend API
  const sendOTPEmail = async (email: string, otpCode: string) => {
    try {
      console.log('🔄 Requesting OTP email via backend API...');
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP email');
      }

      console.log('✅ OTP sent successfully via backend');
      return true;
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);

      // Fallback for development if API fails (optional, good for debugging)
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ API failed. Displaying OTP in console for Dev:', otpCode);
        alert(`DEV MODE: Your OTP is ${otpCode} (Check console for details)`);
        return true;
      }

      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    // FIXED: Better email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
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
      // Generate OTP
      const otpCode = generateOTP();
      setGeneratedOtp(otpCode);

      // Send OTP to email
      await sendOTPEmail(formData.email, otpCode);

      // Store form data temporarily
      setTempUserData(formData);

      // Move to OTP verification step
      setStep('otp');
      setSuccess(`OTP sent to ${formData.email}`);

    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify OTP
      if (otp !== generatedOtp) {
        setError("Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ OTP verified! Creating account...");

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        tempUserData.email,
        tempUserData.password,
      );

      const user = userCredential.user;
      console.log("✅ User created in Firebase Auth:", user.uid);

      // Check if admin
      const isAdmin = tempUserData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      const autoUsername = tempUserData.email.split('@')[0];

      // Save to Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            username: autoUsername,
            name: tempUserData.name,
            photoURL: 'https://i.pravatar.cc/150?img=12',
            occupation: null,
            phone: null,
            dob: null,
            gender: null,
            isProfileComplete: false,
            role: isAdmin ? 'admin' : 'user',
            status: 'active',
            theme: 'dark',
            reminders: true,
            emailVerified: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log("✅ User saved to Firestore");
        } catch (firestoreError) {
          console.warn("⚠️ Firestore save failed:", firestoreError);
        }
      }

      // Sync to MongoDB - CRITICAL STEP
      try {
        await syncUserToMongoDB(user, {
          name: tempUserData.name,
          avatar: 'https://i.pravatar.cc/150?img=12',
          authProvider: 'firebase', // FIXED: Specify Firebase provider
        });
        console.log("✅ MongoDB sync successful");
      } catch (syncError: any) {
        console.error("❌ MongoDB sync failed:", syncError);
        // FIXED: Show warning but don't block registration
        alert("⚠️ Account created but sync failed. Please contact support if you experience issues.");
      }

      // Success!
      setSuccess("Account created successfully! Redirecting to login...");

      // FIXED: Clear form and wait before redirect
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setOtp("");
      setAgreeTerms(false);
      setTempUserData(null);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      console.error("❌ Registration error:", err);

      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(`Registration failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");

    const otpCode = generateOTP();
    setGeneratedOtp(otpCode);

    try {
      await sendOTPEmail(tempUserData.email, otpCode);
      setSuccess("OTP resent successfully!");
      // FIXED: Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to resend OTP");
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      // Try popup first
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupError: any) {
        // If popup is blocked, use redirect method
        if (popupError.code === 'auth/popup-blocked') {
          console.log('Popup blocked, using redirect...');
          sessionStorage.setItem('googleSignInAttempt', 'true');
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupError;
      }

      const user = result.user;
      const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      // Save to Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            username: user.email?.split('@')[0] || 'user',
            name: user.displayName || '',
            photoURL: user.photoURL || 'https://i.pravatar.cc/150?img=12',
            occupation: null,
            phone: null,
            dob: null,
            gender: null,
            isProfileComplete: false,
            role: isAdmin ? 'admin' : 'user',
            status: 'active',
            theme: 'dark',
            reminders: true,
            emailVerified: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
          console.log("✅ Google user saved to Firestore");
        } catch (firestoreError) {
          console.warn("⚠️ Firestore save failed:", firestoreError);
        }
      }

      // Sync to MongoDB
      try {
        await syncUserToMongoDB(user, {
          name: user.displayName,
          avatar: user.photoURL,
          authProvider: 'google', // FIXED: Specify Google provider
        });
      } catch (syncError: any) {
        console.error("❌ MongoDB sync failed:", syncError);
        // Continue anyway - user is authenticated
      }

      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/home");
      }
    } catch (err: any) {
      console.error("❌ Google sign-up error:", err);

      if (err.code === 'auth/popup-blocked') {
        setError("Please allow popups for this site, or we'll redirect you automatically.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-up popup was closed. Please try again.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Sign-up was cancelled.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email address but different sign-in credentials.");
      } else {
        setError(`Google sign-up failed: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // OTP Input Step
  if (step === 'otp') {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h1 className="logo">
              Joy<span className="logo-accent">Juncture</span>
            </h1>
            <h2>Verify Your Email</h2>
            <p className="subtitle">Enter the 6-digit code sent to {tempUserData?.email}</p>
          </div>

          <form onSubmit={handleVerifyOTP} className="register-form">
            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message" style={{
                padding: '12px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <span>{success}</span>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                autoFocus // FIXED: Auto-focus on OTP input
                style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '8px',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <button type="submit" className="register-btn" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading} // FIXED: Disable while loading
                style={{
                  background: 'none',
                  border: 'none',
                  color: loading ? '#94A3B8' : '#10B981',
                  textDecoration: 'underline',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Resend OTP
              </button>
              <span style={{ margin: '0 8px', color: '#64748B' }}>|</span>
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                disabled={loading} // FIXED: Disable while loading
                style={{
                  background: 'none',
                  border: 'none',
                  color: loading ? '#94A3B8' : '#10B981',
                  textDecoration: 'underline',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Change Email
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Registration Form Step
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

          {success && (
            <div className="success-message" style={{
              padding: '12px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <span>{success}</span>
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
              disabled={loading} // FIXED: Disable while loading
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
              disabled={loading} // FIXED: Disable while loading
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min. 6 characters)"
                required
                disabled={loading} // FIXED: Disable while loading
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading} // FIXED: Disable while loading
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="terms-group">
            <label className="terms-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="terms-checkbox"
                disabled={loading} // FIXED: Disable while loading
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

          <button type="submit" className="register-btn" disabled={loading || !agreeTerms}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            style={{
              opacity: (googleLoading || loading) ? 0.7 : 1,
              cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
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
            {googleLoading ? "Signing up..." : "Sign up with Google"}
          </button>

          {googleLoading && (
            <p style={{
              textAlign: 'center',
              color: '#64748B',
              fontSize: '13px',
              marginTop: '12px'
            }}>
              Please wait, redirecting to Google...
            </p>
          )}

          <p className="login-link">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}