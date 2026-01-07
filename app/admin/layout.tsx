// app/admin/layout.tsx
// This ensures admin pages have access to AuthContext
'use client';
import { AuthProvider } from "@/app/contexts/AuthContext";


import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>
  <AuthProvider>{children}
    </AuthProvider></>;
}