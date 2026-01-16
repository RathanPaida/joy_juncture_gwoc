"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Anton } from "next/font/google";
import { useRouter } from "next/navigation";

// Load the Anton font for the high-energy headers
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function JoyJuncture() {
  const router = useRouter();
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
                const isBigJ =
                  wIdx === 1 && cIdx === 0 && char.toUpperCase() === "J";

                const baseClass = isBigJ
                  ? "cursor-default inline-block text-white drop-shadow-[0_0_30px_rgba(255,94,0,0.9)]"
                  : "cursor-default inline-block text-[#FF5E00] drop-shadow-[0_0_15px_rgba(255,94,0,0.4)]";

                const bigJStyle = isBigJ ? { rotate: 10, y: -12 } : {};

                return (
                  <motion.span
                    key={cIdx}
                    variants={letterVars}
                    style={bigJStyle}
                    whileHover={{
                      y: -20,
                      scale: 1.2,
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

        {/* 🔥 Added Button (ONLY addition) */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, type: "spring" }}
          onClick={() => router.push("/home")}
          className="
            mt-12
            px-10 py-4
            rounded-full
            text-lg font-semibold
            tracking-widest uppercase
            text-black
            bg-[#FF5E00]
            hover:bg-[#ff7a2f]
            hover:scale-105
            active:scale-95
            transition-all
            shadow-[0_0_30px_rgba(255,94,0,0.6)]
          "
        >
          Enter Joy Juncture
        </motion.button>
      </section>
    </main>
  );
}