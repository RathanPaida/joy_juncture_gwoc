'use client';

import React from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { WalletProvider } from "@/app/contexts/WalletContext";// <-- Wallet context import
import AdminNavbar from "@/app/components/admin/navbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthProvider>
      <WalletProvider>
        {/* Admin Navbar */}
        <header>
          <AdminNavbar />
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </WalletProvider>
    </AuthProvider>
  );
}
