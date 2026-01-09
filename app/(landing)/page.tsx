"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Anton } from "next/font/google";

// Load the Anton font for the high-energy headers
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function JoyJuncture() {
  const { scrollY } = useScroll();

  // Parallax effects for background and shapes
  const gridY = useTransform(scrollY, [0, 500], [0, 200]);
  const shape1Y = useTransform(scrollY, [0, 500], [0, -150]);
  const shape2Y = useTransform(scrollY, [0, 500], [0, -300]);

  const title = "JOY JUNCTURE";

  // Animation variants for staggered letters
  const containerVars = {
    before: {},
    after: { transition: { staggerChildren: 0.06 } },
  };

  const letterVars = {
    before: { opacity: 0, y: 50, scale: 0.5 },
    after: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 150, damping: 12 },
    },
  } as const;

  return (
    <main className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* 1. Parallax Background Layer */}
      <motion.div
        style={{ y: gridY }}
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
      >
        <div className="w-full h-[200vh] bg-[linear-gradient(rgba(255,94,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,94,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </motion.div>

      {/* 2. Floating Shapes (Dice and Cards) */}
      <motion.div
        style={{ y: shape1Y }}
        className="absolute top-[20%] left-[10%] text-8xl opacity-40 select-none z-0"
      >
        🎲
      </motion.div>
      <motion.div
        style={{ y: shape2Y }}
        className="absolute bottom-[20%] right-[10%] text-9xl opacity-20 select-none z-0"
      >
        🃏
      </motion.div>

      {/* 3. Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          variants={containerVars}
          initial="before"
          animate="after"
          className={`${anton.className} flex flex-wrap justify-center gap-x-6 gap-y-2 text-[clamp(3.5rem,12vw,9rem)] leading-none text-center`}
        >
          {title.split(" ").map((word, wIdx) => (
            <span key={wIdx} className="flex">
              {word.split("").map((char, cIdx) => {
                // Special leaning white J in "JUNCTURE"
                const isBigJ =
                  wIdx === 1 && cIdx === 0 && char.toUpperCase() === "J";

                // Base styles
                const baseClass = isBigJ
                  ? "cursor-default inline-block text-white drop-shadow-[0_0_30px_rgba(255,94,0,0.9)]"
                  : "cursor-default inline-block text-[#FF5E00] drop-shadow-[0_0_15px_rgba(255,94,0,0.4)]";

                // Static pose for that J (tilted toward the U and lifted)
                const bigJStyle = isBigJ ? { rotate: 10, y: -12 } : {};

                return (
                  <motion.span
                    key={cIdx}
                    variants={letterVars}
                    style={bigJStyle}
                    whileHover={{
                      y: -20,
                      scale: 1.2,
                      // keep it leaning toward U even on hover
                      rotate: isBigJ ? 12 : 5,
                      color: "#FFFFFF",
                      textShadow: "0px 0px 25px #FF5E00",
                      transition: { type: "spring", stiffness: 300 },
                    }}
                    className={baseClass}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-xl text-gray-400 font-light tracking-[0.2em] uppercase text-center"
        >
          Where Connections Spark and Games Begin
        </motion.p>
      </section>

      {/* 4. Feature Cards Section */}
      <section className="relative z-10 py-24 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-l-4 border-[#FF5E00] pl-6 mb-16">
            <h2 className={`${anton.className} text-5xl uppercase`}>
              The Collection
            </h2>
            <p className="text-gray-500 mt-2">
              Curated board games for unforgettable nights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="MEHFIL"
              desc="The musical card game celebrating culture and rhythm."
            />
            <FeatureCard
              title="TAMASHA"
              desc="High-stakes Bollywood bidding wars and drama."
            />
            <FeatureCard
              title="NOIR"
              desc="Deduction in darkness. Trust no one, find the truth."
            />
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-gray-600 border-t border-gray-900">
        <p>© 2026 JOY JUNCTURE. CRAFTED IN ORANGE & BLACK.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -15 }}
      className="group relative bg-[#111] p-10 border border-gray-800 transition-colors hover:border-[#FF5E00]"
    >
      {/* Animated accent line on hover */}
      <div className="absolute left-0 top-0 w-1 h-0 bg-[#FF5E00] transition-all duration-300 group-hover:h-full" />

      <h3 className={`${anton.className} text-2xl mb-4 tracking-wider`}>
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed mb-6">{desc}</p>
      <button className="px-6 py-2 border border-[#FF5E00] text-[#FF5E00] font-bold hover:bg-[#FF5E00] hover:text-black transition-all">
        VIEW GAME
      </button>
    </motion.div>
  );
}
