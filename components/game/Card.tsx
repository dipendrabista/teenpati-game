'use client';

import { motion } from 'framer-motion';
import { Card as CardType, Suit } from '@/types/game';
import { cn } from '@/lib/utils';

interface CardProps {
  card: CardType;
  isHidden?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  highlightLucky?: boolean;
}

// Check if a card is "lucky" (high value)
const isLuckyCard = (rank: string): boolean => {
  return ['A', 'K', 'Q', 'J'].includes(rank);
};

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

const sizeClasses = {
  sm: 'w-14 h-20 text-xs',
  md: 'w-16 h-24 text-sm',
  lg: 'w-20 h-28 text-base',
};

export function PlayingCard({ card, isHidden = false, isSelected = false, onClick, className, size = 'md', highlightLucky = false }: CardProps) {
  const isLucky = highlightLucky && isLuckyCard(card.rank);
  
  if (isHidden) {
    return (
      <motion.div
        whileHover={onClick ? { scale: 1.08, y: -12, rotateZ: 2 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
        onClick={onClick}
        className={cn(
          'relative rounded-xl shadow-2xl cursor-pointer transition-all',
          sizeClasses[size],
          className,
          onClick && 'hover:shadow-primary/50'
        )}
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl border-2 border-white/40 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,.08)_10px,rgba(255,255,255,.08)_20px)] rounded-xl" />
          <div className="absolute top-1 left-1 w-8 h-8 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-1 right-1 w-10 h-10 bg-white/10 rounded-full blur-xl" />
          <div className="text-white font-bold text-2xl drop-shadow-lg z-10">🎴</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ rotateY: 180, scale: 0.8 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      whileHover={onClick ? { scale: 1.08, y: -12, rotateZ: 2 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={cn(
        'relative rounded-xl transition-all',
        sizeClasses[size],
        isSelected && 'ring-4 ring-primary ring-offset-2 -translate-y-6 rotate-2',
        onClick && 'cursor-pointer hover:shadow-primary/30',
        isLucky && 'shadow-2xl shadow-yellow-500/50 ring-2 ring-yellow-400/50',
        !isLucky && 'shadow-2xl',
        className
      )}
    >
      {/* Lucky card glow effect */}
      {isLucky && (
        <>
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 blur-sm -z-10"
          />
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 rounded-xl overflow-hidden -z-10"
          >
            <div className="absolute top-0 left-1/2 w-full h-full bg-gradient-to-b from-white/20 to-transparent blur-sm transform -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
        </>
      )}
      <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-1.5 flex flex-col relative overflow-hidden">
        {/* Decorative corner gradients */}
        <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-gray-100/50 to-transparent rounded-full blur-lg" />
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-gray-100/50 to-transparent rounded-full blur-lg" />
        
        {/* Top Left Corner */}
        <div className={cn('flex flex-col items-center z-10', suitColors[card.suit])}>
          <div className="font-bold leading-none text-sm">{card.rank}</div>
          <div className="text-base leading-none drop-shadow">{suitSymbols[card.suit]}</div>
        </div>

        {/* Center Symbol */}
        <div className="flex-1 flex items-center justify-center z-10">
          <motion.div 
            className={cn('text-3xl drop-shadow-lg', suitColors[card.suit])}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {suitSymbols[card.suit]}
          </motion.div>
        </div>

        {/* Bottom Right Corner (Rotated) */}
        <div className={cn('flex flex-col items-center rotate-180 z-10', suitColors[card.suit])}>
          <div className="font-bold leading-none text-sm">{card.rank}</div>
          <div className="text-base leading-none drop-shadow">{suitSymbols[card.suit]}</div>
        </div>
      </div>
    </motion.div>
  );
}

