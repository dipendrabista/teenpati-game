'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, Sparkles, DollarSign, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { playSound } from '@/lib/sounds';
import { SettlementView } from './SettlementView';

interface PlayerResult {
  id: string;
  name: string;
  cards: any[];
  handRanking?: string;
  finalChips: number;
  isWinner: boolean;
  position: number;
}

interface WinnerCelebrationProps {
  winnerName: string;
  winnerChips: number;
  potAmount: number;
  players: PlayerResult[];
  onPlayAgain?: () => void;
  onGoHome?: () => void;
  onQuickNext?: () => void;
}

export function WinnerCelebration({ 
  winnerName, 
  winnerChips, 
  potAmount,
  players,
  onPlayAgain, 
  onGoHome,
  onQuickNext
}: WinnerCelebrationProps) {
  const [showSettlement, setShowSettlement] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState(10); // 10 seconds countdown
  
  useEffect(() => {
    // Play victory sound
    playSound('victory');
    
    // Auto-close countdown (if quick next is enabled)
    let countdownInterval: NodeJS.Timeout;
    if (onQuickNext && !showSettlement) {
      countdownInterval = setInterval(() => {
        setAutoCloseTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            onQuickNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Big burst in center
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 200);

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [showSettlement, onQuickNext]);

  const celebrationCard = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 0.6 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/60 backdrop-blur-md"
    >
      <Card className="max-w-md w-full p-4 text-center space-y-2 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-red-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-2xl overflow-y-auto max-h-[95vh]">
        {/* Trophy Animation */}
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1, 1.1, 1]
          }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          className="flex justify-center"
        >
          <div className="relative">
            <Trophy className="h-12 w-12 text-yellow-500 drop-shadow-2xl" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-1 -left-1"
            >
              <Star className="h-4 w-4 text-orange-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Winner Text */}
        <div className="space-y-0.5">
          <motion.h2
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent"
          >
            🎉 WINNER! 🎉
          </motion.h2>
          <p className="text-lg font-bold text-foreground">
            {winnerName}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1 p-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-400 dark:border-green-600"
          >
            <p className="text-xs text-muted-foreground">Won</p>
            <p className="text-lg font-black text-green-600 dark:text-green-400">
              💰 {potAmount}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex-1 p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-400 dark:border-blue-600"
          >
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">
              💎 {winnerChips}
            </p>
          </motion.div>
        </div>

        {/* All Players Results */}
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-center">📊 Results</h4>
          {players
            .sort((a, b) => b.finalChips - a.finalChips)
            .map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`p-2 rounded-lg border ${
                  player.isWinner
                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-400 dark:border-yellow-600'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {player.isWinner && <Trophy className="h-3 w-3 text-yellow-600" />}
                    <div>
                      <p className="font-bold text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.handRanking || 'Did not show'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {player.finalChips} 💎
                    </p>
                  </div>
                </div>
                
                {/* Show cards if available */}
                {player.cards && player.cards.length > 0 && player.isWinner && (
                  <div className="flex gap-1 justify-center mt-1 flex-wrap">
                    {player.cards.map((card, i) => (
                      <div
                        key={i}
                        className="text-xs px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border"
                      >
                        {card.rank}
                        {card.suit === 'hearts' && '♥'}
                        {card.suit === 'diamonds' && '♦'}
                        {card.suit === 'clubs' && '♣'}
                        {card.suit === 'spades' && '♠'}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
        </div>

        {/* Settlement Button */}
        <Button
          onClick={() => setShowSettlement(true)}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-8"
          size="sm"
        >
          <DollarSign className="h-3 w-3 mr-1" />
          💰 Settlement
        </Button>

        {/* Quick Next Game Button */}
        {onQuickNext && (
          <div className="space-y-0.5">
            <Button
              onClick={onQuickNext}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white h-8"
              size="sm"
            >
              <Play className="h-3 w-3 mr-1" />
              ⚡ Next ({autoCloseTimer}s)
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Auto in {autoCloseTimer}s
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onGoHome}
            variant="outline"
            className="flex-1 h-8"
            size="sm"
          >
            🏠 Home
          </Button>
          {onPlayAgain ? (
            <Button
              onClick={onPlayAgain}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-8"
              size="sm"
            >
              🔄 Again
            </Button>
          ) : (
            <div className="flex-1 h-8 text-xs flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-muted-foreground">
              Waiting for host to start again…
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  return (
    <>
      {!showSettlement && celebrationCard}
      
      {/* Settlement Modal */}
      <AnimatePresence>
        {showSettlement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-2 rounded-t-2xl flex items-center justify-between z-10">
                <h2 className="text-lg font-bold">💰 Settlement</h2>
                <Button
                  onClick={() => setShowSettlement(false)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4">
                <SettlementView
                  players={players.map(p => ({
                    name: p.name,
                    finalChips: p.finalChips,
                    initialChips: 1000, // Starting chips
                    netChips: p.finalChips - 1000,
                  }))}
                  defaultChipValue={1}
                />
                
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => setShowSettlement(false)}
                    variant="outline"
                    className="flex-1 h-8"
                    size="sm"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    variant="default"
                    className="flex-1 h-8"
                    size="sm"
                  >
                    🖨️ Print
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
