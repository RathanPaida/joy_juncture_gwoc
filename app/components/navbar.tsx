"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, User, ShoppingBasket, X, LogOut, Settings, Shield } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

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
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.role === 'admin' || session?.user?.role === 'editor') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [session]);

  // Add admin-specific navigation items if user is admin
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
    await signOut({ callbackUrl: '/' });
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

      {/* 2. CENTER NAVIGATION (Hidden when search is open) */}
      <div className={`hidden lg:flex space-x-7 transition-all ${isSearchOpen ? 'opacity-0 invisible w-0' : 'opacity-100 visible'}`}>
        {allNavigation.map((item) => (
          <div key={item.name} className="relative group">
            {item.dropdown ? (
              <>
                <button 
                  className={`flex items-center gap-1 text-sm font-bold ${item.name === 'Admin' ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-black'} transition-colors`}
                  aria-haspopup="true"
                >
                  {item.name}
                  <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                {/* Dropdown Menu */}
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
              <Link 
                href={item.href} 
                className={`text-sm font-bold ${item.name === 'Admin' ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-black'}`}
              >
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* 3. RIGHT SECTION (Search + Icons) */}
      <div className="flex items-center space-x-4 flex-grow justify-end max-w-xl">
        
        {/* Search Container */}
        <div 
          className={`relative flex items-center transition-all duration-500 ease-in-out ${isSearchOpen ? 'flex-grow' : 'w-10'}`}
          onMouseEnter={() => setIsSearchOpen(true)}
          onMouseLeave={() => setIsSearchOpen(false)}
        >
          <input
            type="text"
            placeholder="Search games..."
            className={`w-full h-11 pl-11 pr-10 rounded-full bg-gray-100 outline-none border border-transparent focus:border-black transition-all duration-500 ${
              isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible cursor-default'
            }`}
          />
          
          {/* Search Icon Button */}
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="absolute left-3 p-1 text-gray-700 hover:text-black z-10"
            aria-label="Open search"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Close Icon */}
          {isSearchOpen && (
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Icons */}
        <div className={`flex items-center space-x-5 transition-opacity ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
          
          {/* User Menu */}
          <div className="relative">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : session ? (
              <>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative p-1 text-gray-700 hover:text-black transition-colors"
                  aria-label="My Account"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                    {session.user?.name?.charAt(0) || <User className="w-5 h-5" />}
                  </div>
                  {isAdmin && (
                    <Shield className="w-3 h-3 absolute -top-1 -right-1 text-red-600 bg-white rounded-full p-0.5" />
                  )}
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 shadow-xl rounded-xl py-3 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-900">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                      {isAdmin && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded">
                          <Shield className="w-3 h-3" />
                          {session.user?.role?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/blog/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 border-t border-gray-100 mt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link 
                href="/login" 
                className="p-1 text-gray-700 hover:text-black transition-colors"
                aria-label="Login"
              >
                <User className="w-6 h-6 stroke-[1.8]" />
              </Link>
            )}
          </div>
          
          {/* Cart Icon */}
          <Link href="/cart" className="p-1 text-gray-700 hover:text-black transition-colors relative" aria-label="Shopping Cart">
            <ShoppingBasket className="w-6 h-6 stroke-[1.8]" />
            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              0
            </span>
          </Link>

          {/* Admin Quick Action Button (Visible only for admins) */}
          {isAdmin && (
            <Link 
              href="/blog/admin" 
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold rounded-full hover:from-red-700 hover:to-red-800 transition-all"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}

          {/* Login/Signup Button (Visible only when not logged in) */}
          {!session && status !== 'loading' && (
            <Link 
              href="/login" 
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Close user menu when clicking outside */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  );
}