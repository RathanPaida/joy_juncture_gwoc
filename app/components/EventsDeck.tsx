'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Link from 'next/link';
import { Calendar, History, Ticket } from 'lucide-react';

interface DeckCategory {
  id: string;
  title: string;
  count: number;
  description: string;
  link: string;
  icon: any;
  color: string;
}

function DeckCard({
  category,
  index,
  total,
  scrollYProgress,
}: {
  category: DeckCategory;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  // Animation Logic extracted from Code B
  const startUnfold = 0.1;
  const step = 1 / total;
  const activationPoint = startUnfold + (index * step * 0.5);

  // 1. Rotation: Unwinds from a messy stack to flat
  const initialRotation = (index % 2 === 0 ? 5 : -5) * (index + 1); 
  const rotateZ = useTransform(scrollYProgress, [0, activationPoint, 1], [initialRotation, initialRotation, 0]);

  // 2. X Position: Spreads cards horizontally
  const xOffset = (index - (total - 1) / 2) * 350; // Gap between cards
  const x = useTransform(scrollYProgress, [startUnfold, 1], ["0%", `${xOffset}px`]);

  // 3. Scale & Opacity
  const scale = useTransform(scrollYProgress, [0, startUnfold, 1], [1 - index * 0.05, 1, 1]);
  
  // Crossfade between "Stack Cover" and "Detail View"
  const contentOpacity = useTransform(scrollYProgress, [activationPoint, Math.min(activationPoint + 0.2, 1)], [0, 1]);
  const coverOpacity = useTransform(scrollYProgress, [activationPoint, Math.min(activationPoint + 0.1, 1)], [1, 0]);

  return (
    <motion.div
      style={{ x, scale, rotateZ, zIndex: total - index, position: 'absolute' }}
      className="w-[300px] h-[450px] origin-center will-change-transform"
    >
      <Link href={category.link} className="block w-full h-full relative group">
        <div className="w-full h-full bg-[#1a1a1a] border-2 border-[#ff6b00]/30 hover:border-[#ff6b00] transition-colors duration-500 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* STATE 1: Folded Stack View */}
          <motion.div 
            style={{ opacity: coverOpacity }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a] z-10 p-6"
          >
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#ff6b00]/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <category.icon className="w-10 h-10 text-[#ff6b00]" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{category.title}</h3>
            <div className="mt-4 px-4 py-1 bg-[#ff6b00] text-black font-bold text-xs rounded-full">
              {category.count} EVENTS
            </div>
          </motion.div>

          {/* STATE 2: Unfolded Grid View */}
          <motion.div
            style={{ opacity: contentOpacity }}
            className="absolute inset-0 p-8 flex flex-col justify-between bg-gradient-to-b from-[#1a1a1a] to-black"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-mono text-[#ff6b00] border border-[#ff6b00]/30 px-2 py-1 rounded">
                  0{index + 1}
                </span>
                <category.icon className="w-6 h-6 text-white/40" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 leading-none group-hover:text-[#ff6b00] transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-gray-400 font-mono leading-relaxed">
                {category.description}
              </p>
            </div>
            
            <div className="w-full py-3 bg-[#ff6b00] text-black font-black text-center uppercase tracking-widest text-sm hover:bg-white transition-colors rounded">
              Enter Section
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EventsDeck({ 
  registeredCount, 
  upcomingCount, 
  pastCount 
}: { 
  registeredCount: number, 
  upcomingCount: number, 
  pastCount: number 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const categories: DeckCategory[] = [
    {
      id: 'registered',
      title: 'Registered',
      count: registeredCount,
      description: "Access your tickets, view status, and manage your schedule.",
      link: '/events/registered',
      icon: Ticket,
      color: '#ff6b00'
    },
    {
      id: 'upcoming',
      title: 'Upcoming',
      count: upcomingCount,
      description: "Browse tournaments and meetups. Register now to earn coins!",
      link: '/events/upcoming',
      icon: Calendar,
      color: '#ff6b00'
    },
    {
      id: 'past',
      title: 'Archive',
      count: pastCount,
      description: "Relive the memories. View results and galleries from past events.",
      link: '/events/past',
      icon: History,
      color: '#ff6b00'
    }
  ];

  return (
    <div ref={containerRef} className="h-[300vh] relative bg-black">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ff6b00_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05]" />
        
        <div className="relative z-10 flex items-center justify-center w-full h-full perspective-1000">
          {categories.map((cat, i) => (
            <DeckCard
              key={cat.id}
              category={cat}
              index={i}
              total={categories.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>

        <motion.div 
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#ff6b00] animate-pulse">
            Scroll to Unfold Deck
          </span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-[#ff6b00] to-transparent" />
        </motion.div>
      </div>
    </div>
  );
}