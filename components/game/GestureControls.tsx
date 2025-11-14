'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Check, TrendingUp, X, Eye } from 'lucide-react';

interface GestureControlsProps {
  isYourTurn: boolean;
  onCall: () => void;
  onRaise: (amount?: number) => void;
  onFold: () => void;
  onSee: () => void;
  canCall: boolean;
  canRaise: boolean;
  canFold: boolean;
  canSee: boolean;
  showHints?: boolean;
}

type GestureType = 'double-tap' | 'long-press' | 'swipe-up' | 'swipe-right';

export function GestureControls({
  isYourTurn,
  onCall,
  onRaise,
  onFold,
  onSee,
  canCall,
  canRaise,
  canFold,
  canSee,
  showHints = true,
}: GestureControlsProps) {
  const { t } = useI18n();
  const [lastTap, setLastTap] = useState(0);
  const [gestureHint, setGestureHint] = useState<GestureType | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Single tap/click triggers Call immediately
  const handleTap = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isYourTurn || !canCall) return;
    onCall();
    // Show feedback using existing type
    handleGesture('double-tap');
  };

  // Long press detector
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isYourTurn || !canFold) return;

    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      handleGesture('long-press');
    }, 800); // 800ms hold
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Cancel long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Swipe detection (minimum 50px in 500ms)
    if (deltaTime < 500 && Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY < 0 && canRaise) {
          // Swipe up = Raise
          handleGesture('swipe-up');
        }
      } else {
        // Horizontal swipe
        if (deltaX > 0 && canSee) {
          // Swipe right = See
          handleGesture('swipe-right');
        }
      }
    }

    setTouchStart(null);
  };

  const handleTouchMove = () => {
    // Cancel long press if moved
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle gesture actions
  const handleGesture = (gesture: GestureType) => {
    switch (gesture) {
      case 'double-tap':
        if (canCall) {
          toast.success(`✅ ${t('gesture.called')}`, { description: 'Tap' });
        }
        break;
      case 'long-press':
        if (canFold) {
          onFold();
          toast.error(`❌ ${t('gesture.folded')}`, { description: 'Long-press gesture' });
        }
        break;
      case 'swipe-up':
        if (canRaise) {
          onRaise();
          toast.info(`📈 ${t('gesture.raised')}`, { description: 'Swipe-up gesture' });
        }
        break;
      case 'swipe-right':
        if (canSee) {
          onSee();
          toast.info('👁️ Viewing cards', { description: 'Swipe-right gesture' });
        }
        break;
    }

    // Show visual feedback
    setGestureHint(gesture);
    setTimeout(() => setGestureHint(null), 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (!isYourTurn) return null;

  return (
    <>
      {/* Invisible gesture capture area */}
      <div
        className="fixed inset-0 z-40 touch-none pointer-events-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      />

      {/* Gesture hints */}
      {showHints && (
        <GestureHints
          canCall={canCall}
          canRaise={canRaise}
          canFold={canFold}
          canSee={canSee}
        />
      )}

      {/* Gesture feedback animation */}
      <AnimatePresence>
        {gestureHint && <GestureFeedback type={gestureHint} />}
      </AnimatePresence>
    </>
  );
}

// Gesture hints overlay
function GestureHints({
  canCall,
  canRaise,
  canFold,
  canSee,
}: {
  canCall: boolean;
  canRaise: boolean;
  canFold: boolean;
  canSee: boolean;
}) {
  const [show, setShow] = useState(true);

  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const hints = [];
  if (canCall) hints.push({ icon: Check, text: 'Tap to Call', color: 'text-green-500' });
  if (canFold) hints.push({ icon: X, text: 'Hold to Fold', color: 'text-red-500' });
  if (canRaise) hints.push({ icon: TrendingUp, text: 'Swipe ↑ to Raise', color: 'text-blue-500' });
  if (canSee) hints.push({ icon: Eye, text: 'Swipe → to See', color: 'text-purple-500' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <div className="bg-black/80 backdrop-blur-lg rounded-2xl px-4 py-3 shadow-2xl">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400 text-center mb-1">Quick Gestures</p>
          {hints.map((hint, i) => (
            <div key={i} className="flex items-center gap-2">
              <hint.icon className={`h-3 w-3 ${hint.color}`} />
              <span className="text-xs text-white">{hint.text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShow(false)}
          className="absolute -top-2 -right-2 bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center pointer-events-auto"
        >
          <X className="h-3 w-3 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}

// Visual feedback for gesture
function GestureFeedback({ type }: { type: GestureType }) {
  const config = {
    'double-tap': {
      icon: Check,
      text: 'CALL',
      color: 'text-green-500',
      bg: 'bg-green-500/20',
      border: 'border-green-500',
    },
    'long-press': {
      icon: X,
      text: 'FOLD',
      color: 'text-red-500',
      bg: 'bg-red-500/20',
      border: 'border-red-500',
    },
    'swipe-up': {
      icon: TrendingUp,
      text: 'RAISE',
      color: 'text-blue-500',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
    },
    'swipe-right': {
      icon: Eye,
      text: 'SEE CARDS',
      color: 'text-purple-500',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500',
    },
  };

  const { icon: Icon, text, color, bg, border } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
    >
      <div className={`${bg} ${border} border-2 rounded-3xl p-8 shadow-2xl backdrop-blur-xl`}>
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <Icon className={`h-16 w-16 ${color}`} />
          <p className={`text-2xl font-black ${color}`}>{text}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Keyboard shortcuts component
export function KeyboardShortcuts({
  isYourTurn,
  onCall,
  onRaise,
  onFold,
  onSee,
  canCall,
  canRaise,
  canFold,
  canSee,
}: Omit<GestureControlsProps, 'showHints'>) {
  useEffect(() => {
    if (!isYourTurn) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent if typing in input
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as any;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'c':
          if (canCall) {
            e.preventDefault();
            onCall();
            toast.success('✅ Called!', { description: 'Keyboard: Space/C' });
          }
          break;
        case 'r':
          if (canRaise) {
            e.preventDefault();
            onRaise();
            toast.info('📈 Raised!', { description: 'Keyboard: R' });
          }
          break;
        case 'f':
          if (canFold) {
            e.preventDefault();
            onFold();
            toast.error('❌ Folded', { description: 'Keyboard: F' });
          }
          break;
        case 's':
          if (canSee) {
            e.preventDefault();
            onSee();
            toast.info('👁️ Viewing cards', { description: 'Keyboard: S' });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isYourTurn, onCall, onRaise, onFold, onSee, canCall, canRaise, canFold, canSee]);

  return null; // This component only handles keyboard events
}

