"use client";

import { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, motion, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CommunityScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);

    // Total frames found in directory: 108
    const frameCount = 108;

    // Scroll controls
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Smooth out the scroll for cinematic feel
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Map scroll progress to frame index
    const frameIndex = useTransform(smoothProgress, [0, 1], [1, frameCount]);

    // Load images
    useEffect(() => {
        let imagesLoaded = 0;
        const loadedImages: HTMLImageElement[] = [];

        const preloadImages = async () => {
            for (let i = 1; i <= frameCount; i++) {
                const img = new Image();
                // Format: ezgif-frame-001.jpg, ezgif-frame-010.jpg, ezgif-frame-100.jpg
                const paddedIndex = i.toString().padStart(3, "0");
                img.src = `/community-jpg/ezgif-frame-${paddedIndex}.jpg`;

                await new Promise((resolve) => {
                    img.onload = () => {
                        imagesLoaded++;
                        setLoadProgress((imagesLoaded / frameCount) * 100);
                        resolve(true);
                    };
                    img.onerror = () => resolve(true); // Skip errors but continue
                });

                loadedImages[i] = img;
            }

            setImages(loadedImages);
            setIsLoading(false);
        };

        preloadImages();
    }, []);

    // Canvas rendering loop
    useEffect(() => {
        if (isLoading || images.length === 0) return;

        const render = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;

            // Get current frame
            const currentIndex = Math.min(
                frameCount,
                Math.max(1, Math.round(frameIndex.get()))
            );

            const img = images[currentIndex];
            if (!img) return;

            // Set canvas dimensions
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Draw image (cover logic)
            const scale = Math.max(
                canvas.width / img.width,
                canvas.height / img.height
            );

            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;

            // Mobile focal point adjustment (zooming in slightly on center-ish)
            // This is a simplified "focal point" logic
            const isMobile = window.innerWidth < 768;
            const mobileScale = isMobile ? scale * 1.5 : scale;
            const mobileX = isMobile ? x - (canvas.width * 0.2) : x; // Shift slightly

            ctx.drawImage(
                img,
                isMobile ? mobileX : x,
                y,
                img.width * mobileScale,
                img.height * mobileScale
            );
        };

        const unsubscribe = frameIndex.on("change", render);

        // Initial render
        render();

        // Handle resize
        window.addEventListener("resize", render);

        return () => {
            unsubscribe();
            window.removeEventListener("resize", render);
        };
    }, [isLoading, images, frameIndex]);

    // Opacity transforms for text overlays
    const text1Opacity = useTransform(smoothProgress, [0, 0.15, 0.25], [0, 1, 0]);
    const text2Opacity = useTransform(smoothProgress, [0.3, 0.4, 0.5], [0, 1, 0]);
    const text3Opacity = useTransform(smoothProgress, [0.6, 0.7, 0.8], [0, 1, 0]);
    const text4Opacity = useTransform(smoothProgress, [0.85, 0.95], [0, 1]);
    const scaleCTA = useTransform(smoothProgress, [0.9, 1], [0.8, 1]);

    return (
        <div ref={containerRef} className="h-[500vh] relative bg-[#0F0F0F]">

            {/* Sticky Canvas Container */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* Preloader */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-[#0F0F0F] flex flex-col items-center justify-center"
                        >
                            <div className="w-24 h-32 border-2 border-zinc-800 rounded-lg relative overflow-hidden">
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 bg-[#FF6B35]"
                                    style={{ height: `${loadProgress}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white font-bold text-xs mix-blend-difference">
                                        {Math.round(loadProgress)}%
                                    </span>
                                </div>
                            </div>
                            <p className="mt-4 text-zinc-500 text-xs tracking-widest uppercase">
                                Shuffling Deck...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <canvas ref={canvasRef} className="w-full h-full object-cover" />

                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent pointer-events-none" />

                {/* Narrative Overlays */}
                <div className="absolute inset-0 pointer-events-none">

                    {/* Section 1: The Setup */}
                    <motion.div
                        style={{ opacity: text1Opacity }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <h2 className="text-white text-4xl md:text-6xl font-black uppercase tracking-widest mix-blend-overlay">
                            It starts with a <span className="text-[#FF6B35]">shuffle</span>
                        </h2>
                    </motion.div>

                    {/* Section 2: The Gathering */}
                    <motion.div
                        style={{ opacity: text2Opacity }}
                        className="absolute bottom-20 left-10 md:left-20"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-12 bg-[#FF6B35]" />
                            <h2 className="text-white text-3xl md:text-5xl font-bold uppercase tracking-wide">
                                Find your circle
                            </h2>
                        </div>
                    </motion.div>

                    {/* Section 3: The Tension */}
                    <motion.div
                        style={{ opacity: text3Opacity }}
                        className="absolute bottom-20 right-10 md:right-20 text-right"
                    >
                        <h2 className="text-white text-3xl md:text-5xl font-bold uppercase tracking-wide">
                            Raise the stakes
                        </h2>
                        <p className="text-zinc-400 mt-2 font-serif italic text-xl">
                            Every card tells a story
                        </p>
                    </motion.div>

                    {/* Section 4: The Payoff */}
                    <motion.div
                        style={{ opacity: text4Opacity }}
                        className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                        <h1 className="text-white text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-center leading-none mb-8">
                            Win <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-orange-600">Together</span>
                        </h1>
                        <p className="text-zinc-300 text-lg uppercase tracking-[0.3em] mb-12">
                            Welcome to the Joy Juncture Community
                        </p>

                        <motion.div style={{ scale: scaleCTA }} className="pointer-events-auto">
                            <Link
                                href="#discussions"
                                className="group bg-[#FF6B35] text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider flex items-center gap-3 hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(255,107,53,0.3)]"
                            >
                                Join the Table <ArrowRight size={20} />
                            </Link>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
