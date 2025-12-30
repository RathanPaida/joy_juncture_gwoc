'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import './login.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Sign out the user
        await auth.signOut();
        setError('Please verify your email before logging in. Check your inbox for verification link.');
        return;
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.log('Login error code:', error.code);
      console.log('Login error message:', error.message);
      
      let errorMessage = 'Failed to sign in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please sign up first.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message || 'Failed to sign in';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled');
      } else {
        setError('Failed to sign in with Google');
      }
      console.error('Google login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopLogin = async () => {
    alert('Shop login would be implemented here');
  };

  return (
    <div className="auth-container">
      {/* Large background logo */}
      <div className="background-logo">
        <Image 
          src="/logo.svg" 
          alt="Joy Juncture" 
          width={300}
          height={300}
          className="logo-image"
          priority
        />
      </div>
      
      {/* Small floating logos */}
      <div className="background-logos">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="logo-bubble" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            transform: `scale(${0.08 + Math.random() * 0.15})`
          }}>
            <Image 
              src="/logo-icon.svg" 
              alt="JJ" 
              width={40}
              height={40}
              className="bubble-icon"
            />
          </div>
        ))}
      </div>
      
      <div className="auth-card">
        {/* Top logo on card */}
        <div className="top-logo">
          <Image 
            src="/logo-icon.svg" 
            alt="Joy Juncture" 
            width={40}
            height={40}
            className="card-logo"
            priority
          />
        </div>
        
        <div className="auth-header">
          <h1 className="auth-title">Joy Juncture</h1>
          <p className="auth-subtitle">Welcome back! Sign in to continue</p>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            {error.includes('verify your email') && (
              <div className="email-verification-tip">
                <p>Didn't receive the verification email?</p>
                <button 
                  className="resend-verification-btn"
                  onClick={() => router.push('/register')}
                >
                  Sign up again to resend
                </button>
              </div>
            )}
          </div>
        )}

        <div className="social-login-section">
          <button 
            className="social-button shop-button" 
            onClick={handleShopLogin}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            Sign in with Shop
          </button>

          <button 
            className="social-button google-button" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handlePasswordLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              type="email" 
              id="email" 
              className="form-input" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              className="form-input" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Link href="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <span className="button-loading">
                <span className="loading-spinner"></span>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="policy-text">
            By continuing, you agree to our <Link href="/terms" className="policy-link">Terms</Link> and <Link href="/privacy" className="policy-link">Privacy Policy</Link>
          </p>
          
          <p className="auth-switch">
            Don't have an account? <Link href="/register" className="switch-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;