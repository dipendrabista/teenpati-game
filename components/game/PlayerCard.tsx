'use client';

import { motion } from 'framer-motion';
import { Check, Clock, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { TurnTimer } from './TurnTimer';

interface PlayerCardProps {
  position: number;
  player: Player | undefined;
  isCurrentPlayer: boolean;
  isCurrentTurn: boolean;
  gameStatus: 'waiting' | 'playing' | 'finished';
}

export function PlayerCard({ position, player, isCurrentPlayer, isCurrentTurn, gameStatus }: PlayerCardProps) {
  const isEmpty = !player;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: position * 0.1, type: 'spring' }}
      whileHover={!isEmpty ? { scale: 1.02, y: -4 } : {}}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all shadow-2xl border-2',
          isEmpty && 'border-dashed opacity-50 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
          !isEmpty && 'bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20',
          isCurrentPlayer && 'ring-4 ring-primary ring-offset-2 shadow-2xl shadow-primary/30 border-primary',
          isCurrentTurn && gameStatus === 'playing' && 'ring-4 ring-yellow-500 ring-offset-2 shadow-2xl shadow-yellow-500/50 animate-pulse bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-red-900/30 border-yellow-500'
        )}
      >
        {/* Background Decorations */}
        {!isEmpty && (
          <>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl" />
            {isCurrentTurn && (
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-orange-300/20 to-red-300/20"
              />
            )}
          </>
        )}
        
        {isCurrentTurn && gameStatus === 'playing' && (
          <div className="absolute top-2 right-2 z-10">
            <TurnTimer 
              duration={30} 
              isActive={true}
            />
          </div>
        )}
        <CardContent className="pt-2 pb-2 px-2">
          <div className="flex flex-col items-center space-y-1">
            {/* Avatar */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Avatar className="h-12 w-12 ring-1 ring-white shadow-md">
                  {player?.avatar ? (
                    <AvatarImage src={player.avatar} alt={player.name} />
                  ) : (
                    <AvatarFallback className={cn(
                      "text-base font-bold",
                      isCurrentPlayer && "bg-primary text-primary-foreground",
                      !isCurrentPlayer && "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    )}>
                      {isEmpty ? `P${position}` : player.name[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </motion.div>
              {player?.isReady && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border border-background shadow-md"
                >
                  <Check className="h-2.5 w-2.5 text-white font-bold" />
                </motion.div>
              )}
            </div>

            {/* Player Info */}
            <div className="text-center space-y-0.5 w-full">
              <div className="flex items-center justify-center gap-1">
                <h3 className="font-bold text-xs truncate px-1">
                  {isEmpty ? `P${position}` : player.name}
                </h3>
                {/* Player Status Indicator */}
                {player && (
                  <div className="flex-shrink-0">
                    {gameStatus === 'playing' && isCurrentTurn ? (
                      // Thinking (their turn)
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="h-2 w-2 rounded-full bg-yellow-500"
                        title="Thinking..."
                      />
                    ) : gameStatus === 'playing' && player.isActive && !player.hasFolded ? (
                      // Active & ready
                      <div 
                        className="h-2 w-2 rounded-full bg-green-500"
                        title="Active"
                      />
                    ) : player.hasFolded ? (
                      // Folded
                      <div 
                        className="h-2 w-2 rounded-full bg-red-500"
                        title="Folded"
                      />
                    ) : (
                      // Waiting/Idle
                      <div 
                        className="h-2 w-2 rounded-full bg-gray-400"
                        title="Waiting"
                      />
                    )}
                  </div>
                )}
              </div>
              {player && (
                <div className="space-y-0.5 w-full">
                  {/* Chips Display */}
                  <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-800">
                    <span className="text-sm">💰</span>
                    <span className="font-bold text-xs text-yellow-700 dark:text-yellow-400">{player.chips}</span>
                  </div>
                  
                  {gameStatus === 'playing' && (
                    <>
                      {/* Bet Display */}
                      <div className="flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full text-xs">
                        <span className="text-muted-foreground">B:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{player.totalBet}</span>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex items-center justify-center gap-1 flex-wrap text-xs">
                        {player.hasFolded ? (
                          <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-full">
                            ❌
                          </span>
                        ) : (
                          <>
                            <span className={cn(
                              "px-1.5 py-0.5 font-semibold rounded-full",
                              player.hasSeen 
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                                : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            )}>
                              {player.hasSeen ? '👁️' : '🙈'}
                            </span>
                            {player.cards.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-full">
                                🃏{player.cards.length}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {!player.isReady && gameStatus === 'waiting' && (
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full"
                    >
                      ⏳
                    </motion.div>
                  )}
                  {isCurrentTurn && gameStatus === 'playing' && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-md"
                    >
                      🎯
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Status Badge */}
            {isEmpty && (
              <div className="text-xs text-muted-foreground text-center">
                Waiting for player...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

