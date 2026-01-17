"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
    {
        id: "upcoming",
        title: "UPCOMING",
        subtitle: "What's Next",
        path: "/events/upcoming",
        color: "from-orange-500 to-magma",
        zIndex: 30,
    },
    {
        id: "past",
        title: "PAST",
        subtitle: "Legacy",
        path: "/events/past",
        color: "from-orange-600 to-orange-800",
        zIndex: 20,
    },
    {
        id: "registered",
        title: "REGISTERED",
        subtitle: "Your Pass",
        path: "/events/registered",
        color: "from-orange-700 to-orange-900",
        zIndex: 10,
    },
];

export default function EventDeck() {
    const [isSpread, setIsSpread] = useState(false);
    const router = useRouter();

    // Animation Variants
    const containerVariants = {
        stacked: {
            transition: { staggerChildren: 0.05, staggerDirection: -1 }
        },
        spread: {
            transition: { staggerChildren: 0.1 }
        }
    };

    const getCardVariants = (index: number): Variants => {
        // Unique stacking transforms for each card index
        const yOffset = index * 8; // 0, 8, 16
        const scale = 1 - index * 0.05; // 1, 0.95, 0.9
        const rotate = index % 2 === 0 ? 2 : -2; // simple subtle rotation

        return {
            stacked: {
                x: 0,
                y: yOffset,
                scale: scale,
                rotate: rotate,
                zIndex: cards.length - index,
                transition: {
                    type: "spring",
                    stiffness: 150,
                    damping: 20,
                    mass: 1
                }
            },
            spread: {
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                zIndex: 1,
                transition: {
                    type: "spring",
                    stiffness: 120,
                    damping: 15
                }
            },
            hover: {
                y: -20,
                scale: 1.05,
                boxShadow: "0 0 30px rgba(255, 85, 0, 0.4)",
                borderColor: "#FF5500",
                transition: { duration: 0.2 }
            }
        };
    };

    return (
        <section
            className="min-h-screen flex flex-col items-center justify-center bg-midnight relative py-20"
            onMouseEnter={() => setIsSpread(true)}
        // Optional: onMouseLeave={() => setIsSpread(false)} // Keep open once interacted? Or toggle? Prompt says "when user scrolls into view (or hovers)". Let's keep it responsive to interaction.
        >
            <div className="mb-20 text-center z-10">
                <h3 className="text-orange-500 font-mono tracking-widest text-sm mb-4">NAVIGATE THE FUTURE</h3>
                <p className="text-white text-opacity-50 text-sm">Hover to reveal the deck</p>
            </div>

            {/* Deck Container */}
            <motion.div
                className={cn(
                    "relative w-full max-w-5xl px-4 flex items-center justify-center",
                    isSpread ? "h-auto gap-4 md:gap-8 flex-col md:flex-row" : "h-[400px]"
                )}
                variants={containerVariants}
                initial="stacked"
                animate={isSpread ? "spread" : "stacked"}
            >
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        variants={getCardVariants(index)}
                        whileHover="hover"
                        onClick={() => router.push(card.path)}
                        className={cn(
                            "relative bg-black border border-white/10 rounded-2xl cursor-pointer overflow-hidden group",
                            isSpread ? "w-full md:w-1/3 h-[400px]" : "absolute w-[300px] h-[400px]"
                        )}
                        style={{
                            transformOrigin: "bottom center",
                        }}
                    >
                        {/* Background Gradient Effect via overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Orange Glow Blob */}
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/20 blur-[50px] rounded-full group-hover:bg-orange-500/40 transition-all duration-500" />

                        {/* Content */}
                        <div className="h-full flex flex-col justify-between p-8 relative z-10">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-mono text-orange-500 border border-orange-500/30 px-2 py-1 rounded">
                                    0{index + 1}
                                </span>
                                <ArrowRight className="text-white/30 group-hover:text-orange-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>

                            <div>
                                <h4 className="text-white/50 text-xs font-mono mb-2 uppercase tracking-wider">{card.subtitle}</h4>
                                <h2 className="text-3xl font-bold text-white group-hover:text-orange-500 transition-colors uppercase italic tracking-tighter">
                                    {card.title}
                                </h2>
                            </div>
                        </div>

                        {/* Active Border Glow */}
                        <div className="absolute inset-0 border border-orange-500/0 group-hover:border-orange-500/50 rounded-2xl transition-colors duration-300 pointer-events-none" />
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
