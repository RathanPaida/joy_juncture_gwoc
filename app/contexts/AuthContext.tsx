// // context/AuthContext.tsx
// 'use client';

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { 
//   getAuth, 
//   onAuthStateChanged, 
//   User as FirebaseUser,
//   signInWithEmailAndPassword as firebaseSignIn,
//   signOut as firebaseSignOut,
//   createUserWithEmailAndPassword as firebaseRegister,
//   updateProfile,
//   GoogleAuthProvider,
//   signInWithPopup
// } from 'firebase/auth';
// import { app } from '@/lib/firebase';

// interface AuthContextType {
//   user: any;
//   loading: boolean;
//   login: (email: string, password: string, isFirebase?: boolean) => Promise<void>;
//   logout: () => Promise<void>;
//   register: (email: string, password: string, name: string, isFirebase?: boolean) => Promise<void>;
//   loginWithGoogle: () => Promise<FirebaseUser | null>;
//   updateUserPoints: (points: number) => Promise<void>;
  
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const auth = getAuth(app);
//   const googleProvider = new GoogleAuthProvider();

//   useEffect(() => {
//     // Check Firebase auth first
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         // Firebase user is logged in, sync with MongoDB
//         try {
//           const token = await firebaseUser.getIdToken();
//           const response = await fetch('/api/auth/sync', {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//               uid: firebaseUser.uid,
//               email: firebaseUser.email,
//               name: firebaseUser.displayName,
//               avatar: firebaseUser.photoURL
//             })
//           });
          
//           if (response.ok) {
//             const userData = await response.json();
//             setUser({ ...firebaseUser, ...userData });
//           } else {
//             setUser(firebaseUser);
//           }
//         } catch (error) {
//           console.error('Error syncing user:', error);
//           setUser(firebaseUser);
//         }
//       } else {
//         // Check for local auth session
//         const sessionToken = document.cookie
//           .split('; ')
//           .find(row => row.startsWith('session='))
//           ?.split('=')[1];
        
//         if (sessionToken) {
//           try {
//             const response = await fetch('/api/auth/me', {
//               headers: {
//                 'Authorization': `Bearer ${sessionToken}`
//               }
//             });
            
//             if (response.ok) {
//               const userData = await response.json();
//               setUser(userData);
//             }
//           } catch (error) {
//             console.error('Error fetching local user:', error);
//           }
//         } else {
//           setUser(null);
//         }
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, [auth]);

//   const login = async (email: string, password: string, isFirebase: boolean = false) => {
//     if (isFirebase) {
//       await firebaseSignIn(auth, email, password);
//     } else {
//       // Local login
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password })
//       });
      
//       if (!response.ok) {
//         throw new Error('Login failed');
//       }
      
//       const data = await response.json();
//       setUser(data.user);
//     }
//   };

//   const logout = async () => {
//     // Try Firebase logout first
//     if (auth.currentUser) {
//       await firebaseSignOut(auth);
//     }
    
//     // Clear local session
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setUser(null);
//   };

//   const register = async (email: string, password: string, name: string, isFirebase: boolean = false) => {
//     if (isFirebase) {
//       const userCredential = await firebaseRegister(auth, email, password);
//       await updateProfile(userCredential.user, { displayName: name });
//     } else {
//       // Local registration
//       const response = await fetch('/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, name })
//       });
      
//       if (!response.ok) {
//         throw new Error('Registration failed');
//       }
      
//       const data = await response.json();
//       setUser(data.user);
//     }
//   };

//   const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       return result.user;
//     } catch (error) {
//       console.error('Google login failed:', error);
//       return null;
//     }
//   };

//   const updateUserPoints = async (points: number) => {
//     if (!user) return;
    
//     try {
//       const response = await fetch('/api/wallet/add-points', {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//           'Authorization': user.uid ? `Bearer ${await user.getIdToken()}` : ''
//         },
//         body: JSON.stringify({
//           type: 'manual',
//           amount: points,
//           description: 'Manual points update'
//         })
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setUser({ ...user, totalPoints: data.newBalance });
//       }
//     } catch (error) {
//       console.error('Error updating points:', error);
//     }
//   };

