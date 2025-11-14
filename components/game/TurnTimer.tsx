'use client';

import { useEffect, useState } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TurnTimerProps {
  isMyTurn: boolean;
  turnTimeout: number; // Total timeout in seconds
  turnTimeRemaining: number; // Time remaining in seconds
  warningThreshold?: number; // Show warning when below this many seconds
}

export function TurnTimer({ 
  isMyTurn, 
  turnTimeout = 60, 
  turnTimeRemaining: initialRemaining = 60,
  warningThreshold = 10 
}: TurnTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialRemaining);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    setTimeRemaining(initialRemaining);
  }, [initialRemaining]);

  useEffect(() => {
    if (!isMyTurn) {
      setIsWarning(false);
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        setIsWarning(next <= warningThreshold && next > 0);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, warningThreshold]);

  if (!isMyTurn || timeRemaining <= 0) return null;

  const percentage = (timeRemaining / turnTimeout) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 ${
          isWarning ? 'animate-pulse' : ''
        }`}
      >
        <div className={`px-4 py-2 rounded-xl shadow-lg border-2 flex items-center gap-2 ${
          isWarning 
            ? 'bg-red-50 dark:bg-red-950 border-red-500 text-red-700 dark:text-red-300' 
            : 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-300'
        }`}>
          {isWarning ? (
            <AlertTriangle className="h-5 w-5 animate-bounce" />
          ) : (
            <Timer className="h-5 w-5" />
          )}
          
          <div className="flex flex-col items-start min-w-[60px]">
            <div className="text-xs font-medium opacity-75">
              {isWarning ? 'Hurry!' : 'Your Turn'}
            </div>
            <div className="text-2xl font-bold leading-tight">
              {timeRemaining}s
            </div>
          </div>

          {/* Progress ring */}
          <svg width="40" height="40" className="transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.2"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
        </div>

        {isWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-1 text-xs font-semibold text-red-600 dark:text-red-400"
          >
            You will be auto-folded!
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
