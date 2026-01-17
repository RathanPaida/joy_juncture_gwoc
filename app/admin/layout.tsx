// 'use client';

// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
// import { useEffect } from 'react';
// app/admin/layout.tsx
// This ensures admin pages have access to AuthContext (for wallets/auth)
"use client";

import React from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";
import Link from "next/link";
import { Package, LayoutDashboard, Plus } from "lucide-react";
import AdminNavbar from "@/app/components/admin/navbar";

import AdminGuard from "@/app/components/admin/AdminGuard";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      <AdminGuard>
        {/* Main Content */}
        <AdminNavbar />
        {children}
      </AdminGuard>
    </AuthProvider>
  );
}
