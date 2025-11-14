'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeaderboardEntry } from '@/types/player';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
}

export function Leaderboard({ entries, currentPlayerId }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-red-500 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-foreground';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          Leaderboard
        </h2>
      </div>

      {/* Entries */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No players yet. Be the first to play!</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const isCurrentPlayer = entry.name === currentPlayerId;
            
            return (
              <motion.div
                key={`${entry.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isCurrentPlayer
                    ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border-blue-400 dark:border-blue-600 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getRankBadge(entry.rank)} flex items-center justify-center shadow-md`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-700 shadow-md">
                    {entry.avatar ? (
                      <AvatarImage src={entry.avatar} alt={entry.name} />
                    ) : (
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {entry.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg truncate">
                        {entry.name}
                      </p>
                      {isCurrentPlayer && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {entry.gamesWon}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {entry.winRate}%
                      </span>
                    </div>
                  </div>

                  {/* Winnings */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Winnings</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {entry.totalWinnings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        Rankings based on total winnings and win rate
      </div>
    </Card>
  );
}

