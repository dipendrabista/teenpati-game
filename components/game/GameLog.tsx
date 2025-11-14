'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Eye, ArrowRight, Plus, X, Trophy, User } from 'lucide-react';

interface GameLogEntry {
  id: string;
  type: 'join' | 'ready' | 'see' | 'bet' | 'call' | 'raise' | 'fold' | 'show' | 'win';
  playerName: string;
  amount?: number;
  timestamp: Date;
}

interface GameLogProps {
  entries: GameLogEntry[];
}

const logIcons = {
  join: { icon: User, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', emoji: '👋' },
  ready: { icon: User, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', emoji: '✅' },
  see: { icon: Eye, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', emoji: '👁️' },
  bet: { icon: ArrowRight, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', emoji: '💵' },
  call: { icon: ArrowRight, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', emoji: '✔️' },
  raise: { icon: Plus, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', emoji: '⬆️' },
  fold: { icon: X, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', emoji: '❌' },
  show: { icon: Eye, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', emoji: '🃏' },
  win: { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', emoji: '🏆' },
};

const logMessages = {
  join: (name: string) => `${name} joined the game`,
  ready: (name: string) => `${name} is ready`,
  see: (name: string) => `${name} saw their cards`,
  bet: (name: string, amount?: number) => `${name} bet ${amount || 0} chips`,
  call: (name: string) => `${name} called`,
  raise: (name: string, amount?: number) => `${name} raised to ${amount || 0}`,
  fold: (name: string) => `${name} folded`,
  show: (name: string) => `${name} showed cards`,
  win: (name: string) => `${name} won the pot! 🎉`,
};

export function GameLog({ entries }: GameLogProps) {
  return (
    <Card className="h-full max-h-[400px]">
      <div className="p-4 border-b">
        <h3 className="font-bold text-lg flex items-center gap-2">
          📜 Game Activity
        </h3>
        <p className="text-xs text-muted-foreground">Recent moves and actions</p>
      </div>
      
      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-2">
          <AnimatePresence initial={false}>
            {entries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground text-sm"
              >
                No activity yet. Game is starting...
              </motion.div>
            ) : (
              entries.slice().reverse().map((entry, index) => {
                const config = logIcons[entry.type];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border border-transparent hover:border-current transition-colors`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <span className="text-lg">{config.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground break-words">
                        {logMessages[entry.type](entry.playerName, entry.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
}

