// lib/auth-utils.ts
export const isAdminUser = (email: string, password: string): boolean => {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  
  return email === adminEmail && password === adminPassword;
};

export const setAuthSession = (email: string, isAdmin: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isAdmin', String(isAdmin));
    localStorage.setItem('isLoggedIn', 'true');
  }
};

export const clearAuthSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isLoggedIn');
  }
};

export const getAuthSession = () => {
  if (typeof window !== 'undefined') {
    return {
      userEmail: localStorage.getItem('userEmail'),
      isAdmin: localStorage.getItem('isAdmin') === 'true',
      isLoggedIn: localStorage.getItem('isLoggedIn') === 'true'
    };
  }
  return {
    userEmail: null,
    isAdmin: false,
    isLoggedIn: false
  };
};
// lib/auth-utils.ts


// Helper to check if user is admin in client components
export const checkIsAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  return email === adminEmail;
};