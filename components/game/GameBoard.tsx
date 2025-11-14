'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { toast } from 'sonner';
import { GameState, PlayerAction } from '@/types/game';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayingCard } from './Card';
import { CardReveal } from './FlippableCard';
import { playSound } from '@/lib/sounds';
import { Eye, EyeOff, Plus, ArrowRight, X, Trophy, Coins, AlertTriangle } from 'lucide-react';
import { TurnTimer } from './TurnTimer';
import { ChipAnimation } from './ChipAnimation';
import { ActionFeedback, type ActionType } from './ActionFeedback';
import { useI18n } from '@/lib/i18n';
import { trackAction } from '@/lib/analytics';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  onMove: (move: PlayerAction) => void;
  uiDensity?: 'compact' | 'comfortable';
  reduceMotion?: boolean;
  oneThumbSide?: 'left' | 'right';
  hapticIntensity?: 'off' | 'low' | 'med' | 'high';
  onSideShowChallenge?: (targetPlayerId: string) => void;
}

export function GameBoard({ gameState, currentPlayerId, onMove, uiDensity = 'comfortable', reduceMotion = false, oneThumbSide = 'right', hapticIntensity = 'med', onSideShowChallenge }: GameBoardProps) {
  const { t } = useI18n();
  const currentPlayer = gameState.players.find((p) => p.id === currentPlayerId);
  const isMyTurn = gameState.currentTurn === currentPlayerId;
  const [customBet, setCustomBet] = useState<string>('');
  const [showCards, setShowCards] = useState(currentPlayer?.hasSeen || false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(currentPlayer?.hasSeen || false);
  const [previousPot, setPreviousPot] = useState(gameState.pot);
  const [showChipAnimation, setShowChipAnimation] = useState(false);
  const [chipAnimationAmount, setChipAnimationAmount] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showFoldConfirm, setShowFoldConfirm] = useState(false);
  const [showRaiseSheet, setShowRaiseSheet] = useState(false);
  const raiseLongPressRef = useRef<NodeJS.Timeout | null>(null);
  const prevChipsRef = useRef<number | null>(null);
  const [stackDelta, setStackDelta] = useState<number | null>(null);
  const stackDeltaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [raisePresets, setRaisePresets] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [2, 4, 6];
    try {
      const raw = localStorage.getItem('raise_presets');
      const arr = raw ? JSON.parse(raw) : [2, 4, 6];
      return Array.isArray(arr) && arr.length ? arr.map((n:any)=>Math.max(1, Math.min(10, parseInt(n) || 2))) : [2,4,6];
    } catch { return [2,4,6]; }
  });
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [draftPresets, setDraftPresets] = useState<string>('');
  
  // Track last turn notification to prevent duplicates
  const lastTurnNotificationRef = useRef<string>('');
  
  // Action feedback state
  const [actionFeedback, setActionFeedback] = useState<{
    action: ActionType;
    amount?: number;
    show: boolean;
  } | null>(null);

  // Update previous pot when pot changes
  useEffect(() => {
    if (gameState.pot !== previousPot) {
      setPreviousPot(gameState.pot);
    }
  }, [gameState.pot, previousPot]);

  // Responsive: compact cards on small screens
  useEffect(() => {
    const update = () => {
      try {
        const sm = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
        setIsSmallScreen(sm);
        if (sm) {
          try {
            const seen = localStorage.getItem('swipe_hint_seen');
            if (!seen) {
              setShowSwipeHint(true);
              setTimeout(() => setShowSwipeHint(false), 5000);
              localStorage.setItem('swipe_hint_seen', '1');
            }
          } catch {}
        }
      } catch {
        setIsSmallScreen(false);
      }
    };
    update();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
  }, []);

  // Detect chip changes and show transient delta (mobile)
  useEffect(() => {
    if (!currentPlayer) return;
    const prev = prevChipsRef.current;
    if (typeof prev === 'number' && prev !== currentPlayer.chips && gameState.status === 'playing') {
      const delta = currentPlayer.chips - prev;
      setStackDelta(delta);
      if (stackDeltaTimerRef.current) clearTimeout(stackDeltaTimerRef.current);
      stackDeltaTimerRef.current = setTimeout(() => setStackDelta(null), 1200);
    }
    prevChipsRef.current = currentPlayer.chips;
    return () => {
      if (stackDeltaTimerRef.current) {
        clearTimeout(stackDeltaTimerRef.current);
        stackDeltaTimerRef.current = null;
      }
    };
  }, [currentPlayer?.chips, gameState.status]);

  // Save presets helper
  const savePresets = (list: number[]) => {
    const clean = list.filter(n => Number.isFinite(n)).map(n => Math.max(1, Math.min(10, Math.round(n))));
    setRaisePresets(clean);
    try { localStorage.setItem('raise_presets', JSON.stringify(clean)); } catch {}
  };

  if (!currentPlayer) return null;

  const activePlayers = gameState.players.filter(p => p.isActive && !p.hasFolded);
  const canSee = !currentPlayer.hasSeen;
  const canBet = isMyTurn && currentPlayer.isActive && !currentPlayer.hasFolded;
  const canFold = isMyTurn && currentPlayer.isActive && !currentPlayer.hasFolded;
  const canShow = isMyTurn && currentPlayer.hasSeen && activePlayers.length === 2;
  const canBlindShow = isMyTurn 
    && !currentPlayer.hasSeen 
    && activePlayers.length >= 2
    && (gameState.roundNumber >= ((gameState as any).minShowRounds ?? 3))
    && activePlayers.every(p => !p.hasSeen);
  const canSideShow = isMyTurn && currentPlayer.hasSeen && activePlayers.length > 2;

  // Calculate minimum bet based on blind/seen status
  const minBetMultiplier = currentPlayer.hasSeen ? 2 : 1;
  const minCallAmount = gameState.currentBet * minBetMultiplier;
  const minRaiseAmount = gameState.currentBet * 2 * minBetMultiplier;
  const canAffordCall = currentPlayer.chips >= minCallAmount;

  // Haptic patterns per action (where supported)
  const vibratePattern = (type: 'call' | 'raise' | 'fold' | 'see') => {
    try {
      const api: any = navigator;
      if (!api?.vibrate) return;
      if (hapticIntensity === 'off') return;
      const scale = hapticIntensity === 'low' ? 0.6 : hapticIntensity === 'high' ? 1.5 : 1.0;
      switch (type) {
        case 'call':
          api.vibrate([Math.round(15 * scale)]);
          break;
        case 'raise':
          api.vibrate([Math.round(20 * scale), Math.round(30 * scale), Math.round(20 * scale)]);
          break;
        case 'fold':
          api.vibrate([Math.round(50 * scale), Math.round(20 * scale), Math.round(50 * scale)]);
          break;
        case 'see':
          api.vibrate([Math.round(10 * scale), Math.round(10 * scale)]);
          break;
      }
    } catch {}
  };

  // Density sizing
  const btnH = isSmallScreen ? 'h-11' : (uiDensity === 'compact' ? 'h-9' : 'h-10');
  const [keyboardInset, setKeyboardInset] = useState(0);

  // Keyboard-aware bottom inset (mobile virtual keyboard)
  useEffect(() => {
    const vv: any = (window as any).visualViewport;
    if (!vv) return;
    const handler = () => {
      try {
        const inset = Math.max(0, (window.innerHeight - vv.height - (vv.offsetTop || 0)));
        setKeyboardInset(inset);
      } catch {}
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    handler();
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  // Simple swipe gesture handling on action bar
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (!isMyTurn || gameState.status !== 'playing') return;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    const threshold = 50;
    if (absX > absY && absX > threshold) {
      if (dx > 0) {
        // Swipe right -> Call
        try { (navigator as any)?.vibrate?.(10); } catch {}
        handleCall();
      } else {
        // Swipe left -> Fold
        try { (navigator as any)?.vibrate?.(10); } catch {}
        if (isSmallScreen) setShowFoldConfirm(true); else handleFold();
      }
    } else if (absY > absX && -dy > threshold) {
      // Swipe up -> Raise min
      try { (navigator as any)?.vibrate?.(15); } catch {}
      handleRaise(minRaiseAmount);
    }
  };

  // Desktop mouse slide gesture
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const onMouseDownBar = (e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUpBar = (e: React.MouseEvent) => {
    if (!mouseStartRef.current) return;
    const dx = e.clientX - mouseStartRef.current.x;
    const dy = e.clientY - mouseStartRef.current.y;
    mouseStartRef.current = null;
    if (!isMyTurn || gameState.status !== 'playing') return;
    const threshold = 60;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx > 0) {
        vibratePattern('call');
        handleCall();
      } else {
        vibratePattern('fold');
        if (isSmallScreen) setShowFoldConfirm(true); else handleFold();
      }
    } else if (Math.abs(dy) > Math.abs(dx) && -dy > threshold) {
      vibratePattern('raise');
      handleRaise(minRaiseAmount);
    }
  };

  // Double-tap (double-click) fold confirm on desktop
  const lastFoldClickAtRef = useRef<number>(0);
  const onFoldClick = () => {
    if (isSmallScreen) { setShowFoldConfirm(true); return; }
    const now = Date.now();
    const delta = now - lastFoldClickAtRef.current;
    lastFoldClickAtRef.current = now;
    if (delta < 450) {
      handleFold();
    } else {
      // show inline confirm prompt
      setShowFoldConfirm(true);
      setTimeout(() => setShowFoldConfirm(false), 1500);
    }
  };

  const showActionFeedback = (action: ActionType, amount?: number) => {
    setActionFeedback({ action, amount, show: true });
  };

  const vibrate = (ms: number = 20) => {
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
        (navigator as any).vibrate(ms);
      }
    } catch {}
  };

  const handleSeeCards = () => {
    vibratePattern('see');
    if (!hasRevealed) {
      // First time seeing cards - trigger flip animation
      setIsRevealing(true);
      setHasRevealed(true);
      playSound('cardFlip');
      
      // Show cards after a brief delay
      setTimeout(() => {
        setShowCards(true);
        showActionFeedback('SEE');
        toast.success(`👁️ ${t('cards.saw')}`, { duration: 2000 });
      }, 1000);
    } else {
      // Already seen before - just toggle visibility
      setShowCards(true);
      playSound('cardFlip');
      showActionFeedback('SEE');
      toast.success(`👁️ ${t('cards.saw')}`, { duration: 2000 });
    }
    
    onMove({ type: 'SEE', playerId: currentPlayerId });
  };

  const handleCall = () => {
    vibratePattern('call');
    playSound('call');
    showActionFeedback('CALL', minCallAmount);
    toast.info(`✅ ${t('toast.called', { n: minCallAmount })}` , { duration: 2000 });
    
    // Show chip animation
    setChipAnimationAmount(minCallAmount);
    setShowChipAnimation(true);
    
    onMove({ type: 'CALL', playerId: currentPlayerId });
    try { trackAction('CALL', { toCall: minCallAmount }); } catch {}
  };

  const handleRaise = (amount?: number) => {
    vibratePattern('raise');
    const raiseAmount = amount || parseInt(customBet) || minRaiseAmount;
    playSound('raise');
    showActionFeedback('RAISE', raiseAmount);
    toast.warning(`🔥 ${t('toast.raisedTo', { n: raiseAmount })}`, { duration: 2500 });
    
    // Show chip animation
    setChipAnimationAmount(raiseAmount);
    setShowChipAnimation(true);
    
    onMove({ type: 'RAISE', playerId: currentPlayerId, amount: raiseAmount });
    setCustomBet('');
    try { trackAction('RAISE', { amount: raiseAmount }); } catch {}
  };

  const handleFold = () => {
    vibratePattern('fold');
    playSound('fold');
    showActionFeedback('FOLD');
    toast.error(`😓 ${t('toast.folded')}`, { duration: 2000 });
    onMove({ type: 'FOLD', playerId: currentPlayerId });
    try { trackAction('FOLD'); } catch {}
  };

  const handleShow = () => {
    playSound('show');
    showActionFeedback('SHOW');
    toast.info('🎴 Show time! Revealing cards...', { duration: 2500 });
    onMove({ type: 'SHOW', playerId: currentPlayerId });
  };

  // Play sound and show notification when it's your turn (prevent duplicates)
  useEffect(() => {
    if (isMyTurn && gameState.roundNumber > 0) {
      // Create unique key for this turn
      const turnKey = `${gameState.roundNumber}-${currentPlayerId}`;
      
      // Only show if we haven't shown for this exact turn yet
      if (lastTurnNotificationRef.current !== turnKey) {
        lastTurnNotificationRef.current = turnKey;
        playSound('yourTurn');
        toast.success(`🎯 ${t('turn.yourTurn')}`, { 
          duration: 3000,
          position: 'top-center'
        });
      }
    }
  }, [isMyTurn, gameState.roundNumber, currentPlayerId]);

  // Keyboard shortcuts for actions on your turn
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isMyTurn || gameState.status !== 'playing' || !currentPlayer?.isActive || currentPlayer?.hasFolded) return;
      // Ignore when modifier keys are pressed or typing in inputs
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as any;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === 'c') {
        e.preventDefault();
        handleCall();
      } else if (k === 'r') {
        e.preventDefault();
        handleRaise(minRaiseAmount);
      } else if (k === 'f') {
        e.preventDefault();
        handleFold();
      } else if (k === 's') {
        e.preventDefault();
        if (canSee) handleSeeCards();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMyTurn, gameState.status, minRaiseAmount, canSee, currentPlayer?.isActive, currentPlayer?.hasFolded]);

  // ESC closes local overlays
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      let closed = false;
      if (showFoldConfirm) { setShowFoldConfirm(false); closed = true; }
      if (showRaiseSheet) { setShowRaiseSheet(false); closed = true; }
      if (showPresetEditor) { setShowPresetEditor(false); closed = true; }
      if (closed) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFoldConfirm, showRaiseSheet, showPresetEditor]);

  // Hand strength display removed per request

  return (
    <div className="space-y-2 relative">
      {/* Action Feedback Animation */}
      {actionFeedback && (
        <ActionFeedback
          action={actionFeedback.action}
          amount={actionFeedback.amount}
          show={actionFeedback.show}
          onComplete={() => setActionFeedback(null)}
        />
      )}

      {/* Chip Animation */}
      {showChipAnimation && (
        <ChipAnimation
          amount={chipAnimationAmount}
          onComplete={() => setShowChipAnimation(false)}
        />
      )}

      {/* Combined Cards & Actions */}
      <motion.div
        initial={reduceMotion ? (false as any) : { opacity: 0, scale: 0.98 }}
        animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
        transition={
          reduceMotion ? { duration: 0 } : { delay: 0.05, duration: 0.2 }
        }
      >
        <Card className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50 border shadow-xl">
          <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3">
            <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              {/* Left Column: Actions (See, Quick Bets, Primary Buttons) */}
              <div className="order-2 md:order-1">
                {/* Turn timer (only on your turn) */}
                {isMyTurn && gameState.status === "playing" && (
                  <div className="mb-2 flex items-center gap-2">
                    <TurnTimer duration={30} isActive={true} />
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">
                      Your move
                    </span>
                  </div>
                )}

                {/* Swipe hint (mobile only, once) */}
                {isSmallScreen && showSwipeHint && (
                  <div className="mb-2 mx-1 text-[11px] text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-900/60 border rounded-lg p-2 shadow-sm">
                    Swipe: ← Fold, ↑ Raise, → Call
                  </div>
                )}

                {/* Quick Actions Toolbar - One-Click Bet Presets (compact) */}
                {canBet && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-0.5 mt-2"
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                      <span>⚡ {t("quickBets.title")}</span>
                      <button
                        type="button"
                        className="ml-1 text-[10px] px-1.5 py-0.5 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          setDraftPresets(raisePresets.join(","));
                          setShowPresetEditor(true);
                        }}
                        title={t("quickBets.edit")}
                      >
                        {t("quickBets.edit")}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                      {/* Pot Button - Match the pot */}
                      <Button
                        onClick={() =>
                          handleRaise(gameState.pot * minBetMultiplier)
                        }
                        disabled={
                          currentPlayer.chips < gameState.pot * minBetMultiplier
                        }
                        variant="outline"
                        className="h-7 sm:h-8 px-1 border-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold disabled:opacity-30 text-[10px] flex flex-col gap-0 py-0"
                        title="Bet the Pot"
                      >
                        <span className="text-[11px] leading-none">💰</span>
                        <span className="font-black leading-tight">POT</span>
                      </Button>

                      {/* Dynamic presets */}
                      {raisePresets.slice(0, 2).map((mult, idx) => (
                        <Button
                          key={`preset-${idx}`}
                          onClick={() =>
                            handleRaise(
                              gameState.currentBet * mult * minBetMultiplier
                            )
                          }
                          disabled={
                            currentPlayer.chips <
                            gameState.currentBet * mult * minBetMultiplier
                          }
                          variant="outline"
                          className={`h-7 sm:h-8 px-1 border-2 ${
                            idx === 0
                              ? "border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              : "border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          } font-bold disabled:opacity-30 text-[10px] flex flex-col gap-0 py-0`}
                          title={`${mult}x the bet`}
                        >
                          <span className="text-[11px] leading-none">🔥</span>
                          <span className="font-black leading-tight">
                            {mult}X
                          </span>
                        </Button>
                      ))}

                      {/* All-In Button */}
                      <Button
                        onClick={() => handleRaise(currentPlayer.chips)}
                        disabled={currentPlayer.chips <= gameState.currentBet}
                        variant="outline"
                        className="h-7 sm:h-8 px-1 border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold disabled:opacity-30 text-[10px] flex flex-col gap-0 py-0"
                        title="All In - Bet everything!"
                      >
                        <span className="text-[11px] leading-none">💯</span>
                        <span className="font-black leading-tight">ALL</span>
                      </Button>
                    </div>

                    {/* Custom Raise */}
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                        Custom
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          className="h-7 w-7 p-0 text-xs"
                          disabled={!canBet}
                          title="Decrease"
                          onClick={() => {
                            const step = Math.max(
                              1,
                              Math.floor(gameState.minBet * minBetMultiplier)
                            );
                            const cur = parseInt(customBet || "0") || 0;
                            const next = Math.max(0, cur - step);
                            setCustomBet(next.toString());
                          }}
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="h-7 w-24 text-[12px]"
                          placeholder={`${minRaiseAmount}`}
                          value={customBet}
                          onChange={(e) =>
                            setCustomBet(e.target.value.replace(/[^0-9]/g, ""))
                          }
                          disabled={!canBet}
                        />
                        <Button
                          variant="outline"
                          className="h-7 w-7 p-0 text-xs"
                          disabled={!canBet}
                          title="Increase"
                          onClick={() => {
                            const step = Math.max(
                              1,
                              Math.floor(gameState.minBet * minBetMultiplier)
                            );
                            const cur = parseInt(customBet || "0") || 0;
                            const next = cur + step;
                            setCustomBet(next.toString());
                          }}
                        >
                          +
                        </Button>
                        <Button
                          className="h-7 px-2 text-[11px] bg-orange-600 hover:bg-orange-700 text-white font-bold"
                          disabled={
                            !canBet ||
                            !customBet ||
                            Number.isNaN(parseInt(customBet)) ||
                            (parseInt(customBet) || 0) < minRaiseAmount ||
                            (parseInt(customBet) || 0) > currentPlayer.chips
                          }
                          title={`Min ${minRaiseAmount}, Max ${currentPlayer.chips}`}
                          onClick={() => {
                            const amt = parseInt(customBet || "0") || 0;
                            if (amt < minRaiseAmount) {
                              toast.error(
                                t("toast.minRaise", { n: minRaiseAmount })
                              );
                              return;
                            }
                            if (amt > currentPlayer.chips) {
                              // Cap to max chips instead of error; suggest ALL in
                              toast.info(t("toast.maxSet"));
                              setCustomBet(String(currentPlayer.chips));
                              return;
                            }
                            handleRaise(amt);
                          }}
                        >
                          Raise {customBet ? parseInt(customBet) : ""}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          disabled={!canBet}
                          title="Set to maximum"
                          onClick={() =>
                            setCustomBet(String(currentPlayer.chips))
                          }
                        >
                          Max
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Preset editor */}
                {showPresetEditor && (
                  <div className="relative">
                    <div className="absolute z-30 mt-1 w-64 bg-white dark:bg-gray-900 border rounded-lg shadow-2xl p-3">
                      <div className="text-xs font-semibold mb-1">
                        {t("presets.editorTitle")}
                      </div>
                      <div className="text-[11px] mb-2 text-gray-600 dark:text-gray-300">
                        {t("presets.example")}
                      </div>
                      <input
                        value={draftPresets}
                        onChange={(e) => setDraftPresets(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm bg-background"
                        placeholder="2,4,6"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => setShowPresetEditor(false)}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => {
                            const vals = draftPresets
                              .split(",")
                              .map((s) => parseInt(s.trim()))
                              .filter((n) => !Number.isNaN(n));
                            if (vals.length) {
                              savePresets(vals);
                              setShowPresetEditor(false);
                            }
                          }}
                        >
                          {t("common.save")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info row: your stack, to call, pot, bet */}
                <div className="mb-2 grid grid-cols-2 gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                  <div
                    className={`rounded-md border px-2 py-1 bg-white/70 dark:bg-gray-900/50 ${
                      typeof stackDelta === "number" && stackDelta !== 0
                        ? stackDelta > 0
                          ? "ring-2 ring-green-400"
                          : "ring-2 ring-red-400"
                        : ""
                    }`}
                  >
                    <span className="font-semibold">Your stack: </span>
                    <span>{currentPlayer.chips}</span>
                  </div>
                  <div className="rounded-md border px-2 py-1 bg-white/70 dark:bg-gray-900/50 text-right">
                    <span className="font-semibold">{t("ui.toCall")}: </span>
                    <span>{Math.max(minCallAmount, 0)}</span>
                  </div>
                  <div className="rounded-md border px-2 py-1 bg-white/70 dark:bg-gray-900/50">
                    <span className="font-semibold">{t("recap.pot")}: </span>
                    <span>{gameState.pot}</span>
                  </div>
                  <div className="rounded-md border px-2 py-1 bg-white/70 dark:bg-gray-900/50 text-right">
                    <span className="font-semibold">Current bet: </span>
                    <span>{gameState.currentBet}</span>
                  </div>
                </div>

                {/* Pot odds */}
                {minCallAmount > 0 && (
                  <div className="mb-2 text-[11px] text-gray-600 dark:text-gray-400">
                    {(() => {
                      const toCall = Math.max(minCallAmount, 0);
                      const pot = Math.max(gameState.pot, 0);
                      const odds =
                        toCall > 0
                          ? Math.round((toCall / (pot + toCall)) * 100)
                          : 0;
                      return (
                        <span>
                          Pot odds:{" "}
                          <span className="font-semibold">{odds}%</span>
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/* Primary Action Buttons (segmented) */}
                <div
                  className="md:static sticky z-20"
                  style={{
                    bottom: 8,
                    marginBottom: keyboardInset ? keyboardInset + 8 : 8,
                    paddingBottom: "calc(env(safe-area-inset-bottom, 0px))",
                  }}
                >
                  <div
                    className={`flex flex-nowrap items-center ${oneThumbSide === 'right' ? 'justify-end pr-2' : 'justify-start pl-2'}`}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDownBar}
                    onMouseUp={onMouseUpBar}
                  >
                    <div className="relative inline-flex rounded-xl overflow-hidden border bg-white/80 dark:bg-gray-900/60 shadow-sm">
                      {isSmallScreen && typeof stackDelta === "number" && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.2 }}
                          className={`absolute -top-7 ${
                            oneThumbSide === "right" ? "right-0" : "left-0"
                          } px-2 py-0.5 rounded-full text-[11px] font-bold shadow pointer-events-none ${
                            stackDelta >= 0
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {stackDelta >= 0 ? `+${stackDelta}` : `${stackDelta}`}
                        </motion.div>
                      )}
                      {/* Call */}
                      <Button
                        onClick={handleCall}
                        disabled={!canBet || gameState.currentBet <= 0}
                        title={
                          !canBet
                            ? "Wait for your turn"
                            : gameState.currentBet <= 0
                            ? "No bet to call"
                            : !canAffordCall
                            ? `You have ${currentPlayer.chips}. Will go all-in call.`
                            : undefined
                        }
                        className={`flex-1 ${btnH} rounded-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-none disabled:opacity-50 disabled:cursor-not-allowed text-[11px] border-0 focus:outline-none focus:ring-2 focus:ring-blue-300/60`}
                      >
                        <div className="leading-tight">
                          <div>✅ Call {minCallAmount}</div>
                          {minCallAmount > 0 && currentPlayer.chips > 0 && (
                            <div className="text-[10px] opacity-80">
                              {t("ui.left")}{" "}
                              {Math.max(0, currentPlayer.chips - minCallAmount)}
                            </div>
                          )}
                        </div>
                      </Button>

                      {/* Raise (defaults to min raise) */}
                      <Button
                        onClick={() => handleRaise(minRaiseAmount)}
                        onMouseDown={() => {
                          if (!isSmallScreen) return;
                          raiseLongPressRef.current = setTimeout(
                            () => setShowRaiseSheet(true),
                            350
                          );
                        }}
                        onMouseUp={() => {
                          if (raiseLongPressRef.current) {
                            clearTimeout(raiseLongPressRef.current);
                            raiseLongPressRef.current = null;
                          }
                        }}
                        onTouchStart={() => {
                          raiseLongPressRef.current = setTimeout(
                            () => setShowRaiseSheet(true),
                            350
                          );
                        }}
                        onTouchEnd={() => {
                          if (raiseLongPressRef.current) {
                            clearTimeout(raiseLongPressRef.current);
                            raiseLongPressRef.current = null;
                          }
                        }}
                        disabled={
                          !canBet || currentPlayer.chips < minRaiseAmount
                        }
                        title={
                          !canBet
                            ? "Wait for your turn"
                            : `Raise to at least ${minRaiseAmount}`
                        }
                        className={`flex-1 ${btnH} rounded-none bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-none disabled:opacity-50 disabled:cursor-not-allowed text-[11px] border-l border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-300/60`}
                      >
                        <div className="leading-tight">
                          <div>
                            🔺 {t("action.raise")} {minRaiseAmount}
                          </div>
                          {minRaiseAmount > 0 && currentPlayer.chips > 0 && (
                            <div className="text-[10px] opacity-80">
                              {t("ui.left")}{" "}
                              {Math.max(
                                0,
                                currentPlayer.chips - minRaiseAmount
                              )}
                            </div>
                          )}
                        </div>
                      </Button>

                      {/* Fold */}
                      <Button
                        onClick={onFoldClick}
                        disabled={!canFold}
                        title={!canFold ? undefined : undefined}
                        className={`flex-1 ${btnH} rounded-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-none disabled:opacity-50 disabled:cursor-not-allowed text-[11px] border-l border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-red-300/60`}
                      >
                        ❌ {t("action.fold")}
                      </Button>

                    {/* Side Show button moved to cards panel */}
                  </div>

                  {/* Show / Blind Show buttons (below segmented control) */}
                  {(canShow || canBlindShow) && (
                    <div className="mt-2 mx-2">
                      {canShow && (
                        <Button
                          onClick={handleShow}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold shadow-md text-sm"
                          size="lg"
                        >
                          🎴 {t("action.show")}
                        </Button>
                      )}
                      {canBlindShow && (
                        <Button
                          onClick={handleShow}
                          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold shadow-md text-sm"
                          size="lg"
                        >
                          🎲 {t("action.blindShow")}
                        </Button>
                      )}
                    </div>
                  )}
                  </div>

                  {/* Fold confirmation inline panel (mobile) */}
                  {showFoldConfirm && (
                    <div className="mt-2 mx-2 p-2 rounded-lg border bg-white dark:bg-gray-900 shadow flex items-center justify-between">
                      <span className="text-[12px]">{t("ui.confirmFold")}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => {
                            setShowFoldConfirm(false);
                            handleFold();
                          }}
                        >
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => setShowFoldConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Raise bottom sheet (mobile) */}
                  {showRaiseSheet && (
                    <div
                      className="fixed inset-0 z-[90]"
                      onClick={() => setShowRaiseSheet(false)}
                    >
                      <div className="absolute inset-0 bg-black/40" />
                      <div
                        className="absolute bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t rounded-t-xl p-3 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-sm font-semibold mb-2">
                          {t("ui.quickRaise")}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Button
                            className="h-9 text-[12px]"
                            onClick={() => {
                              handleRaise(minRaiseAmount);
                              setShowRaiseSheet(false);
                            }}
                          >
                            {t("action.min")}
                          </Button>
                          {raisePresets.slice(0, 2).map((mult, idx) => (
                            <Button
                              key={`sheet-${idx}`}
                              className="h-9 text-[12px]"
                              onClick={() => {
                                handleRaise(
                                  gameState.currentBet * mult * minBetMultiplier
                                );
                                setShowRaiseSheet(false);
                              }}
                            >
                              {mult}x
                            </Button>
                          ))}
                          <Button
                            className="h-9 text-[12px]"
                            onClick={() => {
                              handleRaise(currentPlayer.chips);
                              setShowRaiseSheet(false);
                            }}
                          >
                            {t("action.allIn")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Cards */}
              <div className="order-1 md:order-2">
                {/* Cards */}
                <div className="flex items-center justify-end gap-2 py-2 sm:gap-3 sm:py-3">
                  {isRevealing && !showCards ? (
                    // Show flip animation on first reveal
                    <CardReveal
                      cards={currentPlayer.cards}
                      isRevealing={true}
                      onRevealComplete={() => {
                        console.log("Cards revealed!");
                      }}
                    />
                  ) : (
                    // Show regular cards after flip or if already seen
                    currentPlayer.cards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={
                          reduceMotion
                            ? (false as any)
                            : { opacity: 0, y: 12, rotateY: 180 }
                        }
                        animate={
                          reduceMotion ? {} : { opacity: 1, y: 0, rotateY: 0 }
                        }
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                delay: index * 0.12,
                                type: "spring",
                                stiffness: 120,
                              }
                        }
                      >
                        <PlayingCard
                          card={card}
                          isHidden={!showCards}
                          onClick={canSee ? handleSeeCards : undefined}
                          size={isSmallScreen ? "sm" : "md"}
                          highlightLucky={showCards}
                        />
                      </motion.div>
                    ))
                  )}
                </div>

                {/* See Cards Button under the cards */}
                {canSee && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-right"
                  >
                    <Button
                      onClick={handleSeeCards}
                      className="gap-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md text-xs h-8 px-4"
                    >
                      👁️ See Cards
                    </Button>
                  </motion.div>
                )}

                {/* Side Show button under the cards (inside cards panel) */}
                {!canSee && canSideShow && onSideShowChallenge && (activePlayers.some(p => p.id !== currentPlayerId && p.hasSeen)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-right"
                  >
                    <Button
                      onClick={() => {
                        const eligible = activePlayers.filter(p => p.id !== currentPlayerId && p.hasSeen);
                        if (eligible.length > 0) onSideShowChallenge(eligible[0].id);
                      }}
                      className="gap-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 shadow-md text-xs h-8 px-4"
                      title="Challenge (Side Show)"
                    >
                      🪄 Side Show
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

