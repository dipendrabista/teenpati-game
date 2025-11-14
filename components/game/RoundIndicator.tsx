'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface RoundIndicatorProps {
  roundNumber: number;
}

export function RoundIndicator({ roundNumber }: RoundIndicatorProps) {
  if (roundNumber === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.6 }}
      className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full shadow-md border border-white/80 dark:border-gray-800/80"
    >
      <Sparkles className="h-3 w-3 opacity-90" />
      <span className="font-bold text-xs tracking-tight">
        Round {roundNumber}
      </span>
      <Sparkles className="h-3 w-3 opacity-90 hidden sm:inline" />
    </motion.div>
  );
}


