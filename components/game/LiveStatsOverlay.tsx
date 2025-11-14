'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '@/types/game';
import { 
  Trophy, 
  Coins, 
  Users, 
  Clock, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';

interface LiveStatsOverlayProps {
  gameState: GameState;
  gameDuration?: number; // in seconds
}

export function LiveStatsOverlay({ gameState, gameDuration = 0 }: LiveStatsOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate stats
  const activePlayers = gameState.players.filter(p => p.isActive && !p.hasFolded).length;
  const totalBet = gameState.players.reduce((sum, p) => sum + (p.currentBet || 0), 0);
  const highestBet = Math.max(...gameState.players.map(p => p.currentBet || 0), 0);
  const averageChips = Math.floor(
    gameState.players.reduce((sum, p) => sum + p.chips, 0) / gameState.players.length
  );

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed top-16 right-2 sm:top-20 sm:right-4 z-40"
    >
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden w-[70vw] sm:w-auto max-w-[90vw]">
        {/* Header - Always visible */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-2 sm:px-3 py-2 flex items-center justify-between gap-2 hover:bg-primary/5 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold text-primary">Live Stats</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-primary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-primary" />
          )}
        </motion.button>

        {/* Expanded Stats */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2 space-y-2 border-t border-primary/10">
                {/* Pot */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Pot</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                    🪙 {gameState.pot.toLocaleString()}
                  </span>
                </motion.div>

                {/* Current Bet */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Current Bet</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {gameState.currentBet.toLocaleString()}
                  </span>
                </motion.div>

                {/* Active Players */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Active</span>
                  </div>
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    {activePlayers} / {gameState.players.length}
                  </span>
                </motion.div>

                {/* Round Number */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Round</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    #{gameState.roundNumber}
                  </span>
                </motion.div>

                {/* Game Duration */}
                {gameDuration > 0 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Duration</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      ⏱️ {formatTime(gameDuration)}
                    </span>
                  </motion.div>
                )}

                {/* Divider */}
                <div className="border-t border-primary/10 pt-2">
                  <div className="text-[10px] text-center text-muted-foreground uppercase tracking-wide">
                    Advanced Stats
                  </div>
                </div>

                {/* Highest Bet */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded"
                >
                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Highest Bet</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {highestBet.toLocaleString()}
                  </span>
                </motion.div>

                {/* Total Bet */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded"
                >
                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Total Bet</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {totalBet.toLocaleString()}
                  </span>
                </motion.div>

                {/* Average Chips */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded"
                >
                  <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Avg Chips</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {averageChips.toLocaleString()}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini stats when collapsed */}
        {!isExpanded && (
          <div className="px-3 py-1.5 flex items-center gap-3 text-xs border-t border-primary/10">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-600" />
              <span className="font-bold text-yellow-700 dark:text-yellow-400">{gameState.pot}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-green-600" />
              <span className="font-bold text-green-700 dark:text-green-400">{activePlayers}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              <span className="font-bold text-purple-700 dark:text-purple-400">#{gameState.roundNumber}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

