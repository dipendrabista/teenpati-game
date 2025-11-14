'use client';

import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp, Coins } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayerProfileProps {
  name: string;
  avatar?: string;
  chips: number;
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
}

export function PlayerProfile({
  name,
  avatar,
  chips,
  gamesPlayed,
  gamesWon,
  totalWinnings,
}: PlayerProfileProps) {
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2">
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Avatar className="h-20 w-20 ring-4 ring-primary shadow-xl">
            {avatar ? (
              <AvatarImage src={avatar} alt={name} />
            ) : (
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </motion.div>

        {/* Name & Chips */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xl font-bold text-foreground">
              {chips.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">chips</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 text-center"
        >
          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Won</p>
          <p className="text-lg font-bold text-foreground">{gamesWon}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 text-center"
        >
          <Target className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Played</p>
          <p className="text-lg font-bold text-foreground">{gamesPlayed}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 text-center"
        >
          <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="text-lg font-bold text-foreground">{winRate}%</p>
        </motion.div>
      </div>

      {/* Total Winnings */}
      {totalWinnings > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-400 dark:border-green-600"
        >
          <p className="text-xs text-muted-foreground text-center mb-1">Total Winnings</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 text-center">
            💰 {totalWinnings.toLocaleString()} chips
          </p>
        </motion.div>
      )}
    </Card>
  );
}

