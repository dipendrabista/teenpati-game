'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, History as HistoryIcon } from 'lucide-react';

interface ActionHistoryItem {
  id: string;
  playerId: string;
  playerName: string;
  action: string;
  amount?: number;
  timestamp: number;
}

interface ActionHistoryProps {
  gameState: GameState;
}

export function ActionHistory({ gameState }: ActionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actions, setActions] = useState<ActionHistoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousActionRef = useRef<string>('');

  // Track actions from game state
  useEffect(() => {
    if (!gameState?.lastAction) return;

    const actionKey = `${gameState.lastAction.playerId}-${gameState.lastAction.action}-${Date.now()}`;

    // Avoid duplicates
    if (actionKey === previousActionRef.current) return;
    previousActionRef.current = actionKey;

    const player = gameState.players.find(p => p.id === gameState.lastAction?.playerId);
    if (!player) return;

    const newAction: ActionHistoryItem = {
      id: actionKey,
      playerId: gameState.lastAction.playerId,
      playerName: player.name,
      action: gameState.lastAction.action,
      amount: gameState.lastAction.amount,
      timestamp: Date.now(),
    };

    setActions(prev => [...prev, newAction].slice(-20)); // Keep last 20 actions

    // Auto-scroll to bottom
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, [gameState?.lastAction, gameState?.players]);

  const getActionIcon = (action?: string) => {
    if (!action) return '🎯';
    switch (action) {
      case 'CALL': return '✅';
      case 'RAISE': return '🔥';
      case 'FOLD': return '❌';
      case 'SEE': return '👁️';
      case 'SHOW': return '🎴';
      default: return '🎯';
    }
  };

  const getActionColor = (action?: string) => {
    if (!action) return 'text-gray-600 dark:text-gray-400';
    switch (action) {
      case 'CALL': return 'text-blue-600 dark:text-blue-400';
      case 'RAISE': return 'text-orange-600 dark:text-orange-400';
      case 'FOLD': return 'text-red-600 dark:text-red-400';
      case 'SEE': return 'text-cyan-600 dark:text-cyan-400';
      case 'SHOW': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed top-16 left-2 sm:top-20 sm:left-4 z-40"
    >
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden w-[70vw] sm:w-72 max-w-[90vw]">
        {/* Header */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-2 sm:px-3 py-2 flex items-center justify-between gap-2 hover:bg-primary/5 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-primary" />
            <span className="text-xs sm:text-sm font-bold text-primary">Action History</span>
            {actions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {actions.length}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-primary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-primary" />
          )}
        </motion.button>

        {/* Action List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-primary/10">
                {actions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No actions yet. Start playing!
                  </div>
                ) : (
                  <ScrollArea className="h-[45vh] sm:h-64">
                    <div 
                      ref={scrollRef} 
                      className="p-2 space-y-1 max-h-[45vh] sm:max-h-64 overflow-y-auto"
                    >
                      <AnimatePresence>
                        {actions.map((action, index) => (
                          <motion.div
                            key={action.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            {/* Icon */}
                            <div className="flex-shrink-0 text-lg">
                              {getActionIcon(action.action)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold truncate">
                                  {action.playerName}
                                </span>
                                <span className={`text-xs font-semibold ${getActionColor(action.action)}`}>
                                  {action.action?.toLowerCase() || 'unknown'}
                                </span>
                              </div>
                              {action.amount && (
                                <div className="text-[10px] text-muted-foreground">
                                  🪙 {action.amount.toLocaleString()}
                                </div>
                              )}
                            </div>

                            {/* Time */}
                            <div className="flex-shrink-0 text-[9px] text-muted-foreground font-mono">
                              {formatTime(action.timestamp)}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini preview when collapsed */}
        {!isExpanded && actions.length > 0 && actions[actions.length - 1]?.action && (
          <div className="px-3 py-1.5 border-t border-primary/10">
            <div className="text-xs text-muted-foreground truncate">
              Latest: {getActionIcon(actions[actions.length - 1].action)} {actions[actions.length - 1].playerName} {actions[actions.length - 1].action.toLowerCase()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

