'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, History, Ticket, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventsDeckProps {
  registeredCount: number;
  upcomingCount: number;
  pastCount: number;
}

export default function EventsDeck({
  registeredCount,
  upcomingCount,
  pastCount
}: EventsDeckProps) {

  const cards = [
    {
      id: 'upcoming',
      title: 'UPCOMING',
      count: upcomingCount,
      description: 'Browse tournaments and meetups. Register now to earn coins!',
      link: '/events/upcoming',
      icon: Calendar,
      color: 'text-orange-500',
      borderColor: 'group-hover:border-orange-500'
    },
    {
      id: 'registered',
      title: 'REGISTERED',
      count: registeredCount,
      description: 'Access your tickets, view status, and manage your schedule.',
      link: '/events/registered',
      icon: Ticket,
      color: 'text-orange-500',
      borderColor: 'group-hover:border-orange-500'
    },
    {
      id: 'past',
      title: 'PAST EVENTS',
      count: pastCount,
      description: 'Relive the memories. View results and galleries from past events.',
      link: '/events/past',
      icon: History,
      color: 'text-orange-500',
      borderColor: 'group-hover:border-orange-500'
    }
  ];

  return (
    <section className="w-full bg-black py-20 px-4 md:px-8 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Link href={card.link} className="block group relative h-full">
                <div className={cn(
                  "h-full bg-neutral-900/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl",
                  "transition-all duration-300 ease-out",
                  "hover:bg-neutral-900 hover:scale-[1.02]",
                  "hover:border-orange-500"
                )}>
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                  <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                    {/* Top Section */}
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/5 rounded-xl group-hover:bg-orange-500/10 transition-colors">
                        <card.icon className={cn("w-8 h-8", card.color)} />
                      </div>
                      <span className="font-mono text-2xl font-bold text-white/20 group-hover:text-white transition-colors">
                        {String(card.count).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Bottom Section */}
                    <div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase group-hover:text-orange-500 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-neutral-400 text-sm leading-relaxed mb-6 border-l-2 border-white/10 pl-4 group-hover:border-orange-500 transition-colors">
                        {card.description}
                      </p>

                      <div className="flex items-center text-sm font-bold text-white/40 group-hover:text-orange-500 transition-colors uppercase gap-2">
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}