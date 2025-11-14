'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface NudgeButtonProps {
  targetPlayerId: string;
  targetPlayerName: string;
  onNudge: (playerId: string) => void;
  canNudge: boolean;
  waitingTime?: number; // in seconds
  onCooldownEnd?: () => void;
}

export function NudgeButton({
  targetPlayerId,
  targetPlayerName,
  onNudge,
  canNudge,
  waitingTime = 0,
  onCooldownEnd,
}: NudgeButtonProps) {
  const [cooldown, setCooldown] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);

  // Auto-prompt after 30 seconds
  useEffect(() => {
    if (canNudge && waitingTime >= 30) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [canNudge, waitingTime]);

  // Auto-open dock when prompt triggers, auto-close when cannot nudge
  useEffect(() => {
    if (!canNudge) {
      setDockOpen(false);
      return;
    }
    if (showPrompt || waitingTime > 15) {
      setDockOpen(true);
    }
  }, [showPrompt, waitingTime, canNudge]);

  const handleNudge = () => {
    if (cooldown > 0 || !canNudge) return;

    onNudge(targetPlayerId);
    setCooldown(10); // 10 second cooldown
    setShowPrompt(false);

    // No toast for nudge sender; visual feedback is cooldown + prompt state

    // Countdown cooldown
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Notify parent that cooldown ended (button re-enabled)
          try { onCooldownEnd && onCooldownEnd(); } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!canNudge) return null;

  return (
    <>
      {/* Right-side Nudge Dock */}
      <div className="fixed right-0 top-1/3 z-40 pointer-events-auto">
        {/* Slide panel */}
        <AnimatePresence initial={false}>
          {dockOpen && (
            <motion.div
              key="nudge-dock"
              initial={{ x: 260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 260, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="pr-2 sm:pr-4"
            >
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-l-xl shadow-xl p-2 sm:p-3 w-[180px] sm:w-[240px]">
                {/* Waiting indicator */}
                {waitingTime > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground mb-2"
                  >
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>Waiting for {targetPlayerName}... ({waitingTime}s)</span>
                  </motion.div>
                )}

                {/* Auto-prompt after 30s */}
                <AnimatePresence mode="wait">
                  {showPrompt && (
                    <motion.div
                      key="nudge-prompt"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-2 sm:p-3 shadow-lg"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-100">
                            {targetPlayerName} is taking a while...
                          </p>
                          <p className="text-[11px] sm:text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                            Send them a gentle reminder?
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleNudge}
                        disabled={cooldown > 0}
                        size="sm"
                        variant="outline"
                        className="w-full border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900"
              title={cooldown > 0 ? `Wait ${cooldown}s` : 'Nudge Player'}
            >
                        <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {cooldown > 0 ? `Wait ${cooldown}s` : 'Nudge Player'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual nudge button */}
                {!showPrompt && waitingTime > 15 && (
                  <Button
                    onClick={handleNudge}
                    disabled={cooldown > 0}
                    size="sm"
                    variant="outline"
                    className="relative w-full"
          title={cooldown > 0 ? `${cooldown}s` : 'Nudge'}
        >
                    <motion.div
                      animate={waitingTime > 30 ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                    </motion.div>
                    {cooldown > 0 ? `${cooldown}s` : 'Nudge'}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle tab */}
        <button
          type="button"
          aria-label={dockOpen ? 'Hide nudge panel' : 'Show nudge panel'}
          onClick={() => setDockOpen((v) => !v)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-l-md pl-2 pr-1 py-1 shadow-md hover:bg-white dark:hover:bg-gray-900 flex items-center gap-1"
        >
          <Bell className="h-4 w-4 text-orange-500" />
          <span className="hidden sm:inline text-xs font-semibold">Nudge</span>
        </button>
      </div>
    </>
  );
}

// Nudge animation overlay for the nudged player
export function NudgeOverlay({ show, onComplete }: { show: boolean; onComplete: () => void }) {
  useEffect(() => {
    if (show) {
      const timeout = setTimeout(onComplete, 2000);
      return () => clearTimeout(timeout);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-x-0 top-12 sm:top-16 z-50 pointer-events-none flex items-start justify-center"
    >
      {/* Background pulse */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{ duration: 1, repeat: 2 }}
        className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl sm:blur-3xl"
      />

      {/* Center notification */}
      <motion.div
        animate={{
          scale: [0.9, 1.05, 1],
          rotate: [0, -3, 3, -3, 3, 0],
        }}
        transition={{ duration: 0.45, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
        className="bg-white dark:bg-gray-900 border border-orange-500 sm:border-2 rounded-xl shadow-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-xs sm:max-w-sm w-[88%] sm:w-[90%]"
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.25, repeat: 2 }}
          >
            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
          </motion.div>
          <div className="text-center">
            <p className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 leading-tight">
              Hey! It's Your Turn!
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Another player is waiting... ⏰
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 3D Avatar shake animation indicator
export function NudgeShakeIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <motion.div
      animate={{
        x: [0, -5, 5, -5, 5, -3, 3, -2, 2, 0],
        rotate: [0, -2, 2, -2, 2, -1, 1, -1, 1, 0],
      }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Visual shake indicator */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
        <motion.div
          animate={{
            y: [0, -10, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1, repeat: 2 }}
          className="text-xl sm:text-2xl"
        >
          🔔
        </motion.div>
      </div>
    </motion.div>
  );
}

