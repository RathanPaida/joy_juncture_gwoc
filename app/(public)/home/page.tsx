'use client';
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import UpcomingEventsSection from '@/app/components/UpcomingEventsSection';
import GallerySection from '../../components/GallerySection'; 

import PlayStyleCards from '../../components/PlayStyleCards'; // ✅ FIXED PATH

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative bg-black min-h-screen overflow-hidden">
      {/* Header */}
      {/* <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between"> */}
          {/* Logo */}
          {/* <div className="flex items-center gap-2"> */}
            {/* <div className="text-orange-500 font-black text-2xl tracking-tighter leading-tight">
              JOY<br />JUNCTURE
            </div> */}
          {/* </div>
        </div>
      </header> */}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        {/* Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'linear-gradient(rgba(255, 107, 53, 0.25) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255, 107, 53, 0.25) 1.5px, transparent 1.5px)',
              backgroundSize: '60px 60px',
              opacity: 0.5
            }}
          />
        </div>

        {/* Background Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="https://res.cloudinary.com/dwvb2cgmq/image/upload/v1768065885/88cbe5ed-ee67-4540-8752-2abad4842e9d.png"
            alt="Joy Juncture Logo Background"
            className="w-full max-w-6xl h-auto object-contain opacity-40"
          />
        </div>

        {/* Hero Content */}
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-4">
              <span className="text-orange-500">JOY</span>{' '}
              <span className="text-white">JUNCTURE</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-white mb-12 font-medium"
          >
            Where Connections Spark and Games Begin
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a 
              href="/home" 
              className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-black font-black py-4 px-12 rounded-full text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
            >
              Enter Joy Juncture
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-orange-500/50 rounded-full flex items-start justify-center p-2">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-orange-500 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Play Style Cards Section */}
      <PlayStyleCards />
        {/* Upcoming Events Section - NEW */}
        <UpcomingEventsSection />
       
        {/* Gallery Section */}
        <GallerySection />


      {/* Footer Spacer */}
      <div className="h-20 bg-black"></div>
    </div>
  );
}
