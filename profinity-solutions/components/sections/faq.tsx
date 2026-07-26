'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { FAQS } from '@/lib/site-config';

export function Faq({ items = FAQS }: { items?: readonly { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-surface/50">
      {items.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={faq.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-display text-base font-medium text-foreground">{faq.q}</span>
              <Plus
                className={`h-5 w-5 flex-none text-brand-light transition-transform duration-300 ${
                  isOpen ? 'rotate-45' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
