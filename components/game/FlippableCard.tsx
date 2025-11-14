'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card as CardType } from '@/types/game';

interface FlippableCardProps {
  card: CardType;
  isFlipped: boolean;
  delay?: number;
  onFlipComplete?: () => void;
}

export function FlippableCard({ card, isFlipped, delay = 0, onFlipComplete }: FlippableCardProps) {
  const [hasFlipped, setHasFlipped] = useState(false);

  useEffect(() => {
    if (isFlipped && !hasFlipped) {
      setHasFlipped(true);
      // Call onFlipComplete after animation finishes
      if (onFlipComplete) {
        setTimeout(() => {
          onFlipComplete();
        }, 600 + delay); // Match animation duration
      }
    }
  }, [isFlipped, hasFlipped, onFlipComplete, delay]);

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-gray-900';
  };

  const getSuitSymbol = (suit: string) => {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[suit as keyof typeof symbols] || '';
  };

  return (
    <div className="relative w-20 h-28 perspective-1000" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.6,
          delay: delay / 1000,
          ease: [0.4, 0.0, 0.2, 1],
        }}
      >
        {/* Card Back */}
        <div
          className="absolute inset-0 rounded-lg shadow-xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 border-2 border-white shadow-2xl relative overflow-hidden">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(255,255,255,0.1) 10px,
                  rgba(255,255,255,0.1) 20px
                )`
              }} />
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 10px,
                  rgba(255,255,255,0.1) 10px,
                  rgba(255,255,255,0.1) 20px
                )`
              }} />
            </div>
            
            {/* Center design */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/30 border border-white/50 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">🃏</span>
                </div>
              </div>
            </div>

            {/* Corner decorations */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br" />

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>

        {/* Card Front */}
        <div
          className="absolute inset-0 rounded-lg shadow-xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="w-full h-full rounded-lg bg-white border-2 border-gray-300 shadow-2xl p-2 relative">
            {/* Top left corner */}
            <div className={`absolute top-1 left-1 flex flex-col items-center ${getSuitColor(card.suit)}`}>
              <span className="text-xl font-bold leading-none">{card.rank}</span>
              <span className="text-2xl leading-none">{getSuitSymbol(card.suit)}</span>
            </div>

            {/* Center suit */}
            <div className={`absolute inset-0 flex items-center justify-center ${getSuitColor(card.suit)}`}>
              <span className="text-5xl opacity-20">{getSuitSymbol(card.suit)}</span>
            </div>

            {/* Bottom right corner (rotated) */}
            <div 
              className={`absolute bottom-1 right-1 flex flex-col items-center ${getSuitColor(card.suit)}`}
              style={{ transform: 'rotate(180deg)' }}
            >
              <span className="text-xl font-bold leading-none">{card.rank}</span>
              <span className="text-2xl leading-none">{getSuitSymbol(card.suit)}</span>
            </div>

            {/* Shine effect on flip */}
            {hasFlipped && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, delay: delay / 1000 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Multi-card flip animation wrapper
interface CardRevealProps {
  cards: CardType[];
  isRevealing: boolean;
  onRevealComplete?: () => void;
}

export function CardReveal({ cards, isRevealing, onRevealComplete }: CardRevealProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  const handleCardFlipped = () => {
    setRevealedCount(prev => {
      const newCount = prev + 1;
      if (newCount === cards.length && onRevealComplete) {
        onRevealComplete();
      }
      return newCount;
    });
  };

  return (
    <div className="flex gap-2 justify-center items-center">
      {cards.map((card, index) => (
        <motion.div
          key={`${card.suit}-${card.rank}-${index}`}
          initial={{ y: -50, opacity: 0, rotate: -10 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{
            delay: index * 0.1,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        >
          <FlippableCard
            card={card}
            isFlipped={isRevealing}
            delay={index * 200} // Stagger the flip
            onFlipComplete={index === cards.length - 1 ? handleCardFlipped : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}

