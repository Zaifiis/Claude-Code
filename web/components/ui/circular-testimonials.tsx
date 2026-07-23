'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface CircularTestimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}

interface CircularTestimonialsColors {
  name?: string;
  designation?: string;
  testimony?: string;
  arrowBackground?: string;
  arrowForeground?: string;
  arrowHoverBackground?: string;
}

interface CircularTestimonialsFontSizes {
  name?: string;
  designation?: string;
  quote?: string;
}

interface CircularTestimonialsProps {
  testimonials: CircularTestimonial[];
  autoplay?: boolean;
  colors?: CircularTestimonialsColors;
  fontSizes?: CircularTestimonialsFontSizes;
}

export function CircularTestimonials({
  testimonials,
  autoplay = false,
  colors = {},
  fontSizes = {},
}: CircularTestimonialsProps) {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);

  const {
    name: nameColor = 'inherit',
    designation: designationColor = 'inherit',
    testimony: testimonyColor = 'inherit',
    arrowBackground = '#141414',
    arrowForeground = '#f1f1f7',
    arrowHoverBackground = '#00A6FB',
  } = colors;

  const {
    name: nameSize = '24px',
    designation: designationSize = '18px',
    quote: quoteSize = '18px',
  } = fontSizes;

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (!autoplay || hovering) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [autoplay, hovering, next]);

  const getIndex = (offset: number) =>
    (active + offset + testimonials.length) % testimonials.length;

  return (
    <div
      className="flex w-full flex-col items-center gap-10 md:flex-row md:items-center"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative h-64 w-64 shrink-0">
        {testimonials.map((testimonial, index) => {
          const offset =
            (index - active + testimonials.length) % testimonials.length;
          const isActive = offset === 0;
          const isPrev = offset === testimonials.length - 1;
          const isNext = offset === 1;
          const visible = isActive || isPrev || isNext;

          return (
            <motion.div
              key={testimonial.src + testimonial.name}
              className="absolute inset-0 overflow-hidden rounded-full"
              initial={false}
              animate={{
                opacity: visible ? (isActive ? 1 : 0.5) : 0,
                scale: isActive ? 1 : 0.75,
                x: isActive ? 0 : isPrev ? -56 : isNext ? 56 : 0,
                zIndex: isActive ? 3 : isPrev || isNext ? 2 : 1,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Image
                src={testimonial.src}
                alt={testimonial.name}
                fill
                sizes="256px"
                className="object-cover"
              />
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <p style={{ color: testimonyColor, fontSize: quoteSize }} className="leading-relaxed">
              &ldquo;{testimonials[active].quote}&rdquo;
            </p>
            <p
              style={{ color: nameColor, fontSize: nameSize }}
              className="mt-6 font-semibold"
            >
              {testimonials[active].name}
            </p>
            <p style={{ color: designationColor, fontSize: designationSize }}>
              {testimonials[active].designation}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={prev}
            style={{ background: arrowBackground, color: arrowForeground }}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.background = arrowHoverBackground)}
            onMouseLeave={(e) => (e.currentTarget.style.background = arrowBackground)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={next}
            style={{ background: arrowBackground, color: arrowForeground }}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.background = arrowHoverBackground)}
            onMouseLeave={(e) => (e.currentTarget.style.background = arrowBackground)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
