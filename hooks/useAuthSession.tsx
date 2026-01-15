// hooks/useAuthSession.ts
import { useSession } from "next-auth/react";

export function useAuthSession() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = !!session;
  const isAdmin = session?.user?.role === "admin";

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isAdmin,
    user: session?.user || null,
  };
}
