"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, User, ShoppingBasket, X } from 'lucide-react';

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
        {navigation.map((item) => (
          <div key={item.name} className="relative group">
            {item.dropdown ? (
              <>
                <button 
                  className="flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-black transition-colors"
                  aria-haspopup="true"
                >
                  {item.name}
                  <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-3 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white border border-gray-100 shadow-xl rounded-xl py-3 transition-all duration-200 z-50">
                  {item.dropdown.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className="block px-5 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-black font-medium"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link href={item.href} className="text-sm font-bold text-gray-700 hover:text-black">
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
          
          {/* Search Icon Button - Accessibility Fix: aria-label added */}
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="absolute left-3 p-1 text-gray-700 hover:text-black z-10"
            aria-label="Open search"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Close Icon - Only shows when input is expanded */}
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

        {/* Action Icons - Accessibility Fix: aria-labels added */}
        <div className={`flex items-center space-x-5 transition-opacity ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
          <Link href="/profile" className="p-1 text-gray-700 hover:text-black transition-colors" aria-label="My Account">
            <User className="w-6 h-6 stroke-[1.8]" />
          </Link>
          
          <Link href="/cart" className="p-1 text-gray-700 hover:text-black transition-colors relative" aria-label="Shopping Cart">
            <ShoppingBasket className="w-6 h-6 stroke-[1.8]" />
            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              0
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}