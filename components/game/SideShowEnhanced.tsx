'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Coins, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PlayingCard } from './Card';

interface SideShowChallenge {
  challenger: string;
  target: string;
  challengerCards: any[];
  targetCards: any[];
  timestamp: number;
}

interface SideShowResults {
  winner: string;
  loser: string;
  potSplit: number;
  timestamp?: number;
}

interface SideShowEnhancedProps {
  challenge: SideShowChallenge | null;
  results: SideShowResults | null;
  currentPlayerId: string;
  players: any[];
  onAccept: () => void;
  onDecline: () => void;
  onChallenge: (targetPlayerId: string) => void;
  canChallenge: boolean;
  isCurrentTurn: boolean;
  currentPlayerHasSeen?: boolean;
  onSeeThenAccept?: () => void;
}

export function SideShowEnhanced({
  challenge,
  results,
  currentPlayerId,
  players,
  onAccept,
  onDecline,
  onChallenge,
  canChallenge,
  isCurrentTurn,
  currentPlayerHasSeen,
  onSeeThenAccept
}: SideShowEnhancedProps) {
  const [showResults, setShowResults] = useState(false);
  const lastShownKeyRef = useRef<string | null>(null);
  const dismissedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!results) return;
    // Only show to involved players
    if (results.winner !== currentPlayerId && results.loser !== currentPlayerId) return;
    const key = `${results.winner}-${results.loser}-${results.potSplit}-${(results as any).timestamp ?? ''}`;
    if (dismissedKeyRef.current === key) return;
    if (lastShownKeyRef.current === key && !showResults) return;
    lastShownKeyRef.current = key;
    setShowResults(true);
  }, [results, currentPlayerId, showResults]);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  // Challenge UI
  if (challenge && challenge.target === currentPlayerId) {
    const challengerName = getPlayerName(challenge.challenger);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full border-2 border-orange-400"
          >
            <div className="text-center mb-6">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-3 animate-bounce" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Side Show Challenge!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">{challengerName}</span> wants to compare cards with you.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={currentPlayerHasSeen ? onAccept : onSeeThenAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                title={currentPlayerHasSeen ? undefined : 'See cards first and accept'}
              >
                <Check className="h-4 w-4 mr-2" />
                {currentPlayerHasSeen ? 'Accept' : 'See & Accept'}
              </Button>
              <Button
                onClick={onDecline}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Enhanced Results UI with animated cards
  if (showResults && results && (results.winner === currentPlayerId || results.loser === currentPlayerId)) {
    const winnerName = getPlayerName(results.winner);
    const loserName = getPlayerName(results.loser);
    const isWinner = results.winner === currentPlayerId;
    const winnerPlayer = players.find(p => p.id === results.winner);
    const loserPlayer = players.find(p => p.id === results.loser);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, rotateY: -15 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="rounded-2xl shadow-2xl p-6 max-w-3xl w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700"
          >
            {/* Sparkle Effect */}
            {isWinner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4"
              >
                <Sparkles className="h-8 w-8 text-yellow-400" />
              </motion.div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, duration: 0.8 }}
              >
                <Trophy className={`h-16 w-16 mx-auto mb-3 ${isWinner ? 'text-yellow-500' : 'text-gray-400'}`} />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              >
                Side Show Results
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-muted-foreground"
              >
                Card Comparison
              </motion.p>
            </div>

            {/* Cards Comparison - Side by Side */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Winner Side */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className={`p-5 rounded-2xl border-3 shadow-lg ${
                  results.winner === currentPlayerId
                    ? 'bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-50 dark:from-yellow-900/30 dark:via-yellow-800/30 dark:to-orange-900/30 border-yellow-400 ring-2 ring-yellow-300'
                    : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-400'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    </motion.div>
                    <div>
                      <div className="font-bold text-lg">{winnerName}</div>
                      <Badge className="text-xs bg-green-500 text-white">WINNER</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Winner's Cards */}
                <div className="flex gap-2 justify-center mb-4">
                  {winnerPlayer?.cards && winnerPlayer.cards.map((card: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 1.0 + idx * 0.2, 
                        duration: 0.5,
                        type: 'spring',
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.1, y: -5 }}
                    >
                      <PlayingCard card={card} size="md" />
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/40 rounded-full py-2 px-4">
                    <Coins className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                      +{results.potSplit}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* VS Divider */}
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-4 shadow-2xl border-4 border-white dark:border-gray-800">
                  <span className="text-white font-bold text-2xl">VS</span>
                </div>
              </motion.div>

              {/* Loser Side */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className={`p-5 rounded-2xl border-3 shadow-lg ${
                  results.loser === currentPlayerId
                    ? 'bg-gradient-to-br from-red-50 via-red-100 to-pink-50 dark:from-red-900/30 dark:via-red-800/30 dark:to-pink-900/30 border-red-400 ring-2 ring-red-300'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <X className="h-6 w-6 text-red-500" />
                    </motion.div>
                    <div>
                      <div className="font-bold text-lg">{loserName}</div>
                      <Badge variant="secondary" className="text-xs">LOST</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Loser's Cards */}
                <div className="flex gap-2 justify-center mb-4">
                  {loserPlayer?.cards && loserPlayer.cards.map((card: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 1.0 + idx * 0.2, 
                        duration: 0.5,
                        type: 'spring',
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.1, y: -5 }}
                    >
                      <PlayingCard card={card} size="md" />
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                  className="text-center"
                >
                  <div className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-100 dark:bg-red-900/40 rounded-full py-2 px-4">
                    ❌ Eliminated
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Result Message */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 2.0, type: 'spring' }}
              className={`p-5 rounded-xl mb-6 text-center shadow-lg ${
                isWinner
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border-2 border-green-400'
                  : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/40 dark:to-pink-900/40 border-2 border-red-400'
              }`}
            >
              <div className={`font-bold text-2xl mb-2 ${isWinner ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {isWinner ? '🎉 You Won the Side Show!' : '😞 You Lost the Side Show'}
              </div>
              <div className={`text-sm ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isWinner
                  ? `You won ${results.potSplit} chips from the pot`
                  : 'You have been eliminated from this round'}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              <Button
                onClick={() => {
                  const key = results ? `${results.winner}-${results.loser}-${results.potSplit}-${(results as any).timestamp ?? ''}` : '';
                  dismissedKeyRef.current = key;
                  setShowResults(false);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                size="lg"
              >
                Continue Game
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}

