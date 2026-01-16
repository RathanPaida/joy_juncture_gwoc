"use client";

import React, { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";

const TOTAL_FRAMES = 104;

export default function HeroScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Map scroll progress (0 to 1) to frame index (0 to 47)
    const currentIndex = useTransform(scrollYProgress, [0, 1], [1, TOTAL_FRAMES]);

    // Preload Images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages: HTMLImageElement[] = [];
            const promises = [];

            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                const promise = new Promise<void>((resolve, reject) => {
                    const img = new Image();
                    // Format based on file names: ezgif-frame-001.jpg
                    const frameNumber = i.toString().padStart(3, "0");
                    img.src = `/cards-sequences-jpg/ezgif-frame-${frameNumber}.jpg`;
                    img.onload = () => {
                        loadedImages[i - 1] = img;
                        resolve();
                    };
                    img.onerror = () => {
                        console.error(`Failed to load frame ${i}`);
                        resolve(); // Proceed anyway
                    }
                });
                promises.push(promise);
            }

            await Promise.all(promises);
            setImages(loadedImages);
            setIsLoaded(true);
        };

        loadImages();
    }, []);

    // Draw to Canvas
    const render = (index: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !isLoaded || images.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Safety check for index bound
        let safeIndex = Math.round(index) - 1;
        if (safeIndex < 0) safeIndex = 0;
        if (safeIndex >= images.length) safeIndex = images.length - 1;

        const img = images[safeIndex];
        if (!img) return;

        // Responsive Contain scaling
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;

        ctx.fillStyle = "#050505"; // Match background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };

    // Subscribe to scroll updates to render
    useMotionValueEvent(currentIndex, "change", (latest) => {
        render(latest);
    });

    // Initial render once loaded
    useEffect(() => {
        if (isLoaded) render(1);
    }, [isLoaded]);


    // Text Opacity Transforms
    const opacity1 = useTransform(scrollYProgress, [0, 0.2, 0.3], [0, 1, 0]);
    const opacity2 = useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0, 1, 0]);
    const opacity3 = useTransform(scrollYProgress, [0.7, 0.85, 0.95], [0, 1, 1]); // Stays visible at end? Or fades out. Let's keep it visible briefly or fade out. Prompt says "Joy Juncture" is last.
    const scaleText = useTransform(scrollYProgress, [0.7, 1], [0.8, 1]);

    return (
        <div ref={containerRef} className="h-[400vh] relative bg-midnight">
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                {/* Canvas Layer */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover block"
                />

                {/* Helper Loading State */}
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-orange-500 font-mono animate-pulse">
                        INITIALIZING SEQUENCE...
                    </div>
                )}

                {/* Text Overlays - Centered */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 mix-blend-difference">
                    <motion.h2
                        style={{ opacity: opacity1 }}
                        className="text-6xl md:text-9xl font-bold text-white tracking-tighter absolute"
                    >
                        Experience.
                    </motion.h2>

                    <motion.h2
                        style={{ opacity: opacity2 }}
                        className="text-6xl md:text-9xl font-bold text-white tracking-tighter absolute"
                    >
                        Connect.
                    </motion.h2>

                    <motion.div
                        style={{ opacity: opacity3, scale: scaleText }}
                        className="absolute text-center"
                    >
                        {/* <h1 className="text-7xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tighter">
                            JOY JUNCTURE
                        </h1>
                        <p className="text-orange-500 tracking-[0.5em] mt-4 font-mono text-sm md:text-xl uppercase">
                            The Event Horizon
                        </p> */}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
