// app/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword as firebaseRegister,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { app } from "@/lib/firebase";

interface AuthContextType {
  user: any;
  loading: boolean;
  isAdmin: boolean;
  firebaseUser: FirebaseUser | null; // Added Firebase user reference
  getToken: () => Promise<string | null>; // Added token getter
  login: (
    email: string,
    password: string,
    isFirebase?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    isFirebase?: boolean,
  ) => Promise<void>;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  updateUserPoints: (points: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  // Centralized token getter
  const getToken = async (): Promise<string | null> => {
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    
    // Fallback to session token for local auth
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("session="))
      ?.split("=")[1];
    
    return sessionToken || null;
  };

  // REMOVED: Automatic daily login check
  // Daily rewards should only be claimed manually by the user
  // This prevents automatic claiming on every page refresh

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Firebase user is logged in, sync with MongoDB
        try {
          const token = await fbUser.getIdToken();
          const response = await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uid: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName,
              avatar: fbUser.photoURL,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              ...userData,
            });

            // REMOVED: Automatic daily login check
            // Users must manually claim their daily reward
          } else {
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
            });
          }
        } catch (error) {
          console.error("Error syncing user:", error);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
          });
        }
      } else {
        // Check for local auth session
        const sessionToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("session="))
          ?.split("=")[1];

        if (sessionToken) {
          try {
            const response = await fetch("/api/auth/me", {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
              },
            });

            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
            } else {
              setUser(null);
            }
          } catch (error) {
            console.error("Error fetching local user:", error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const login = async (
    email: string,
    password: string,
    isFirebase: boolean = false,
  ) => {
    if (isFirebase) {
      await firebaseSignIn(auth, email, password);
      // User can manually claim daily reward from wallet page
    } else {
      // Local login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      setUser(data.user);
    }
  };

  const logout = async () => {
    // Try Firebase logout first
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }

    // Clear local session
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setFirebaseUser(null);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    isFirebase: boolean = false,
  ) => {
    if (isFirebase) {
      const userCredential = await firebaseRegister(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      // User can manually claim daily reward from wallet page
    } else {
      // Local registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      setUser(data.user);
    }
  };

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // User can manually claim daily reward from wallet page
      return result.user;
    } catch (error) {
      console.error("Google login failed:", error);
      return null;
    }
  };

  const updateUserPoints = async (points: number) => {
    if (!user) return;

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/wallet/add-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "manual",
          amount: points,
          description: "Manual points update",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({ ...user, totalPoints: data.newBalance });
      }
    } catch (error) {
      console.error("Error updating points:", error);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAdmin: false,
    getToken,
    login,
    logout,
    register,
    loginWithGoogle,
    updateUserPoints,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};