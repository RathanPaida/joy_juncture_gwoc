<<<<<<< HEAD
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
=======
// app/admin/layout.tsx
// This ensures admin pages have access to AuthContext
'use client';
import { AuthProvider } from "@/app/contexts/AuthContext";


import React from 'react';
>>>>>>> ce057853c8694f2e1d4bb236a5a59542fb1b3a60

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
<<<<<<< HEAD
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/admin/events')}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Manage Events
            </button>
            <button
              onClick={() => router.push('/admin/registrations')}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              View Registrations
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
=======
  return <>
  <AuthProvider>{children}
    </AuthProvider></>;
>>>>>>> ce057853c8694f2e1d4bb236a5a59542fb1b3a60
}