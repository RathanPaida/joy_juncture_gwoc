"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, User, ShoppingBasket, X, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const navigation = [
  { name: 'Home', href: '/home' },
  {
    name: 'Shop',
    dropdown: [
      { name: 'All Games', href: '/store' },
      { name: 'By Occasion', href: '/store/occasion' },
      { name: 'By Players', href: '/store/players' },
      { name: 'By Mood / Vibe', href: '/store/mood' },
    ],
  },
  {
    name: 'Experiences',
    dropdown: [
      { name: 'Corporate Engagement', href: '/corporate' },
      { name: 'Weddings', href: '/experiences/weddings' },
      { name: 'Birthdays / Anniversaries', href: '/experiences/birthdays' },
      { name: 'Carnivals / Game zones', href: '/experiences/carnivals' },
    ],
  },
  {
    name: 'Play',
    dropdown: [
      { name: 'The Showdown', href: '/play/showdown' },
      { name: 'Free Online Games', href: '/play/free' },
      { name: 'How JJ Games Work', href: '/play/how-it-works' },
    ],
  },
  {
    name: 'Events',
    dropdown: [
      { name: 'Upcoming Game Nights', href: '/events' },
      { name: 'Past Events', href: '/events/past' },
    ],
  },
  {
    name: 'Community',
    dropdown: [
      { name: 'Blog', href: '/blog' },
      { name: 'Wallet & Points', href: '/community/wallet' },
      { name: 'About us', href: '/about' },
    ],
  },
];

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // ✅ single source of truth
  const { user, loading, isAdmin, signOut } = useAuth();

  const adminNavigation = isAdmin ? [
    {
      name: 'Admin',
      dropdown: [
        { name: 'Dashboard', href: '/blog/admin' },
        { name: 'Blog Posts', href: '/blog/admin/posts' },
        { name: 'Users', href: '/blog/admin/users' },
        { name: 'Events', href: '/blog/admin/events' },
        { name: 'Settings', href: '/blog/admin/settings' },
      ],
    }
  ] : [];

  const allNavigation = [...navigation, ...adminNavigation];

  const handleLogout = async () => {
    await signOut(); // ✅ Firebase logout
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50 h-20">
      {/* 1. LOGO */}
      <Link 
        href="/" 
        className={`font-black text-2xl tracking-tighter transition-opacity ${isSearchOpen ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}
      >
        JJ GAMES
      </Link>

      {/* 2. CENTER NAVIGATION */}
      <div className={`hidden lg:flex space-x-7 transition-all ${isSearchOpen ? 'opacity-0 invisible w-0' : 'opacity-100 visible'}`}>
        {allNavigation.map((item) => (
          <div key={item.name} className="relative group">
            {item.dropdown ? (
              <>
                <button className={`flex items-center gap-1 text-sm font-bold ${item.name === 'Admin' ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-black'}`}>
                  {item.name}
                  <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className={`absolute left-0 mt-3 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white border border-gray-100 shadow-xl rounded-xl py-3 transition-all duration-200 z-50 ${item.name === 'Admin' ? 'border-red-100' : ''}`}>
                  {item.dropdown.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={`block px-5 py-2 text-sm font-medium hover:bg-gray-50 ${item.name === 'Admin' ? 'text-red-600 hover:text-red-700' : 'text-gray-500 hover:text-black'}`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link href={item.href} className={`text-sm font-bold ${item.name === 'Admin' ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-black'}`}>
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* 3. RIGHT SECTION */}
      <div className="flex items-center space-x-4 flex-grow justify-end max-w-xl">
        <div className="flex items-center space-x-5">
          <div className="relative">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative p-1 text-gray-700 hover:text-black transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.email?.charAt(0) || <User className="w-5 h-5" />}
                  </div>
                  {isAdmin && (
                    <Shield className="w-3 h-3 absolute -top-1 -right-1 text-red-600 bg-white rounded-full p-0.5" />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 shadow-xl rounded-xl py-3 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-900">{user.email}</p>
                    </div>

                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50">
                      <User className="w-4 h-4" /> My Profile
                    </Link>

                    {isAdmin && (
                      <Link href="/blog/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                        <Settings className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 mt-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login" className="p-1 text-gray-700 hover:text-black">
                <User className="w-6 h-6 stroke-[1.8]" />
              </Link>
            )}
          </div>

          <Link href="/cart" className="p-1 text-gray-700 hover:text-black transition-colors relative">
            <ShoppingBasket className="w-6 h-6 stroke-[1.8]" />
          </Link>
        </div>
      </div>

      {isUserMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
      )}
    </nav>
  );
}
