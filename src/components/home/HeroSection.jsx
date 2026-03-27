import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight } from 'lucide-react';


export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);
  const videoRefs = useRef({});

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: () => base44.entities.Banner.filter({ active: true }, 'display_order', 20),
  });

  const slides = banners;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % slides.length);
    }, 6000);
  }, [slides.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  useEffect(() => {
    setCurrent(0);
  }, [banners.length]);

  if (slides.length === 0) return null;

  const goTo = (idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    startTimer();
  };

  const prev = () => {
    setDirection(-1);
    setCurrent(c => (c - 1 + slides.length) % slides.length);
    startTimer();
  };

  const next = () => {
    setDirection(1);
    setCurrent(c => (c + 1) % slides.length);
    startTimer();
  };

  const slide = slides[current];

  const variants = {
    enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <section className="relative w-full h-[90vh] min-h-[600px] overflow-hidden bg-nike-lightgray">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide.id || current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {slide.media_type === 'video' ? (
            <video
              ref={(el) => { if (el) videoRefs.current[current] = el; }}
              src={slide.media_url}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={slide.media_url}
              alt={slide.title || 'Banner'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-end pb-16 text-center px-6 z-10">
        {slide.subtitle && (
          <motion.p
            key={`sub-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-sm font-medium uppercase tracking-[0.3em] mb-3"
          >
            {slide.subtitle}
          </motion.p>
        )}
        {slide.title && (
          <motion.h1
            key={`title-${current}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white font-black uppercase text-4xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tighter leading-none mb-4"
          >
            {slide.title}
          </motion.h1>
        )}
        {slide.description && (
          <motion.p
            key={`desc-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-white/90 text-base sm:text-lg max-w-lg mb-8 font-light"
          >
            {slide.description}
          </motion.p>
        )}
        {slide.button_text && (
          <motion.div
            key={`btn-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              to={slide.button_link || '/products'}
              className="inline-block bg-white text-foreground px-8 py-4 text-sm font-medium hover:bg-foreground hover:text-white transition-colors duration-200"
            >
              {slide.button_text}
            </Link>
          </motion.div>
        )}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