//   const value: AuthContextType = {
//     user,
//     loading,
//     login,
//     logout,
//     register,
//     loginWithGoogle,
//     updateUserPoints
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// app/contexts/AuthContext.tsx - ADD DAILY LOGIN LOGIC
// 'use client';

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { 
//   getAuth, 
//   onAuthStateChanged, 
//   User as FirebaseUser,
//   signInWithEmailAndPassword as firebaseSignIn,
//   signOut as firebaseSignOut,
//   createUserWithEmailAndPassword as firebaseRegister,
//   updateProfile,
//   GoogleAuthProvider,
//   signInWithPopup
// } from 'firebase/auth';
// import { app } from '@/lib/firebase';

// interface AuthContextType {
//   user: any;
//   loading: boolean;
//   isAdmin: boolean; // ADDED
//   login: (email: string, password: string, isFirebase?: boolean) => Promise<void>;
//   logout: () => Promise<void>;
//   register: (email: string, password: string, name: string, isFirebase?: boolean) => Promise<void>;
//   loginWithGoogle: () => Promise<FirebaseUser | null>;
//   updateUserPoints: (points: number) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const auth = getAuth(app);
//   const googleProvider = new GoogleAuthProvider();

//   // ADDED: Check and claim daily login bonus
//   const checkDailyLogin = async (firebaseUser: FirebaseUser) => {
//     try {
//       const token = await firebaseUser.getIdToken();
//       const response = await fetch('/api/wallet/daily-login', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
        
//         // Show notification if new login bonus was claimed
//         if (data.newLogin && data.pointsEarned) {
//           // You can show a toast/notification here
//           console.log(`🎉 Daily login bonus: +${data.pointsEarned} points! (${data.currentStreak} day streak)`);
          
//           // Optional: Show browser notification
//           if (typeof window !== 'undefined' && 'Notification' in window) {
//             if (Notification.permission === 'granted') {
//               new Notification('Daily Login Bonus! 🎉', {
//                 body: `You earned ${data.pointsEarned} points! Current streak: ${data.currentStreak} days`,
//                 icon: '/logo.png'
//               });
//             }
//           }
          
//           // Optional: Show alert (you can replace with a better toast notification)
//           setTimeout(() => {
//             if (typeof window !== 'undefined') {
//               alert(`🎉 Daily Login Bonus!\n\nYou earned ${data.pointsEarned} points!\nCurrent streak: ${data.currentStreak} days\nTotal points: ${data.currentPoints}`);
//             }
//           }, 1000);
//         }
        
//         return data;
//       }
//     } catch (error) {
//       console.error('Error checking daily login:', error);
//     }
//     return null;
//   };

//   useEffect(() => {
//     // Check Firebase auth first
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         // Firebase user is logged in, sync with MongoDB
//         try {
//           const token = await firebaseUser.getIdToken();
//           const response = await fetch('/api/auth/sync', {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//               uid: firebaseUser.uid,
//               email: firebaseUser.email,
//               name: firebaseUser.displayName,
//               avatar: firebaseUser.photoURL
//             })
//           });
          
//           if (response.ok) {
//             const userData = await response.json();
//             setUser({ ...firebaseUser, ...userData });
            
//             // ADDED: Check and claim daily login bonus
//             await checkDailyLogin(firebaseUser);
//           } else {
//             setUser(firebaseUser);
//           }
//         } catch (error) {
//           console.error('Error syncing user:', error);
//           setUser(firebaseUser);
//         }
//       } else {
//         // Check for local auth session
//         const sessionToken = document.cookie
//           .split('; ')
//           .find(row => row.startsWith('session='))
//           ?.split('=')[1];
        
//         if (sessionToken) {
//           try {
//             const response = await fetch('/api/auth/me', {
//               headers: {
//                 'Authorization': `Bearer ${sessionToken}`
//               }
//             });
            
//             if (response.ok) {
//               const userData = await response.json();
//               setUser(userData);
//             }
//           } catch (error) {
//             console.error('Error fetching local user:', error);
//           }
//         } else {
//           setUser(null);
//         }
//       }
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, [auth]);

//   const login = async (email: string, password: string, isFirebase: boolean = false) => {
//     if (isFirebase) {
//       await firebaseSignIn(auth, email, password);
//       // Daily login will be checked automatically in onAuthStateChanged
//     } else {
//       // Local login
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password })
//       });
      
//       if (!response.ok) {
//         throw new Error('Login failed');
//       }
      
//       const data = await response.json();
//       setUser(data.user);
//     }
//   };

//   const logout = async () => {
//     // Try Firebase logout first
//     if (auth.currentUser) {
//       await firebaseSignOut(auth);
//     }
    
//     // Clear local session
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setUser(null);
//   };

//   const register = async (email: string, password: string, name: string, isFirebase: boolean = false) => {
//     if (isFirebase) {
//       const userCredential = await firebaseRegister(auth, email, password);
//       await updateProfile(userCredential.user, { displayName: name });
//       // Daily login will be checked automatically in onAuthStateChanged
//     } else {
//       // Local registration
//       const response = await fetch('/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, name })
//       });
      
//       if (!response.ok) {
//         throw new Error('Registration failed');
//       }
      
//       const data = await response.json();
//       setUser(data.user);
//     }
//   };

//   const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       // Daily login will be checked automatically in onAuthStateChanged
//       return result.user;
//     } catch (error) {
//       console.error('Google login failed:', error);
//       return null;
//     }
//   };

