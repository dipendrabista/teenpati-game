'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ChipAnimationProps {
  amount: number;
  onComplete?: () => void;
}

export function ChipAnimation({ amount, onComplete }: ChipAnimationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 0, scale: 0.5 }}
        animate={{ 
          opacity: [0, 1, 1, 0], 
          y: [0, -20, -40, -60],
          scale: [0.5, 1, 1.1, 0.8]
        }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      >
        <div className="flex flex-col items-center gap-1">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1.5, ease: "linear" }}
            className="text-4xl drop-shadow-lg"
          >
            💰
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: 2 }}
            className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-black text-lg rounded-full shadow-xl border-2 border-white"
          >
            +{amount}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


