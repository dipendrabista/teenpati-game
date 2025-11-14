'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayingCard } from './Card';
import { useI18n } from '@/lib/i18n';

interface HandHistoryProps {
  players: any[];
  winner: string;
  actions: Array<{
    playerId: string;
    action: string;
    amount?: number;
    timestamp: Date;
  }>;
  onClose: () => void;
}

export function HandHistory({ players, winner, actions, onClose }: HandHistoryProps) {
  const { t } = useI18n();
  const [showActions, setShowActions] = useState(false);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  const getHandRank = (cards: any[]) => {
    if (!cards || cards.length === 0) return 'No cards';
    // This is a simplified version - you'd use your actual hand evaluation
    return 'Hand'; // Replace with actual hand ranking
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === winner) return -1;
    if (b.id === winner) return 1;
    return 0;
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                {t('handHistory.title')}
              </h2>
              <p className="text-sm opacity-90 mt-1">{t('handHistory.subtitle')}</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Players' Hands */}
          <div className="p-6 space-y-4">
            {sortedPlayers.map((player, index) => {
              const isWinner = player.id === winner;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border-2 ${
                    isWinner
                      ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {isWinner && <Trophy className="h-5 w-5 text-yellow-500" />}
                      <div>
                        <div className="font-bold text-lg">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getHandRank(player.cards)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{t('handHistory.finalChips')}</div>
                      <div className="font-bold text-lg">{player.chips} {t('common.chips')}</div>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex gap-2 justify-center">
                    {player.cards && player.cards.length > 0 ? (
                      player.cards.map((card: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ rotateY: 180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 + idx * 0.15 }}
                        >
                          <PlayingCard
                            card={card}
                            size="md"
                            className="transform hover:scale-110 transition-transform"
                          />
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        {player.hasFolded ? t('handHistory.folded') : t('handHistory.noCards')}
                      </div>
                    )}
                  </div>

                  {/* Player Stats */}
                  {!player.hasFolded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">{t('handHistory.totalBet')}:</span>
                        <span className="font-semibold">{player.totalBet || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground">{t('handHistory.status')}:</span>
                        <span className="font-semibold">
                          {player.hasSeen ? t('handHistory.seen') : t('handHistory.blind')}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Action Timeline Toggle */}
          <div className="px-6 pb-4">
            <Button
              onClick={() => setShowActions(!showActions)}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {showActions ? t('handHistory.hideTimeline') : t('handHistory.showTimeline')}
            </Button>
          </div>

          {/* Action Timeline */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 max-h-60 overflow-y-auto">
                  <h3 className="font-semibold mb-2">{t('handHistory.actionTimeline')}</h3>
                  {actions.length > 0 ? (
                    actions.map((action, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-2 text-sm py-1"
                      >
                        <span className="text-xs text-muted-foreground w-8">#{idx + 1}</span>
                        <span className="font-medium">{getPlayerName(action.playerId)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="capitalize">{action.action}</span>
                        {action.amount && (
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {action.amount}
                          </span>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground italic text-center py-2">
                      {t('handHistory.noActions')}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Button onClick={onClose} className="w-full" size="lg">
              {t('common.close')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

