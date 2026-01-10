// app/admin/layout.tsx
// This ensures admin pages have access to AuthContext (for wallets/auth)
'use client';

import { AuthProvider } from "@/app/contexts/AuthContext";
import Link from 'next/link';
import { Package, LayoutDashboard, Plus } from 'lucide-react';
import React from 'react';
import AdminNavbar from "@/app/components/admin/navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <AdminNavbar/>
          {children}
        </main>
    </AuthProvider>
  );
}