//   const updateUserPoints = async (points: number) => {
//     if (!user) return;
    
//     try {
//       const response = await fetch('/api/wallet/add-points', {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//           'Authorization': user.uid ? `Bearer ${await user.getIdToken()}` : ''
//         },
//         body: JSON.stringify({
//           type: 'manual',
//           amount: points,
//           description: 'Manual points update'
//         })
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setUser({ ...user, totalPoints: data.newBalance });
//       }
//     } catch (error) {
//       console.error('Error updating points:', error);
//     }
//   };

//   const value: AuthContextType = {
//     user,
//     loading,
//     login,
//     logout,
//     register,
//     loginWithGoogle,
//     updateUserPoints,
//     isAdmin: false
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// app/contexts/AuthContext.tsx - UNIFIED VERSION
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword as firebaseRegister,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { app } from '@/lib/firebase';

interface AuthContextType {
  user: any;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, isFirebase?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, isFirebase?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  updateUserPoints: (points: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  // Function to refresh user data from database
  const refreshUser = async () => {
    if (!user?.uid) return;
    
    try {
      console.log('🔄 Refreshing user data...');
      const response = await fetch(`/api/user/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('✅ User data refreshed, wallet:', data.user.walletBalance);
          // Merge with existing user data
          setUser((prevUser: any) => ({
            ...prevUser,
            walletBalance: data.user.walletBalance,
            totalPoints: data.user.totalPoints,
            registeredEvents: data.user.registeredEvents,
            level: data.user.level,
            streak: data.user.streak
          }));
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Check and claim daily login bonus
  const checkDailyLogin = async (firebaseUser: FirebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/wallet/daily-login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Show notification if new login bonus was claimed
        if (data.newLogin && data.pointsEarned) {
          console.log(`🎉 Daily login bonus: +${data.pointsEarned} points! (${data.currentStreak} day streak)`);
          
          // Browser notification (if permission granted)
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Daily Login Bonus! 🎉', {
                body: `You earned ${data.pointsEarned} points! Current streak: ${data.currentStreak} days`,
                icon: '/logo.png'
              });
            }
          }
          
          // Show alert after a short delay
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              alert(`🎉 Daily Login Bonus!\n\nYou earned ${data.pointsEarned} points!\nCurrent streak: ${data.currentStreak} days\nTotal points: ${data.currentPoints}`);
            }
          }, 1000);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error checking daily login:', error);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user is logged in, sync with MongoDB
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              avatar: firebaseUser.photoURL
            })
          });
          
          if (response.ok) {
            const userData = await response.json();
            const mergedUser = { ...firebaseUser, ...userData };
            setUser(mergedUser);
            
            // Set admin status
            setIsAdmin(userData.role === 'admin' || userData.role === 'super_admin');
            
            // Check and claim daily login bonus
            await checkDailyLogin(firebaseUser);
          } else {
            setUser(firebaseUser);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error syncing user:', error);
          setUser(firebaseUser);
          setIsAdmin(false);
        }
      } else {
        // Check for local auth session
        const sessionToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('session='))
          ?.split('=')[1];
        
        if (sessionToken) {
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${sessionToken}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
              setIsAdmin(userData.role === 'admin' || userData.role === 'super_admin');
            } else {
              setUser(null);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error('Error fetching local user:', error);
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const login = async (email: string, password: string, isFirebase: boolean = false) => {
    if (isFirebase) {
      await firebaseSignIn(auth, email, password);
      // Daily login and sync will be checked automatically in onAuthStateChanged
    } else {
      // Local login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      setUser(data.user);
      setIsAdmin(data.user?.role === 'admin' || data.user?.role === 'super_admin');
    }
  };

  const logout = async () => {
    // Try Firebase logout first
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    
    // Clear local session
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setIsAdmin(false);
  };

  const register = async (email: string, password: string, name: string, isFirebase: boolean = false) => {
    if (isFirebase) {
      const userCredential = await firebaseRegister(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      // Daily login and sync will be checked automatically in onAuthStateChanged
    } else {
      // Local registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      setUser(data.user);
      setIsAdmin(false); // New users are not admin by default
    }
  };

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Daily login and sync will be checked automatically in onAuthStateChanged
      return result.user;
    } catch (error) {
      console.error('Google login failed:', error);
      return null;
    }
  };

  const updateUserPoints = async (points: number) => {
    if (!user) return;
    
    try {
      const token = user.getIdToken ? await user.getIdToken() : '';
      const response = await fetch('/api/wallet/add-points', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          type: 'manual',
          amount: points,
          description: 'Manual points update'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser((prevUser: any) => ({
          ...prevUser,
          totalPoints: data.newBalance,
          walletBalance: data.newBalance
        }));
      }
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    login,
    logout,
    register,
    loginWithGoogle,
    updateUserPoints,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};