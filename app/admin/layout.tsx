// app/admin/layout.tsx
// This ensures admin pages have access to AuthContext (for wallets/auth)
'use client';

import { AuthProvider } from "@/app/contexts/AuthContext";
import Link from 'next/link';
import { Package, LayoutDashboard, Plus } from 'lucide-react';
import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <nav className="bg-black text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link 
                href="/admin" 
                className="text-2xl font-black tracking-tight"
                style={{ color: '#FF5F1F' }}
              >
                JJ ADMIN
              </Link>
              <div className="flex gap-4">
                <Link 
                  href="/admin" 
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded transition-colors"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
                <Link 
                  href="/admin/products" 
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded transition-colors"
                >
                  <Package size={18} />
                  Products
                </Link>
                <Link 
                  href="/admin/products/new" 
                  className="flex items-center gap-2 px-4 py-2 rounded transition-all"
                  style={{ backgroundColor: '#FF5F1F' }}
                >
                  <Plus size={18} />
                  Add Product
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
