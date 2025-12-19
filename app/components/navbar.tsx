"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, User } from 'lucide-react'; // Optional: Install lucide-react for icons

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
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="font-bold text-xl tracking-tighter">JJ GAMES</div>

      {/* Nav Links */}
      <div className="hidden md:flex space-x-8">
        {navigation.map((item) => (
          <div key={item.name} className="relative group">
            {item.dropdown ? (
              <>
                <button className="flex items-center gap-1 text-gray-700 hover:text-black font-medium transition-colors">
                  {item.name}
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white border border-gray-100 shadow-xl rounded-lg py-2 transition-all z-50">
                  {item.dropdown.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-black"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link href={item.href} className="text-gray-700 hover:text-black font-medium">
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Profile */}
      <Link href="/profile" className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
        <User className="w-4 h-4" />
        <span className="text-sm font-semibold">Login / Profile</span>
      </Link>
    </nav>
  );
}