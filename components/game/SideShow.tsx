'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, X, Check, Coins, AlertTriangle } from 'lucide-react';
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
}

interface SideShowProps {
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

export function SideShow({
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
}: SideShowProps) {
  const [showResults, setShowResults] = useState(false);
  const lastShownKeyRef = useRef<string | null>(null);
  const dismissedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!results) return;
    // Only involved players should see the results
    if (results.winner !== currentPlayerId && results.loser !== currentPlayerId) return;
    const key = `${results.winner}-${results.loser}-${results.potSplit}-${(results as any).timestamp ?? ''}`;
    if (dismissedKeyRef.current === key) return; // user already continued
    if (lastShownKeyRef.current === key && !showResults) return; // already shown and closed
    lastShownKeyRef.current = key;
    setShowResults(true);
  }, [results]);

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  // Side show challenge UI (when someone challenges you)
  if (challenge && challenge.target === currentPlayerId) {
    const challengerName = getPlayerName(challenge.challenger);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Side Show Challenge!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {challengerName} wants to compare cards with you.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Winner takes half the pot!
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

  // Side show results UI
  if (showResults && results && (results.winner === currentPlayerId || results.loser === currentPlayerId)) {
    const winnerName = getPlayerName(results.winner);
    const loserName = getPlayerName(results.loser);
    const isWinner = results.winner === currentPlayerId;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className={`rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 ${
              isWinner
                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-400'
                : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-400'
            }`}
          >
            <div className="text-center mb-6">
              <Trophy className={`h-12 w-12 mx-auto mb-3 ${isWinner ? 'text-yellow-500' : 'text-red-500'}`} />
              <h3 className="text-xl font-bold mb-2">
                Side Show Results!
              </h3>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="font-semibold">{winnerName}</span>
                <Badge variant={isWinner ? "default" : "secondary"}>
                  {isWinner ? 'You Won!' : 'Won'}
                </Badge>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Coins className="h-4 w-4 text-green-600" />
                <span className="text-lg font-bold text-green-600">
                  +{results.potSplit} chips
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {loserName} lost the showdown
              </p>
            </div>

            <Button
              onClick={() => {
                const key = results ? `${results.winner}-${results.loser}-${results.potSplit}-${(results as any).timestamp ?? ''}` : '';
                dismissedKeyRef.current = key;
                setShowResults(false);
              }}
              className="w-full"
              variant="outline"
            >
              Continue Game
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }


  return null;
}

// Mini side show indicator for game board
export function SideShowIndicator({
  challenge,
  players
}: {
  challenge: SideShowChallenge | null;
  players: any[];
}) {
  if (!challenge) return null;

  const challengerName = players.find(p => p.id === challenge.challenger)?.name || 'Unknown';
  const targetName = players.find(p => p.id === challenge.target)?.name || 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
    >
      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-300 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="font-medium">
              {challengerName} challenged {targetName}
            </span>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
