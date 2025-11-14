'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bell, Trophy, AlertCircle, Users, Play } from 'lucide-react';

export interface GlobalNotification {
  id: string;
  type: 'chat' | 'nudge' | 'action' | 'system' | 'winner';
  playerName: string;
  message: string;
  timestamp: number;
  priority?: 'low' | 'normal' | 'high';
}

interface GlobalNotificationFeedProps {
  notifications: GlobalNotification[];
  maxVisible?: number;
  autoHideDuration?: number;
}

export function GlobalNotificationFeed({ 
  notifications, 
  maxVisible = 5,
  autoHideDuration = 5000 
}: GlobalNotificationFeedProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<GlobalNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Keep only the latest notifications
    const latest = notifications.filter(n => !dismissedIds.has(n.id)).slice(-maxVisible);
    setVisibleNotifications(latest);

    // Auto-hide old notifications
    if (latest.length > 0) {
      const oldestNotification = latest[0];
      const age = Date.now() - oldestNotification.timestamp;
      
      if (age < autoHideDuration) {
        const timeoutId = setTimeout(() => {
          setVisibleNotifications(prev => prev.slice(1));
        }, autoHideDuration - age);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [notifications, maxVisible, autoHideDuration, dismissedIds]);

  const getIcon = (type: GlobalNotification['type']) => {
    switch (type) {
      case 'chat':
        return <MessageCircle className="h-4 w-4" />;
      case 'nudge':
        return <Bell className="h-4 w-4 animate-bounce" />;
      case 'action':
        return <AlertCircle className="h-4 w-4" />;
      case 'winner':
        return <Trophy className="h-4 w-4" />;
      case 'system':
        return <Users className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getColor = (type: GlobalNotification['type'], priority?: string, message?: string) => {
    // Treat "Good luck" system notices as success (green) even if high priority
    const msg = (message || '').toLowerCase();
    const isGoodLuck = msg.includes('good luck');
    if (priority === 'high') {
      if (isGoodLuck) return 'border-green-500 bg-green-500/10 text-green-900 dark:text-green-100';
      return 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-100';
    }
    switch (type) {
      case 'chat':
        // Dialog-like styling for chat
        return 'border-gray-100 bg-white text-gray-900';
      case 'nudge':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100';
      case 'action':
        return 'border-green-500 bg-green-500/10 text-green-900 dark:text-green-100';
      case 'winner':
        return 'border-purple-500 bg-purple-500/10 text-purple-900 dark:text-purple-100';
      case 'system':
        // System "Good luck" should be green; others neutral
        if (isGoodLuck) return 'border-green-500 bg-green-500/10 text-green-900 dark:text-green-100';
        return 'border-gray-500 bg-gray-500/10 text-gray-900 dark:text-gray-100';
      default:
        return 'border-gray-400 bg-gray-400/10 text-gray-900 dark:text-gray-100';
    }
  };

  const getInitials = (name: string) => {
    return (name || 'P')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-30 w-80 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ x: 400, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 400, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`
              relative border-2 rounded-xl p-3 shadow-2xl backdrop-blur-sm
              ${getColor(notification.type, notification.priority, notification.message)}
              pointer-events-auto
            `}
          >
            {notification.type === 'chat' ? (
              <div className="flex items-start gap-3">
                {/* Avatar-like initials */}
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {getInitials(notification.playerName)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm truncate">
                      {notification.playerName}
                    </span>
                    <span className="text-[10px] opacity-60 flex-shrink-0">
                      {new Date(notification.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm">
                    {notification.message}
                  </div>
                </div>
                <button
                  aria-label="Dismiss notification"
                  className="ml-1 -mt-1 text-xs px-2 py-1 rounded-md hover:bg-black/5"
                  onClick={() => {
                    setDismissedIds(prev => {
                      const next = new Set(prev);
                      next.add(notification.id);
                      return next;
                    });
                    setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm truncate">
                      {notification.playerName}
                    </span>
                    <span className="text-[10px] opacity-60 flex-shrink-0">
                      {new Date(notification.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm break-words">
                    {notification.message}
                  </p>
                </div>
                <button
                  aria-label="Dismiss notification"
                  className="ml-1 -mt-1 text-xs px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => {
                    setDismissedIds(prev => {
                      const next = new Set(prev);
                      next.add(notification.id);
                      return next;
                    });
                    setVisibleNotifications(prev => prev.filter(n => n.id !== notification.id));
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Priority indicator for high priority */}
            {notification.priority === 'high' && (
              <motion.div
                className={`absolute inset-0 border-2 rounded-xl pointer-events-none ${
                  (notification.message || '').toLowerCase().includes('good luck')
                    ? 'border-green-500'
                    : 'border-red-500'
                }`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

