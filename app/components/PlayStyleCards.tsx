'use client';
import React from 'react';
import { motion } from "framer-motion";
import { Gamepad2, Users, Sparkles, Trophy } from 'lucide-react';

const PLAY_STYLES = [
  {
    icon: '🏠',
    iconComponent: Gamepad2,
    title: 'Play at Home',
    description: 'Shop premium board games and puzzles for your home collection',
    buttonText: 'Browse Shop',
    href: '/store',
  },
  {
    icon: '👥',
    iconComponent: Users,
    title: 'Play Together',
    description: 'Join live game nights and community events in your city',
    buttonText: 'View Events',
    href: '/events',
  },
  {
    icon: '🎉',
    iconComponent: Sparkles,
    title: 'Play for Occasions',
    description: 'Book custom game experiences for weddings, parties & corporate events',
    buttonText: 'Explore Experiences',
    href: '/experiences',
  },
  {
    icon: '🎮',
    iconComponent: Trophy,
    title: 'Play & Earn Points',
    description: 'Play free puzzles daily and earn rewards you can redeem',
    buttonText: 'Play Now Free',
    href: '/play',
  },
];

export default function App() {
  return (
    <section 
      className="py-20 px-4 min-h-screen"
      style={{ 
        backgroundColor: 'var(--background)',
        '--primary': '#ff8c00',
        '--secondary': '#ff7b00',
        '--accent': '#ffb366',
        '--text': '#ffffff',
        '--text-light': '#e0e0e0',
        '--background': '#0a0a0a',
        '--card-bg': '#1a1a1a',
        '--dark': '#0f0f0f',
        '--border': 'rgba(255, 140, 0, 0.2)'
      } as React.CSSProperties }
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 
            className="text-5xl md:text-6xl font-black mb-4 tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Choose Your Play Style
          </h2>
          <p 
            className="text-xl font-medium"
            style={{ color: 'var(--primary)' }}
          >
            Find your perfect way to play
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLAY_STYLES.map((style, index) => (
            <PlayStyleCard key={index} style={style} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlayStyleCard({ style, index }: { style: typeof PLAY_STYLES[0]; index: number }) {
  const IconComponent = style.iconComponent;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative h-full"
    >
      <a href={style.href} className="block h-full">
        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br"
          style={{ 
            background: 'linear-gradient(135deg, var(--primary)/20, var(--secondary)/20)'
          }} 
        />
        
        <motion.div
          whileHover={{ y: -12 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative h-full rounded-3xl p-8 overflow-hidden transition-all duration-500 min-h-[420px] flex flex-col shadow-2xl border-2"
          style={{ 
            background: 'linear-gradient(135deg, var(--card-bg), var(--dark))',
            borderColor: 'var(--border)'
          }}
        >
          {/* Animated background gradient on hover */}
          <div 
            className="absolute inset-0 bg-gradient-to-br transition-all duration-500 opacity-0 group-hover:opacity-100"
            style={{ 
              background: 'linear-gradient(135deg, var(--primary)/10, var(--secondary)/10, var(--primary)/10)',
            }}
          />
          
          {/* Top accent line */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r"
            style={{ 
              background: 'linear-gradient(to right, transparent, var(--primary), transparent)'
            }}
          />
          
          {/* Icon Container */}
          <div className="relative mb-8 z-10">
            <div className="relative">
              {/* Icon background glow */}
              <div 
                className="absolute inset-0 rounded-2xl blur-xl transition-all duration-500"
                style={{ backgroundColor: 'var(--primary)/20' }}
              />
              
              {/* Icon */}
              <div 
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center border-2 group-hover:scale-110 transition-all duration-500 shadow-lg bg-gradient-to-br"
                style={{ 
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  borderColor: 'var(--primary)/50',
                  boxShadow: '0 10px 40px var(--primary)/50'
                }}
              >
                <IconComponent 
                  className="w-10 h-10" 
                  strokeWidth={2.5}
                  style={{ color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative flex-1 flex flex-col z-10">
            <h3 
              className="text-3xl font-black mb-4 tracking-tight transition-colors duration-300"
              style={{ color: 'var(--text)' }}
            >
              {style.title}
            </h3>
            <p 
              className="text-base leading-relaxed mb-8 flex-1 transition-colors duration-300"
              style={{ color: 'var(--text-light)' }}
            >
              {style.description}
            </p>

            {/* Button */}
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                style={{ backgroundColor: 'var(--primary)' }}
              />
              <button 
                className="relative w-full font-black py-4 px-6 rounded-xl transition-all duration-300 text-sm uppercase tracking-wider shadow-lg overflow-hidden bg-primary-foreground"
                style={{ 
                  backgroundColor: 'var(--text)',
                  color: 'var(--dark)'
                }}
              >
                <span className="relative z-10">{style.buttonText}</span>
                <div 
                  className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 bg-gradient-to-r"
                  style={{ 
                    background: 'linear-gradient(to right, transparent, var(--text)/20, transparent)'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Decorative corner accents */}
          <div 
            className="absolute top-6 right-6 w-24 h-24 border-t-2 border-r-2 rounded-tr-3xl transition-colors duration-500"
            style={{ borderColor: 'var(--primary)/20' }}
          />
          <div 
            className="absolute bottom-6 left-6 w-24 h-24 border-b-2 border-l-2 rounded-bl-3xl transition-colors duration-500"
            style={{ borderColor: 'var(--primary)/20' }}
          />
          
          {/* Floating particles effect */}
          <div 
            className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse transition-opacity duration-500"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <div 
            className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-40 group-hover:animate-pulse transition-opacity duration-700"
            style={{ backgroundColor: 'var(--accent)' }}
          />
        </motion.div>
      </a>
    </motion.div>
  );
}
