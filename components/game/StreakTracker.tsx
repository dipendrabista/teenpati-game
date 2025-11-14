'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Zap, Star } from 'lucide-react';

interface StreakTrackerProps {
  streak: number;
  isVisible: boolean;
}

export function StreakTracker({ streak, isVisible }: StreakTrackerProps) {
  if (!isVisible || streak === 0) return null;

  // Determine streak tier and styling
  const getStreakTier = (streak: number) => {
    if (streak >= 5) return {
      tier: 'legendary',
      color: 'from-purple-600 via-pink-600 to-red-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      emoji: '🔥',
      icon: Trophy,
      message: 'LEGENDARY!',
      glow: 'shadow-2xl shadow-purple-500/50'
    };
    if (streak >= 3) return {
      tier: 'hot',
      color: 'from-orange-500 via-red-500 to-pink-600',
      textColor: 'text-orange-600 dark:text-orange-400',
      emoji: '🔥',
      icon: Flame,
      message: 'ON FIRE!',
      glow: 'shadow-xl shadow-orange-500/50'
    };
    if (streak >= 2) return {
      tier: 'streak',
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      emoji: '⚡',
      icon: Zap,
      message: 'STREAK!',
      glow: 'shadow-lg shadow-yellow-500/50'
    };
    return {
      tier: 'normal',
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      emoji: '⭐',
      icon: Star,
      message: 'WIN!',
      glow: 'shadow-md shadow-blue-500/50'
    };
  };

  const tierInfo = getStreakTier(streak);
  const Icon = tierInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, rotate: -180, y: -20 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        exit={{ scale: 0, rotate: 180, y: 20 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${tierInfo.color} rounded-full ${tierInfo.glow} border-2 border-white`}
      >
        {/* Animated Icon */}
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, -10, 0],
            scale: [1, 1.2, 1, 1.2, 1],
          }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          <Icon className="h-5 w-5 text-white" />
        </motion.div>

        {/* Streak Counter */}
        <div className="flex flex-col items-center">
          <motion.div
            key={streak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1"
          >
            <span className="text-2xl font-black text-white drop-shadow-lg">
              {streak}
            </span>
            <span className="text-xl">{tierInfo.emoji}</span>
          </motion.div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">
            {tierInfo.message}
          </span>
        </div>

        {/* Pulse effect */}
        {streak >= 2 && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-white/30"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for header
export function CompactStreak({ streak, isVisible }: StreakTrackerProps) {
  if (!isVisible || streak === 0) return null;

  const getColor = (streak: number) => {
    if (streak >= 5) return 'bg-gradient-to-r from-purple-600 to-pink-600';
    if (streak >= 3) return 'bg-gradient-to-r from-orange-500 to-red-600';
    if (streak >= 2) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-blue-500 to-cyan-600';
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      className={`inline-flex items-center gap-1 px-2 py-1 ${getColor(streak)} rounded-full text-white shadow-lg`}
    >
      <Flame className="h-3 w-3" />
      <span className="text-xs font-bold">{streak}</span>
    </motion.div>
  );
}

// Floating celebration when streak milestone reached
interface StreakCelebrationProps {
  streak: number;
  show: boolean;
  onComplete: () => void;
}

export function StreakCelebration({ streak, show, onComplete }: StreakCelebrationProps) {
  if (!show) return null;

  const getMessage = (streak: number) => {
    if (streak === 5) return { text: '🔥 LEGENDARY STREAK! 🔥', color: 'from-purple-600 to-pink-600' };
    if (streak === 4) return { text: '🔥 AMAZING! 4 IN A ROW! 🔥', color: 'from-orange-500 to-red-600' };
    if (streak === 3) return { text: '⚡ HAT-TRICK! ⚡', color: 'from-orange-500 to-red-500' };
    if (streak === 2) return { text: '⚡ DOUBLE WIN! ⚡', color: 'from-yellow-500 to-orange-500' };
    return { text: '', color: '' };
  };

  const message = getMessage(streak);
  if (!message.text) return null;

  return (
    <motion.div
      initial={{ scale: 0, y: 100, opacity: 0 }}
      animate={{ scale: [0, 1.2, 1], y: 0, opacity: 1 }}
      exit={{ scale: 0, y: -50, opacity: 0 }}
      transition={{ duration: 0.6, ease: 'backOut' }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000);
      }}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className={`bg-gradient-to-r ${message.color} px-8 py-4 rounded-2xl shadow-2xl border-4 border-white`}>
        <motion.p
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-2xl font-black text-white text-center drop-shadow-lg"
        >
          {message.text}
        </motion.p>
      </div>

      {/* Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * Math.PI * 2) / 8) * 100,
            y: Math.sin((i * Math.PI * 2) / 8) * 100,
          }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-400 rounded-full"
        />
      ))}
    </motion.div>
  );
}

