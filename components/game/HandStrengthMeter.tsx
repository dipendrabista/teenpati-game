'use client';

import { motion } from 'framer-motion';
import { evaluateHand } from '@/lib/teenPatiUtils';
import { Card as CardType } from '@/types/game';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HandStrengthMeterProps {
  cards: CardType[];
  showMeter: boolean;
}

export function HandStrengthMeter({ cards, showMeter }: HandStrengthMeterProps) {
  if (!showMeter || cards.length === 0) return null;

  const handEval = evaluateHand(cards);
  
  // Map hand rankings to strength (0-100)
  const strengthMap: { [key: string]: number } = {
    'Trail': 95,           // Three of a kind - strongest
    'Pure Sequence': 90,   // Straight flush
    'Sequence': 80,        // Straight
    'Color': 70,           // Flush
    'Pair': 50,            // Pair
    'High Card': 20,       // Weakest
  };

  const strength = strengthMap[handEval.rank] || 20;
  
  // Determine color and label based on strength
  const getStrengthInfo = (str: number) => {
    if (str >= 85) return { 
      color: 'from-green-500 to-emerald-600', 
      label: 'Excellent', 
      icon: TrendingUp,
      textColor: 'text-green-600 dark:text-green-400',
      emoji: '🔥'
    };
    if (str >= 70) return { 
      color: 'from-blue-500 to-cyan-600', 
      label: 'Strong', 
      icon: TrendingUp,
      textColor: 'text-blue-600 dark:text-blue-400',
      emoji: '💪'
    };
    if (str >= 50) return { 
      color: 'from-yellow-500 to-orange-500', 
      label: 'Moderate', 
      icon: Minus,
      textColor: 'text-yellow-600 dark:text-yellow-400',
      emoji: '⚡'
    };
    if (str >= 30) return { 
      color: 'from-orange-500 to-red-500', 
      label: 'Weak', 
      icon: TrendingDown,
      textColor: 'text-orange-600 dark:text-orange-400',
      emoji: '⚠️'
    };
    return { 
      color: 'from-red-600 to-red-700', 
      label: 'Very Weak', 
      icon: TrendingDown,
      textColor: 'text-red-600 dark:text-red-400',
      emoji: '💀'
    };
  };

  const strengthInfo = getStrengthInfo(strength);
  const Icon = strengthInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-xs mx-auto"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border-2 border-primary/20 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${strengthInfo.textColor}`} />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Hand Strength
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">{strengthInfo.emoji}</span>
            <span className={`text-xs font-bold ${strengthInfo.textColor}`}>
              {strengthInfo.label}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className={`h-full bg-gradient-to-r ${strengthInfo.color} rounded-full relative overflow-hidden`}
          >
            {/* Shine effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>

        {/* Percentage */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {handEval.description}
          </span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className={`text-xs font-bold ${strengthInfo.textColor}`}
          >
            {strength}%
          </motion.span>
        </div>

        {/* Comparison indicators */}
        <div className="mt-2 grid grid-cols-5 gap-1">
          {[20, 40, 60, 80, 100].map((threshold, index) => (
            <div
              key={threshold}
              className={`h-1 rounded-full transition-colors ${
                strength >= threshold - 10
                  ? 'bg-gradient-to-r ' + strengthInfo.color
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for small spaces
export function CompactHandStrength({ cards, showMeter }: HandStrengthMeterProps) {
  if (!showMeter || cards.length === 0) return null;

  const handEval = evaluateHand(cards);
  
  const strengthMap: { [key: string]: number } = {
    'Trail': 95,
    'Pure Sequence': 90,
    'Sequence': 80,
    'Color': 70,
    'Pair': 50,
    'High Card': 20,
  };

  const strength = strengthMap[handEval.rank] || 20;
  
  const getColor = (str: number) => {
    if (str >= 85) return 'text-green-500';
    if (str >= 70) return 'text-blue-500';
    if (str >= 50) return 'text-yellow-500';
    if (str >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`w-1 h-3 rounded-full ${
              strength >= bar * 20
                ? getColor(strength)
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-bold ${getColor(strength)}`}>
        {strength}%
      </span>
    </motion.div>
  );
}

