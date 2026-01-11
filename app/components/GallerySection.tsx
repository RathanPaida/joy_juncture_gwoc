'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

const GALLERY_IMAGES = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
    title: 'Corporate Team Building',
    description: 'Fortune 500 companies choose us for unforgettable team experiences',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1200',
    title: 'Wedding Reception Games',
    description: 'Making wedding celebrations more memorable with interactive gameplay',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=1200',
    title: 'Community Game Nights',
    description: 'Building connections through the joy of board games',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=1200',
    title: 'Strategy Summit',
    description: 'Where minds meet and strategies collide',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1606503153255-59d2c78dd63f?w=1200',
    title: 'Family Game Day',
    description: 'Creating lasting memories across generations',
  },
];

export default function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<typeof GALLERY_IMAGES[0] | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoPlaying || selectedImage) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedImage]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
  };

  const handleImageClick = (image: typeof GALLERY_IMAGES[0]) => {
    setSelectedImage(image);
    setIsAutoPlaying(false);
  };

  const closeFullscreen = () => {
    setSelectedImage(null);
    setIsAutoPlaying(true);
  };

  return (
    <>
      <section className="gallery-section relative overflow-hidden">
        <div className="gallery-container">
          {/* Floating Gallery Label */}
          

         

          
          {/* Main Slider - Full Width */}
          <div className="relative w-full h-[600px] rounded-[3rem] overflow-hidden mb-8 group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                className="absolute inset-0 cursor-pointer"
                onClick={() => handleImageClick(GALLERY_IMAGES[currentIndex])}
              >
                <img
                  src={GALLERY_IMAGES[currentIndex].url}
                  alt={GALLERY_IMAGES[currentIndex].title}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-12">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-[#FF5E00] text-sm font-bold uppercase tracking-widest mb-3">
                      Archive {String(currentIndex + 1).padStart(2, '0')} / {String(GALLERY_IMAGES.length).padStart(2, '0')}
                    </div>
                    <h3 className="text-5xl font-black text-white mb-3 uppercase tracking-tight">
                      {GALLERY_IMAGES[currentIndex].title}
                    </h3>
                    <p className="text-xl text-gray-300 max-w-2xl">
                      {GALLERY_IMAGES[currentIndex].description}
                    </p>
                  </motion.div>
                </div>

                {/* Expand Icon */}
                <div className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={20} className="text-white" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight size={24} className="text-white" />
            </button>

            {/* Progress Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {GALLERY_IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-8 bg-[#FF5E00]' 
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {GALLERY_IMAGES.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-32 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-[#FF5E00] shadow-lg shadow-[#FF5E00]/30' 
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-all" />
                <div className="absolute bottom-2 left-2 text-white text-xs font-bold">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Floating View Gallery Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button 
              className="gallery-btn group"
              onClick={() => window.location.href = '/blog'}
            >
              <span>VIEW THE FULL GALLERY</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block ml-2"
              >
                →
              </motion.div>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-lg z-[100] flex items-center justify-center p-4"
            onClick={closeFullscreen}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative max-w-7xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeFullscreen}
                className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all z-10"
              >
                <X size={24} className="text-white" />
              </button>

              {/* Image */}
              <div className="relative h-[80vh] rounded-[2rem] overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Info */}
              <div className="mt-6 text-center">
                <h3 className="text-4xl font-black text-white mb-2 uppercase">
                  {selectedImage.title}
                </h3>
                <p className="text-xl text-gray-400">
                  {selectedImage.description}
                </p>
              </div>

              {/* Navigation in Fullscreen */}
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const prevIndex = (GALLERY_IMAGES.findIndex(img => img.id === selectedImage.id) - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
                    setSelectedImage(GALLERY_IMAGES[prevIndex]);
                  }}
                  className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all"
                >
                  <ChevronLeft size={28} className="text-white" />
                </button>
              </div>

              <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextIndex = (GALLERY_IMAGES.findIndex(img => img.id === selectedImage.id) + 1) % GALLERY_IMAGES.length;
                    setSelectedImage(GALLERY_IMAGES[nextIndex]);
                  }}
                  className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all"
                >
                  <ChevronRight size={28} className="text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

