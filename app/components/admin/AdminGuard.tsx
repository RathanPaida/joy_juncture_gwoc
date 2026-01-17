"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const { user, loading: authLoading, getToken } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            if (authLoading) return;

            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    router.push("/login");
                    return;
                }

                const response = await fetch("/api/user/role", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    const isAdmin = ["admin", "super_admin"].includes(data.role);

                    if (isAdmin) {
                        setAuthorized(true);
                    } else {
                        router.push("/"); // Redirect non-admins to home
                    }
                } else {
                    router.push("/");
                }
            } catch (error) {
                console.error("Error verifying admin role:", error);
                router.push("/");
            } finally {
                setChecking(false);
            }
        };

        checkAdmin();
    }, [user, authLoading, getToken, router]);

    if (authLoading || checking) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#000',
                color: '#f97316'
            }}>
                <div className="spinner" style={{ marginRight: '10px' }}></div>
                Loading Admin Access...
            </div>
        );
    }

    if (!authorized) {
        return null; // Don't render anything while redirecting
    }

    return <>{children}</>;
}
