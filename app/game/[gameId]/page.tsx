'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Trophy, Play, Loader2, Users, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { getGameSocket } from '@/lib/socket';
import { GameState, Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { MobileNav } from '@/components/game/MobileNav';
import { TurnTimer } from '@/components/game/TurnTimer';
import { WinnerCelebration } from '@/components/game/WinnerCelebration';
import { RoundIndicator } from '@/components/game/RoundIndicator';
import { LastAction } from '@/components/game/LastAction';
import { EmojiReaction, ReactionContainer, type Reaction } from '@/components/game/EmojiReaction';

import { ChatBox, type ChatMessage } from '@/components/game/ChatBox';
import { CompactStreak, StreakCelebration } from '@/components/game/StreakTracker';
import { GestureControls, KeyboardShortcuts } from '@/components/game/GestureControls';
import { NudgeButton, NudgeOverlay } from '@/components/game/NudgeButton';
import { GlobalNotificationFeed, type GlobalNotification } from '@/components/game/GlobalNotificationFeed';
import { SideShow, SideShowIndicator } from '@/components/game/SideShow';
import { SpectatorMode, SpectatorBadge } from '@/components/game/SpectatorMode';
import { VoiceChat, VoiceChatIndicator } from '@/components/game/VoiceChat';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { evaluateHand } from '@/lib/teenPatiUtils';
import { playSound, startAmbient, stopAmbient, setVolume, getVolume, setAmbientLevel, getAmbientLevel, setAmbientDuck, setCategoryLevel, getCategoryLevel, applyMixerPreset } from '@/lib/sounds';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { isOptIn as analyticsOptIn, setOptIn as setAnalyticsOptIn, track as trackAnalytics, trackUX } from '@/lib/analytics';
import { APP_TITLE, APP_SHORT_TITLE } from '@/lib/appConfig';

// Dynamic import for 3D component (browser-only)
const RoundTable3D = dynamic(
  () => import('@/components/game/RoundTable3D'),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-[32vh] sm:h-[480px] bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-bold">Loading 3D Casino...</p>
        </div>
      </div>
    )
  }
);

export default function GameRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { data: session } = useSession();
  const playerName = (() => {
    const fromQuery = searchParams.get('name');
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('preferred_player_name');
        if (stored && stored.trim()) return stored.trim();
      }
    } catch {}
    const email = (session as any)?.user?.email as string | undefined;
    if (email && email.includes('@')) return email.split('@')[0];
    return 'Player';
  })();
  const urlSeatParam = (searchParams.get('seat') ? parseInt(searchParams.get('seat') as string) : null);
  const desiredSeatRef = useRef<number | null>(urlSeatParam && urlSeatParam > 0 ? urlSeatParam : null);
  const [locale, setLocale] = useState<'en'|'ne'>(() => {
    if (typeof window === 'undefined') return 'en';
    try { return (localStorage.getItem('locale') as any) || 'en'; } catch { return 'en'; }
  });
  useEffect(() => { try { localStorage.setItem('locale', locale); } catch {} }, [locale]);
  
  // Generate or retrieve existing playerId - prevents duplicate players on refresh
  const playerId = useRef(
    (() => {
      // Try to get existing playerId from localStorage for this game
      if (typeof window !== 'undefined') {
        const storedPlayerId = localStorage.getItem(`playerId_${gameId}`);
        if (storedPlayerId) {
          console.log('🔄 Reusing existing playerId:', storedPlayerId);
          return storedPlayerId;
        }
      }
      // Generate new playerId if none exists
      const newPlayerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆕 Generated new playerId:', newPlayerId);
      return newPlayerId;
    })()
  ).current;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [tableNameInput, setTableNameInput] = useState<string>('');
  const [maxPlayersInput, setMaxPlayersInput] = useState<number>(3);
  const [botCountInput, setBotCountInput] = useState<number>(0);
  const [variantInput, setVariantInput] = useState<string>('classic');
  const [isPrivateInput, setIsPrivateInput] = useState<boolean>(false);
  const [spectatorLimitInput, setSpectatorLimitInput] = useState<number>(20);
  const [minBetInput, setMinBetInput] = useState<number>(10);
  const [minShowRoundsInput, setMinShowRoundsInput] = useState<number>(3);
  const [rulesRajkapoor135Input, setRulesRajkapoor135Input] = useState<boolean>(false);
  const [rulesDoubleSeq235Input, setRulesDoubleSeq235Input] = useState<boolean>(false);
  const [rulesSpecial910QInput, setRulesSpecial910QInput] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameDuration, setGameDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [winStreak, setWinStreak] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showNudgeOverlay, setShowNudgeOverlay] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);
  const [typingUsers, setTypingUsers] = useState<{ playerId: string; playerName: string }[]>([]);
  const typingRef = useRef<Record<string, number>>({});
  const [deliveredIds, setDeliveredIds] = useState<Set<string>>(new Set());
  const [globalNotifications, setGlobalNotifications] = useState<GlobalNotification[]>([]);
  const [pendingChatEdits, setPendingChatEdits] = useState<Record<string, string>>({});
  const [pendingChatDeletes, setPendingChatDeletes] = useState<Set<string>>(new Set());
  const [sideShowChallenge, setSideShowChallenge] = useState<any>(null);
  const [sideShowResults, setSideShowResults] = useState<any>(null);
  const [spectators, setSpectators] = useState<Array<{ id: string; name: string; joinedAt: Date }>>([]);
  const [isGamePrivate, setIsGamePrivate] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [showSpectatorDrawer, setShowSpectatorDrawer] = useState(false);
  const [suppressWinner, setSuppressWinner] = useState(false);
  const [copiedSpectator, setCopiedSpectator] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const lastActionToastAtRef = useRef(0);
  const [uiDensity, setUiDensity] = useState<'compact' | 'comfortable'>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    try { return (localStorage.getItem('ui_density') as any) === 'compact' ? 'compact' : 'comfortable'; } catch { return 'comfortable'; }
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('reduce_motion') === '1'; } catch { return false; }
  });
  const [showSoundPanel, setShowSoundPanel] = useState(false);
  const [sfxVol, setSfxVol] = useState<number>(() => {
    if (typeof window === 'undefined') return 50;
    try { return Math.round((getVolume?.() ?? 0.5) * 100); } catch { return 50; }
  });
  const [ambVol, setAmbVol] = useState<number>(() => {
    if (typeof window === 'undefined') return 15;
    try { return Math.round((getAmbientLevel?.() ?? 0.15) * 100); } catch { return 15; }
  });
  const [oneThumb, setOneThumb] = useState<'left' | 'right'>(() => {
    if (typeof window === 'undefined') return 'right';
    try { return (localStorage.getItem('one_thumb') as any) === 'left' ? 'left' : 'right'; } catch { return 'right'; }
  });
  const gameStartTimeRef = useRef<number | null>(null);
  const previousWinnerRef = useRef<string | null>(null);
  const previousPlayerCount = useRef(0);
  const previousStatus = useRef<string>('');
  const previousRound = useRef(0);
  const lastActionKeyRef = useRef<string>('');
  const lastSideShowAttemptAtRef = useRef<number>(0);
  const lastSideShowUiActionAtRef = useRef<number>(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleFlashInterval = useRef<NodeJS.Timeout | null>(null);
  const originalTitle = useRef<string>(APP_TITLE);
  const turnStartTimeRef = useRef<number | null>(null);
  const gameStartNotifiedRef = useRef<boolean>(false);
  const [catActions, setCatActions] = useState<number>(() => { try { return Math.round((getCategoryLevel?.('actions') ?? 1) * 100); } catch { return 100; } });
  const [catTurn, setCatTurn] = useState<number>(() => { try { return Math.round((getCategoryLevel?.('turn') ?? 1) * 100); } catch { return 100; } });
  const [catChips, setCatChips] = useState<number>(() => { try { return Math.round((getCategoryLevel?.('chips') ?? 1) * 100); } catch { return 100; } });
  const [catUI, setCatUI] = useState<number>(() => { try { return Math.round((getCategoryLevel?.('ui') ?? 1) * 100); } catch { return 100; } });
  const [catCards, setCatCards] = useState<number>(() => { try { return Math.round((getCategoryLevel?.('cards') ?? 1) * 100); } catch { return 100; } });
  const [catFlow, setCatFlow] = useState<number>(() => { try { return Math.round((getCategoryLevel?.('flow') ?? 1) * 100); } catch { return 100; } });
  const [rematchCountdown, setRematchCountdown] = useState<number | null>(null);
  const rematchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return window.matchMedia('(orientation: landscape)').matches; } catch { return false; }
  });
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });
  const [hapticIntensity, setHapticIntensity] = useState<'off'|'low'|'med'|'high'>(() => {
    if (typeof window === 'undefined') return 'med';
    try { return (localStorage.getItem('haptic_intensity') as any) || 'med'; } catch { return 'med'; }
  });
  const [autoReduced, setAutoReduced] = useState<boolean>(false);
  const [reconnectIn, setReconnectIn] = useState<number | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [analyticsOn, setAnalyticsOn] = useState<boolean>(() => analyticsOptIn());
  
  // Get socket instance (singleton) - not in state to prevent re-renders
  const gameSocket = useRef(getGameSocket()).current;

  const { t } = useI18n();

  useEffect(() => {
    // If game is no longer finished, ensure winner banner is not suppressed for next time
    if (gameState?.status !== 'finished') {
      setSuppressWinner(false);
    }
  }, [gameState?.status]);

  useEffect(() => {
    // Save player info to localStorage for stats tracking and reconnection
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('playerId', playerId);
    localStorage.setItem(`playerId_${gameId}`, playerId); // Game-specific playerId for reconnection
    
    // start socket connection
    
    // Connect to game socket
    gameSocket.connect(gameId, playerId, playerName);

    // Set connection timeout (20 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (!gameState) {
        console.error('⏰ Connection timeout - no game state received');
        setError('Connection timeout. Please check if the server is running on port 3003.');
      }
    }, 20000);

    // Listen for game state updates
    gameSocket.on('game_state', (state: GameState) => {
      setGameState(state);
      setConnectionAttempts(0);

      // Update side show state from game state
      setSideShowChallenge(state.sideShowChallenge || null);
      setSideShowResults(state.sideShowResults || null);
      if (typeof (state as any).callActive !== 'undefined') {
        setCallActive(!!(state as any).callActive);
      }

      // Clear timeout once we receive game state
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // If URL requested a specific seat, try to claim it once after join
      try {
        if (desiredSeatRef.current && state?.players?.length) {
          const me = state.players.find(p => p.id === playerId);
          const want = desiredSeatRef.current;
          if (me && me.position !== want) {
            gameSocket.emit('seat_request', { gameId, playerId, position: want });
          }
          desiredSeatRef.current = null;
        }
        // Persist my current seat and try to restore stored seat when waiting
        const meNow = state.players?.find(p => p.id === playerId);
        if (meNow && typeof meNow.position === 'number') {
          try { localStorage.setItem(`seat_${gameId}`, String(meNow.position)); } catch {}
        }
        if (state.status === 'waiting' && state.players?.length) {
          let targetSeat: number | null = null;
          try {
            const s = localStorage.getItem(`seat_${gameId}`);
            targetSeat = s ? parseInt(s) : null;
          } catch {}
          if (targetSeat && meNow && meNow.position !== targetSeat) {
            gameSocket.emit('seat_request', { gameId, playerId, position: targetSeat });
          }
          // Ensure preferred name is applied
          try {
            const pref = localStorage.getItem('preferred_player_name');
            if (pref && meNow && meNow.name !== pref) {
              gameSocket.emit('update_player_name', { gameId, playerId, name: pref.slice(0,24) });
            }
          } catch {}
        }
      } catch (e) {
        // ignore
      }
    });

    // Listen for game messages
    gameSocket.on('game_message', (message: any) => {
      console.log('📨 Game message received:', message);
      try {
        // Ignore game_started here to prevent duplicate toasts (handled on status change)
        if (message?.type === 'game_started') return;
      } catch {}
    });

    // Listen for errors
    gameSocket.on('error', (error: { message: string }) => {
      console.error('❌ Game error:', error.message);
      const raw = (error?.message || '').toLowerCase();
      // Side show-specific: treat as non-blocking toasts, not full-screen error
      if (raw.includes('side show')) {
        if (raw.includes('no pending')) {
          try { toast.info(t('sideshow.noPending')); } catch {}
        } else if (raw.includes('only available')) {
          try { toast.info(t('sideshow.onlyTwoActive')); } catch {}
        } else if (raw.includes('requires at least 3')) {
          try { toast.info(t('sideshow.unavailable')); } catch {}
        } else if (raw.includes('must be seen')) {
          try { toast.info(t('sideshow.unavailable')); } catch {}
        } else if (raw.includes('invalid side show target')) {
          try { toast.info(t('sideshow.invalidTarget')); } catch {}
        } else {
          try { toast.info(t('sideshow.unavailable')); } catch {}
        }
        return; // do not show blocking error panel
      }
      // Generic invalid move/action not allowed close to a side show UI action or while a side show is active should not block UI
      if ((raw.includes('invalid move') || raw.includes('action is not allowed') || raw.includes('action not allowed') || raw.includes('not allowed right now')) &&
           (Date.now() - lastSideShowUiActionAtRef.current < 8000 || (sideShowChallenge != null))) {
         try { toast.info(t('sideshow.unavailable')); } catch {}
         return;
       }
      if (raw.includes('seen player cannot show')) {
        try { toast.info(t('seen.noShowWhileBlind')); } catch {}
        return;
      }
      if (raw.includes('blind show allowed after')) {
        try { toast.info(error.message); } catch {}
        return;
      }

      let friendly = 'Something went wrong.';
      if (raw.includes('not enough chips')) {
        friendly = "You don't have enough chips for that action. Try a smaller bet or Fold.";
      } else if (raw.includes('minimum raise is')) {
        friendly = error.message; // already informative
      } else if (raw.includes('only host can start')) {
        friendly = 'Only the host can start the game.';
      } else if (raw.includes('game is full')) {
        friendly = 'This table is full.';
      } else if (raw.includes('invalid move')) {
        friendly = 'That action is not allowed right now.';
      }
      setError(friendly);
      setConnectionAttempts(prev => prev + 1);
      try { toast.error(friendly); } catch {}
    });

    // Listen for emoji reactions
    gameSocket.on('player_reaction', (data: { playerId: string; emoji: string; playerName: string }) => {
      console.log('😀 Reaction received:', data);
      const newReaction: Reaction = {
        id: `${data.playerId}-${Date.now()}`,
        emoji: data.emoji,
        playerId: data.playerId,
        playerName: data.playerName,
        timestamp: Date.now()
      };
      setReactions(prev => [...prev, newReaction]);
    });

    // Listen for chat messages
    console.log('💬 Setting up chat listener... [v2.0]');
    gameSocket.off('chat_message'); // Clean old listener
    gameSocket.on('chat_message', (data: ChatMessage) => {
      console.log('💬 [v2.0] Received chat message:', data);
      // Avoid duplicate on sender: we already added optimistically
      if (data.playerId === playerId) {
        // Ensure we don't add again if exists
        setChatMessages(prev => (prev.some(m => m.id === data.id) ? prev : [...prev, data]));
        // Mark delivered on echo as fallback (in case ack is delayed)
        setDeliveredIds(prev => new Set(prev).add(data.id));
      } else {
        setChatMessages(prev => {
          const next = [...prev, data];
          // Apply any pending edit
          const edit = pendingChatEdits[data.id];
          if (edit) {
            const idx = next.findIndex(m => m.id === data.id);
            if (idx >= 0) next[idx] = { ...next[idx], message: edit } as any;
            setPendingChatEdits(prevEdits => {
              const copy = { ...prevEdits };
              delete copy[data.id];
              return copy;
            });
          }
          // Apply any pending delete
          if (pendingChatDeletes.has(data.id)) {
            setPendingChatDeletes(prevDel => {
              const copy = new Set(prevDel);
              copy.delete(data.id);
              return copy;
            });
            return next.filter(m => m.id !== data.id);
          }
          return next;
        });
      }
      
      // Also add to global notifications feed
      if (data.playerId !== playerId) {
        setGlobalNotifications(prev => [...prev, {
          id: data.id,
          type: 'chat',
          playerName: data.playerName,
          message: data.message,
          timestamp: data.timestamp,
          priority: 'normal'
        }]);
      }
      
      // Mention alert for me (direct @name only), ignore self-sent
      const myName = gameState?.players.find(p => p.id === playerId)?.name || '';
      const mentionsMe = myName && new RegExp(`@${myName}(?![A-Za-z0-9_])`, 'i').test(data.message);
      const mentionsAll = /@all(?![A-Za-z0-9_])/i.test(data.message);
      if (data.playerId !== playerId && mentionsMe) {
        playSound('notification');
        toast.info(`🔔 ${t('mention.youWereMentioned', { name: data.playerName })}`, { duration: 3000 });
        setGlobalNotifications(prev => [...prev, {
          id: `mention-${Date.now()}`,
          type: 'chat',
          playerName: data.playerName,
          message: `mentioned @${myName}`,
          timestamp: Date.now(),
          priority: 'high'
        }]);
      }
      
      if (data.playerId !== playerId) {
        playSound('notification');
      }
    });

    // Load recent chat on join
    gameSocket.off('chat_recent');
    gameSocket.on('chat_recent', (rows: any[]) => {
      try {
        const history: ChatMessage[] = (rows || []).map((r) => ({
          id: String(r.id),
          playerId: String(r.playerId),
          playerName: String(r.playerName || 'Player'),
          message: String(r.content || ''),
          timestamp: Number(r.createdAt ? r.createdAt * 1000 : Date.now()),
        }));
        // Only prepend if we don't already have messages
        setChatMessages((prev) => (prev.length ? prev : history));
      } catch (e) {
        console.warn('chat_recent parse failed', e);
      }
    });
    // chat listener ready

    // Listen for nudge_ready to dismiss overlay on receiver
    gameSocket.off('nudge_ready');
    gameSocket.on('nudge_ready', (data: { from: string; to: string }) => {
      if (data.to === playerId) {
        setShowNudgeOverlay(false);
      }
    });

    // Expose 3D table callbacks globally for seat join and start (server enforces admin)
    (window as any).__onSeatRequest = (position: number) => {
      try {
        gameSocket.emit('seat_request', { gameId, playerId, position });
      } catch (e) {
        // ignore
      }
    };
    (window as any).__onStartGame = () => {
      try {
        gameSocket.emit('start_game', { gameId, playerId });
      } catch (e) {
        // ignore
      }
    };
    (window as any).__onKickPlayer = (targetId: string) => {
      try {
        gameSocket.emit('kick_player', { gameId, playerId, targetId });
      } catch (e) {
        // ignore
      }
    };

    // Typing indicator listener
    gameSocket.off('player_typing');
    gameSocket.on('player_typing', (data: { playerId: string; playerName: string; isTyping: boolean; timestamp: number }) => {
      if (data.playerId === playerId) return; // ignore self from server echo
      setTypingUsers(prev => {
        const exists = prev.some(u => u.playerId === data.playerId);
        if (data.isTyping) {
          if (!exists) return [...prev, { playerId: data.playerId, playerName: data.playerName }];
          return prev;
        } else {
          return prev.filter(u => u.playerId !== data.playerId);
        }
      });
      // Auto clear typing after 2.5s
      typingRef.current[data.playerId] = Date.now();
      setTimeout(() => {
        const last = typingRef.current[data.playerId];
        if (last && Date.now() - last >= 2400) {
          setTypingUsers(prev => prev.filter(u => u.playerId !== data.playerId));
        }
      }, 2500);
    });

    // Delivery ack listener
    gameSocket.off('chat_delivered');
    gameSocket.on('chat_delivered', (data: { id: string }) => {
      setDeliveredIds(prev => new Set(prev).add(data.id));
    });

    // Group voice call announcements
    gameSocket.off('voice_call_started');
    gameSocket.on('voice_call_started', (payload: { initiatorId: string; initiatorName: string }) => {
      setCallActive(true);
      try { setAmbientDuck?.(true); } catch {}
      // Subtle ring/notification for receivers
      if (payload.initiatorId !== playerId) {
        try { playSound('call'); } catch {}
        setGlobalNotifications(prev => [
          ...prev,
          {
            id: `call-${Date.now()}`,
            type: 'system',
            playerName: payload.initiatorName || 'Player',
            message: 'started a group call — open chat to join',
            timestamp: Date.now(),
            priority: 'high'
          }
        ]);
      }
    });
    gameSocket.off('voice_call_ended');
    gameSocket.on('voice_call_ended', (_payload: { initiatorId: string }) => {
      setCallActive(false);
      setShowVoiceChat(false);
      try { setAmbientDuck?.(false); } catch {}
      setGlobalNotifications(prev => [
        ...prev,
        {
          id: `call-end-${Date.now()}`,
          type: 'system',
          playerName: 'System',
          message: 'group call ended',
          timestamp: Date.now(),
          priority: 'normal'
        }
      ]);
    });

    // Chat edit/delete listeners
    gameSocket.off('chat_edited');
    gameSocket.on('chat_edited', (data: { id: string; message: string; playerId: string }) => {
      // chat edited
      setChatMessages(prev => {
        const idx = prev.findIndex(m => m.id === data.id);
        if (idx === -1) {
          // Defer until the message arrives
          setPendingChatEdits(prevEdits => ({ ...prevEdits, [data.id]: data.message }));
          return prev;
        }
        const copy = [...prev];
        copy[idx] = { ...copy[idx], message: data.message } as any;
        return copy;
      });
      if (data.playerId !== playerId) {
        setGlobalNotifications(prev => [...prev, {
          id: `edited-${data.id}`,
          type: 'chat',
          playerName: gameState?.players.find(p => p.id === data.playerId)?.name || 'Player',
          message: 'edited a message',
          timestamp: Date.now(),
          priority: 'low'
        }]);
        playSound('notification');
      }
    });
    gameSocket.off('chat_deleted');
    gameSocket.on('chat_deleted', (data: { id: string; playerId: string }) => {
      // chat deleted
      setChatMessages(prev => {
        const exists = prev.some(m => m.id === data.id);
        if (!exists) {
          // Defer until the message arrives, then remove immediately
          setPendingChatDeletes(prevDel => new Set(prevDel).add(data.id));
          return prev;
        }
        return prev.filter(m => m.id !== data.id);
      });
      if (data.playerId !== playerId) {
        setGlobalNotifications(prev => [...prev, {
          id: `deleted-${data.id}`,
          type: 'chat',
          playerName: gameState?.players.find(p => p.id === data.playerId)?.name || 'Player',
          message: 'deleted a message',
          timestamp: Date.now(),
          priority: 'low'
        }]);
        playSound('notification');
      }
    });

    // Check connection status
    const checkConnection = setInterval(() => {
      const connected = gameSocket.isConnected;
      setIsConnected(connected);
      
      if (!connected) {
        // disconnected
      }
    }, 1000);

    return () => {
      // cleanup
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      clearInterval(checkConnection);
      // Remove listeners but keep socket connected for smooth reconnection
      gameSocket.off('game_state');
      gameSocket.off('game_message');
      gameSocket.off('error');
      gameSocket.off('player_reaction');
      gameSocket.off('chat_message');
      gameSocket.off('nudge_ready');
      gameSocket.off('player_typing');
      gameSocket.off('chat_delivered');
      gameSocket.off('chat_edited');
      gameSocket.off('chat_deleted');
    };
  }, [gameId, playerId, playerName]); // Removed gameSocket from dependencies

  // Monitor player joins and game status changes
  useEffect(() => {
    if (!gameState) return;

    // Check if player joined
    if (gameState.players.length > previousPlayerCount.current && previousPlayerCount.current > 0) {
      const newPlayer = gameState.players[gameState.players.length - 1];
      if (newPlayer.id !== playerId) {
        playSound('playerJoin');
        toast.info(`👋 ${t('join.playerJoined', { name: newPlayer.name })}`, { duration: 3000 });
        
        // Add to global notifications
        setGlobalNotifications(prev => [...prev, {
          id: `join-${Date.now()}`,
          type: 'system',
          playerName: 'System',
          message: `👋 ${newPlayer.name} joined the game!`,
          timestamp: Date.now(),
          priority: 'normal'
        }]);
      }
    }
    previousPlayerCount.current = gameState.players.length;

    // Check if game started
    if (gameState.status === 'playing' && previousStatus.current === 'waiting' && !gameStartNotifiedRef.current) {
      playSound('gameStart');
      toast.success(`🎮 ${t('game.startedGoodLuck')}`, { duration: 3000 });
      gameStartNotifiedRef.current = true;
      
      // Play deal cards sound after a short delay
      setTimeout(() => {
        playSound('dealCards');
      }, 500);
    }
    
    // Check if game finished
    if (gameState.status === 'finished' && previousStatus.current === 'playing') {
      const winner = gameState.winner;
      if (winner) {
        const winnerPlayer = gameState.players.find(p => p.id === winner);
        const winnerName = winnerPlayer?.name || 'Someone';
        
        if (winner === playerId) {
          playSound('win');
          toast.success(`🏆 ${t('youWon', { n: gameState.pot })}`, { 
            duration: 5000,
            description: 'Congratulations! 🎉'
          });
        } else {
          playSound('lose');
          toast.error(t('playerWon', { name: winnerName }), { 
            duration: 3000,
            description: 'Better luck next time!'
          });
        }
        
        // Add to global notifications (visible to ALL players)
        setGlobalNotifications(prev => [...prev, {
          id: `winner-${Date.now()}`,
          type: 'winner',
          playerName: winnerName,
          message: `🏆 Won ${gameState.pot} chips!`,
          timestamp: Date.now(),
          priority: 'high'
        }]);
      }
    }
    previousStatus.current = gameState.status;

    // Check if all players are ready
    const allReady = gameState.players.length >= 2 && gameState.players.every(p => p.isReady);
    if (allReady && gameState.status === 'waiting') {
      playSound('allReady');
      toast.success(`✅ ${t('allPlayersReady')}`, { duration: 2000 });
    }

    // Check if round changed
    if (gameState.roundNumber > previousRound.current && previousRound.current > 0) {
      playSound('roundStart');
      toast.info(`🔄 ${t('roundStarted', { n: gameState.roundNumber })}`, { duration: 2000 });
    }
    previousRound.current = gameState.roundNumber;
    // Reset start notification flag if we return to waiting (new game)
    if (gameState.status === 'waiting') {
      gameStartNotifiedRef.current = false;
      // Clear any rematch countdown
      if (rematchTimerRef.current) { clearInterval(rematchTimerRef.current); rematchTimerRef.current = null; }
      setRematchCountdown(null);
    }
    
    // Monitor other players' actions via lastAction
    if (gameState.lastAction && gameState.lastAction.playerId !== playerId) {
      // If game is finished, suppress non-show toasts to avoid "called" after winner
      if (gameState.status === 'finished' && gameState.lastAction.action !== 'show') {
        return;
      }
      // Deduplicate same action notifications (socket can emit repeated game_state)
      const la = gameState.lastAction as any;
      const actionKey = `${gameState.roundNumber}:${la.playerId}:${la.action}:${la.amount ?? ''}`;
      if (lastActionKeyRef.current === actionKey) {
        return;
      }
      lastActionKeyRef.current = actionKey;
      const actingPlayer = gameState.players.find(p => p.id === gameState.lastAction?.playerId);
      const playerName = actingPlayer?.name || 'Someone';
      let actionMessage = '';
      let actionPriority: 'low' | 'normal' | 'high' = 'normal';
      
      switch (gameState.lastAction.action) {
        case 'call':
          {
            const amount = (gameState.lastAction as any).amount;
            const now = Date.now();
            const canToast = now - lastActionToastAtRef.current > 800;
            if (canToast) {
              toast.info(`${playerName} called ${amount} chips`, { duration: 2000 });
              lastActionToastAtRef.current = now;
            }
            actionMessage = `Called ${amount} chips`;
          }
          break;
        case 'raise':
          {
            const now = Date.now();
            const canToast = now - lastActionToastAtRef.current > 800;
            if (canToast) {
              toast.warning(`${playerName} raised to ${gameState.lastAction.amount ?? 0}!`, { 
                duration: 2500,
                description: '🔥 Things are heating up!'
              });
              lastActionToastAtRef.current = now;
            }
          }
          actionMessage = `🔥 ${t('toast.raisedTo', { n: gameState.lastAction.amount ?? 0 })}`;
          actionPriority = 'high';
          break;
        case 'fold':
          {
            const now = Date.now();
            const canToast = now - lastActionToastAtRef.current > 800;
            if (canToast) {
              toast(`${playerName} folded`, { duration: 2000 });
              lastActionToastAtRef.current = now;
            }
          }
          actionMessage = 'Folded';
          break;
        case 'bet':
          {
            const now = Date.now();
            const canToast = now - lastActionToastAtRef.current > 800;
            if (canToast) {
              toast.info(`${playerName} bet ${gameState.lastAction.amount}`, { duration: 2000 });
              lastActionToastAtRef.current = now;
            }
          }
          actionMessage = `Bet ${gameState.lastAction.amount}`;
          break;
        case 'show':
          {
            const now = Date.now();
            const canToast = now - lastActionToastAtRef.current > 800;
            if (canToast) {
              toast.info(t('showingCards', { name: playerName }), { 
                duration: 2500,
                description: '🎴 Showdown time!'
              });
              lastActionToastAtRef.current = now;
            }
          }
          actionMessage = '🎴 Showing cards!';
          actionPriority = 'high';
          break;
      }
      
      // Add to global notifications if action message exists
      if (actionMessage) {
        try {
          setLiveMessage(`${playerName} ${actionMessage}`);
        } catch {}
        setGlobalNotifications(prev => [...prev, {
          id: `action-${Date.now()}`,
          type: 'action',
          playerName: playerName,
          message: actionMessage,
          timestamp: Date.now(),
          priority: actionPriority
        }]);
      }
    }
  }, [gameState, playerId]);

  // Browser Tab Notifications - Flash title when it's your turn and tab is hidden
  useEffect(() => {
    if (!gameState) return;

    const isMyTurn = gameState.currentTurn === playerId;

    // Function to flash title
    const startTitleFlash = () => {
      if (titleFlashInterval.current) return; // Already flashing

      let isOriginal = true;
      titleFlashInterval.current = setInterval(() => {
        document.title = isOriginal 
          ? `🎴 YOUR TURN! - ${APP_SHORT_TITLE}`
          : originalTitle.current;
        isOriginal = !isOriginal;
      }, 1000);
    };

    // Function to stop flashing and restore title
    const stopTitleFlash = () => {
      if (titleFlashInterval.current) {
        clearInterval(titleFlashInterval.current);
        titleFlashInterval.current = null;
        document.title = originalTitle.current;
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && isMyTurn && gameState.status === 'playing') {
        startTitleFlash();
        
        // Browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('🎴 Your Turn!', {
            body: `It's your turn in the game! Make your move.`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'your-turn',
            requireInteraction: false
          });
        }
      } else {
        stopTitleFlash();
      }
    };

    // Request notification permission on first load
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // User denied, that's okay
      });
    }

    // Start flashing if tab is already hidden and it's your turn
    if (document.hidden && isMyTurn && gameState.status === 'playing') {
      startTitleFlash();
    } else {
      stopTitleFlash();
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update title based on game state when visible
    if (!document.hidden) {
      if (gameState.status === 'waiting') {
        document.title = `Waiting for players... - ${APP_SHORT_TITLE}`;
      } else if (gameState.status === 'playing') {
        if (isMyTurn) {
          document.title = `🎯 Your Turn - ${APP_SHORT_TITLE}`;
        } else {
          const currentPlayerName = gameState.players.find(p => p.id === gameState.currentTurn)?.name;
          document.title = `${currentPlayerName || 'Opponent'}'s turn - ${APP_SHORT_TITLE}`;
        }
      } else if (gameState.status === 'finished') {
        const winner = gameState.players.find(p => p.id === gameState.winner);
        if (winner?.id === playerId) {
          document.title = `🏆 You Won! - ${APP_SHORT_TITLE}`;
        } else {
          document.title = `Game Over - ${APP_SHORT_TITLE}`;
        }
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopTitleFlash();
    };
  }, [gameState, playerId]);

  // Track game duration
  useEffect(() => {
    if (!gameState) return;

    // Start timer when game starts
    if (gameState.status === 'playing' && !gameStartTimeRef.current) {
      gameStartTimeRef.current = Date.now();
    }

    // Reset timer when game ends
    if (gameState.status === 'finished') {
      gameStartTimeRef.current = null;
      setGameDuration(0);
    }

    // Update duration every second when playing
    if (gameState.status === 'playing' && gameStartTimeRef.current) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameStartTimeRef.current!) / 1000);
        setGameDuration(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Manage ambient sound based on game status
  useEffect(() => {
    if (!gameState) return;

    if (gameState.status === 'playing') {
      // Start ambient sound when game is playing
      startAmbient();
    } else {
      // Stop ambient when game is not playing
      stopAmbient();
    }

    // Cleanup on unmount
    return () => {
      stopAmbient();
    };
  }, [gameState?.status]);

  // Track win streaks
  useEffect(() => {
    if (!gameState || gameState.status !== 'finished') return;

    // Find the winner
    const winner = gameState.players.find(p => p.id === gameState.winner);
    if (!winner) return;

    // Check if current player won
    if (winner.id === playerId) {
      // Player won - increment streak
      if (previousWinnerRef.current === playerId) {
        // Consecutive win
        setWinStreak(prev => {
          const newStreak = prev + 1;
          // Show celebration for milestone streaks
          if (newStreak >= 2) {
            setShowStreakCelebration(true);
          }
          return newStreak;
        });
      } else {
        // First win or broke someone else's streak
        setWinStreak(1);
      }
      previousWinnerRef.current = playerId;
    } else {
      // Someone else won - reset player's streak
      if (previousWinnerRef.current === playerId) {
        toast.info(`💔 ${t('streak.broken')}`, { duration: 2000 });
      }
      setWinStreak(0);
      previousWinnerRef.current = winner.id;
    }
  }, [gameState?.status, gameState?.winner, playerId]);

  // Track waiting time for nudge feature
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') {
      setWaitingTime(0);
      turnStartTimeRef.current = null;
      return;
    }

    // If it's not current player's turn, track waiting time
    if (gameState.currentTurn !== playerId) {
      if (!turnStartTimeRef.current) {
        turnStartTimeRef.current = Date.now();
      }

      const interval = setInterval(() => {
        if (turnStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - turnStartTimeRef.current) / 1000);
          setWaitingTime(elapsed);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset when it becomes current player's turn
      setWaitingTime(0);
      turnStartTimeRef.current = null;
    }
  }, [gameState?.currentTurn, gameState?.status, playerId]);

  // Listen for nudge events - with immediate setup
  useEffect(() => {
    console.log('🔧 Setting up nudge listener... [v2.0]');
    
    const handleNudge = (data: { from: string; fromName: string; to: string }) => {
      console.log('🔔 Nudge event received:', {
        from: data.from,
        fromName: data.fromName,
        to: data.to,
        myPlayerId: playerId,
        match: data.to === playerId
      });
      
      // Only show overlay if this nudge is meant for me
      if (data.to === playerId) {
        console.log('✅ Nudge is for me! Showing overlay...');
        setShowNudgeOverlay(true);
        playSound('notification');
      } else {
        console.log('ℹ️ Nudge was for someone else. No global notification.');
      }
    };

    // Clean up old listeners and add new one
    gameSocket.off('player_nudged');
    gameSocket.on('player_nudged', handleNudge);
    console.log('✅ Nudge listener registered [v2.0] for player:', playerId);
    console.log('   Connected:', gameSocket.isConnected);

    return () => {
      gameSocket.off('player_nudged', handleNudge);
    };
  }, [gameSocket, playerId]);

  const handleReady = () => {
    gameSocket.playerReady(gameId, playerId);
  };

  const handleCopyGameId = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReaction = (emoji: string) => {
    if (!gameSocket || !gameState) return;
    
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer) return;

    // Emit reaction to server
    gameSocket.emit('send_reaction', {
      gameId,
      playerId,
      playerName: currentPlayer.name,
      emoji
    });

    // Also show locally immediately
    const newReaction: Reaction = {
      id: `${playerId}-${Date.now()}`,
      emoji,
      playerId,
      playerName: currentPlayer.name,
      timestamp: Date.now()
    };
    setReactions(prev => [...prev, newReaction]);
    
    // Play sound
    playSound('notification');
  };

  const handleRemoveReaction = (reactionId: string) => {
    setReactions(prev => prev.filter(r => r.id !== reactionId));
  };

  const handleSendChatMessage = (message: string) => {
    if (!gameSocket || !gameState) return;
    
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer) return;

    const chatMessage: ChatMessage = {
      id: `${playerId}-${Date.now()}`,
      playerId,
      playerName: currentPlayer.name,
      message,
      timestamp: Date.now(),
    };

    // Emit to server
    gameSocket.emit('send_chat', {
      gameId,
      message: chatMessage
    });

    // Add locally for immediate feedback
    setChatMessages(prev => [...prev, chatMessage]);
    // Optimistic sending status (will flip to delivered on ack)
  };

  const handleEditChatMessage = (id: string, newMessage: string) => {
    // Optimistic update
    setChatMessages(prev => prev.map(m => (m.id === id ? { ...m, message: newMessage, timestamp: Date.now() } : m)));
    gameSocket.emit('edit_chat', { gameId, id, playerId, message: newMessage });
  };

  const handleDeleteChatMessage = (id: string) => {
    // Optimistic remove
    setChatMessages(prev => prev.filter(m => m.id !== id));
    gameSocket.emit('delete_chat', { gameId, id, playerId });
  };

  const handleSideShowChallenge = (targetPlayerId: string) => {
    if (!gameSocket || !gameState) return;
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer) return;
    try {
      const now = Date.now();
      lastSideShowAttemptAtRef.current = now;
      lastSideShowUiActionAtRef.current = now;
      gameSocket.emit('player_move', {
        gameId,
        playerId,
        move: { type: 'SIDE_SHOW', targetPlayerId }
      });
    } catch (e) {
      console.warn('side show failed', e);
    }
  };

  const handleAcceptSideShow = () => {
    if (!gameSocket || !gameState) return;
    try {
      lastSideShowUiActionAtRef.current = Date.now();
      gameSocket.emit('player_move', {
        gameId,
        playerId,
        move: { type: 'ACCEPT_SIDE_SHOW' }
      });
    } catch (e) {
      console.warn('side show accept failed', e);
    }
  };

  const handleDeclineSideShow = () => {
    if (!gameSocket || !gameState) return;
    try {
      lastSideShowUiActionAtRef.current = Date.now();
      gameSocket.emit('player_move', {
        gameId,
        playerId,
        move: { type: 'DECLINE_SIDE_SHOW' }
      });
    } catch (e) {
      console.warn('side show decline failed', e);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!gameSocket || !gameState) return;
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer) return;
    gameSocket.emit('typing', {
      gameId,
      playerId,
      playerName: currentPlayer.name,
      isTyping,
    });
  };

  const handleNudge = (targetPlayerId: string) => {
    if (!gameState) return;
    
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer) return;

    console.log('👋 Sending nudge:', {
      gameId,
      from: playerId,
      fromName: currentPlayer.name,
      to: targetPlayerId,
    });

    // Emit nudge to server
    gameSocket.emit('nudge_player', {
      gameId,
      from: playerId,
      fromName: currentPlayer.name,
      to: targetPlayerId,
    });
    
    console.log('✅ Nudge sent to server');
  };

  const handleGestureAction = (action: 'call' | 'raise' | 'fold' | 'see') => {
    if (!gameState || gameState.currentTurn !== playerId) return;

    switch (action) {
      case 'call':
        gameSocket.makeMove(gameId, playerId, { type: 'CALL' });
        break;
      case 'raise':
        // Default raise by current bet
        gameSocket.makeMove(gameId, playerId, { 
          type: 'RAISE', 
          amount: (gameState.currentBet || 0) * 2 
        });
        break;
      case 'fold':
        gameSocket.makeMove(gameId, playerId, { type: 'FOLD' });
        break;
      case 'see':
        gameSocket.makeMove(gameId, playerId, { type: 'SEE' });
        break;
    }
  };

  const currentPlayer = gameState?.players.find((p) => p.id === playerId);
  const isAdmin = !!gameState && (
    ((gameState.hostId ? gameState.hostId === playerId : (gameState.players?.[0]?.id === playerId))) ||
    (gameState.admins || []).includes(playerId)
  );

  useEffect(() => {
    if (gameState) {
      setTableNameInput(gameState.tableName || '');
      setMaxPlayersInput(gameState.maxPlayers || 3);
      setBotCountInput((gameState as any).botCount || 0);
      setVariantInput((gameState as any).variant || 'classic');
      setIsPrivateInput(!!(gameState as any).isPrivate);
      setSpectatorLimitInput((gameState as any).spectatorLimit || 20);
      setMinBetInput(gameState.minBet || 10);
      setMinShowRoundsInput(((gameState as any).minShowRounds) ?? 3);
      const rkp = !!(gameState as any).rulesRajkapoor135;
      const ds = !!(gameState as any).rulesDoubleSeq235;
      const sp = !!(gameState as any).rulesSpecial910Q;
      setRulesRajkapoor135Input(rkp);
      setRulesDoubleSeq235Input(rkp ? true : ds);
      setRulesSpecial910QInput(sp);
    }
  }, [gameState?.tableName, gameState?.maxPlayers, (gameState as any)?.botCount, (gameState as any)?.variant, (gameState as any)?.isPrivate, (gameState as any)?.spectatorLimit, gameState?.minBet, (gameState as any)?.minShowRounds, (gameState as any)?.rulesRajkapoor135, (gameState as any)?.rulesDoubleSeq235, (gameState as any)?.rulesSpecial910Q]);
  const allPlayersReady = (gameState?.players?.length || 0) >= 2 && gameState?.players.every((p) => p.isReady);
  const canStart = allPlayersReady && gameState?.status === 'waiting';

  // Detect unsaved changes for Settings and Spectator drawers
  const settingsChanged = !!gameState && (
    (tableNameInput || '') !== (gameState.tableName || '') ||
    (maxPlayersInput || 0) !== (gameState.maxPlayers || 3) ||
    (botCountInput || 0) !== ((gameState as any)?.botCount || 0) ||
    (variantInput || 'classic') !== ((gameState as any)?.variant || 'classic') ||
    !!isPrivateInput !== !!((gameState as any)?.isPrivate) ||
    (spectatorLimitInput || 0) !== ((gameState as any)?.spectatorLimit || 20) ||
    (minBetInput || 0) !== (gameState.minBet || 10) ||
    (minShowRoundsInput ?? 3) !== (((gameState as any)?.minShowRounds) ?? 3) ||
    !!rulesRajkapoor135Input !== !!((gameState as any)?.rulesRajkapoor135) ||
    (!!rulesDoubleSeq235Input !== (!!(gameState as any)?.rulesDoubleSeq235 || !!(gameState as any)?.rulesRajkapoor135)) || // enforce linkage
    !!rulesSpecial910QInput !== !!((gameState as any)?.rulesSpecial910Q)
  );

  const spectatorChanged = !!gameState && (
    !!isGamePrivate !== !!((gameState as any)?.isPrivate) ||
    (spectatorLimitInput || 0) !== ((gameState as any)?.spectatorLimit || 20)
  );

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Action unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Please adjust your action and try again.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>If low on chips, try a smaller bet or Fold.</li>
                <li>For Raise, meet the minimum or use quick bets.</li>
                <li>Only the host can start the game.</li>
              </ul>
            </div>
          </CardContent>
          <div className="flex justify-end px-6 pb-6">
            <Button onClick={() => setError(null)} variant="outline">
              Back to game
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  const meNow = gameState.players.find(p => p.id === playerId);
  const isEliminated = !meNow || meNow.hasFolded || meNow.isActive === false;

  const handleLeaveGame = () => {
    console.log('👋 Leaving game...');
    gameSocket.leaveGame(gameId, playerId);
    // Clear game-specific playerId so user gets new ID if they rejoin
    localStorage.removeItem(`playerId_${gameId}`);
    router.push('/');
  };

  const handleCopyInvite = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/game/${encodeURIComponent(gameId)}?name=Guest`;
      await navigator.clipboard.writeText(url);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1200);
    } catch (e) {
      // silently ignore
    }
  };

  

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-1 md:p-2">
      {/* Accessibility live region for action updates */}
      <div aria-live="polite" className="sr-only" role="status">
        {liveMessage}
      </div>
      {/* Mobile Navigation */}
      <MobileNav gameId={gameId} onLeaveGame={handleLeaveGame} />
      
      {/* Last Action Indicator */}
      
      <div className="max-w-6xl mx-auto space-y-1 md:space-y-2">
        {/* Header */}
        <Card className="shadow-xl border-2 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base md:text-lg font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        Teen Pati Game
                      </CardTitle>
                      {gameState?.status === 'playing' && (
                        <RoundIndicator roundNumber={gameState.roundNumber} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Non-host Ready (header fallback) */}
            {gameState?.status === 'waiting' && (() => {
              const hostId = (gameState as any)?.hostId;
              const isHostLocal = hostId ? hostId === playerId : (gameState.players?.[0]?.id === playerId);
              if (isHostLocal) return null;
              const me = gameState.players?.find(p => p.id === playerId);
              const iAmReady = !!me?.isReady;
              return (
                <Button
                  size="sm"
                  variant={iAmReady ? 'outline' : 'default'}
                  className={`h-7 text-xs px-2 ${iAmReady ? '' : 'bg-blue-600 hover:bg-blue-700'}`}
                  title={iAmReady ? 'You are ready' : 'Mark yourself ready'}
                  disabled={iAmReady}
                  onClick={() => {
                    try { handleReady(); } catch {}
                  }}
                >
                  {iAmReady ? 'Ready ✓' : 'Ready'}
                </Button>
              );
            })()}
                {/* Copy Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyGameId}
                  className="h-7 gap-1.5 text-xs px-2 shadow-md hover:shadow-lg transition-all"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline font-semibold">{copied ? 'Copied!' : 'Copy ID'}</span>
                </Button>

                {/* Share Invite Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInvite}
                  className="h-7 gap-1.5 text-xs px-2 shadow-md hover:shadow-lg transition-all"
                  title="Copy invite link"
                >
                  {copiedInvite ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline font-semibold">{copiedInvite ? 'Copied!' : 'Copy Invite'}</span>
                </Button>

                {/* Divider */}
                <span className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1.5" />

                {/* Connection Status Indicator */}
                <motion.div
                  animate={{ scale: isConnected ? 1 : [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: isConnected ? 0 : Infinity }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 border"
                  title={isConnected ? 'Connected' : 'Connecting...'}
                >
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-[10px] font-semibold hidden sm:inline">
                    {isConnected ? 'Online' : 'Connecting'}
                  </span>
                </motion.div>

                {/* Spectators badge */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setShowSpectatorDrawer(true)}
                  title={t('spectator.title')}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="ml-1">
                    {((gameState as any)?.spectatorCount ?? spectators.length ?? 0)}
                  </span>
                </Button>

                {/* Left-handed Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    try {
                      const cur = typeof window !== 'undefined' ? localStorage.getItem('left_handed') : null;
                      const next = cur === '1' ? '0' : '1';
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('left_handed', next);
                      }
                      toast.success(next === '1' ? t('leftHanded.enabled') : t('leftHanded.disabled'));
                      // Force re-render by updating a harmless state
                      setConnectionAttempts((v) => v);
                    } catch {}
                  }}
                  title="Toggle left-handed controls layout"
                >
                  Left-hand
                </Button>

                {/* Density Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const next = uiDensity === 'compact' ? 'comfortable' : 'compact';
                    setUiDensity(next);
                    try { localStorage.setItem('ui_density', next); } catch {}
                    toast.success(t('density.set', { v: next }));
                  }}
                  title="Toggle control density"
                >
                  {uiDensity === 'compact' ? 'Comfort' : 'Compact'}
                </Button>

                {/* Shortcuts overlay */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowShortcuts(true)}
                  title="Show shortcuts"
                >
                  ?
                </Button>

                {/* Reduce Motion */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const next = !reduceMotion;
                    setReduceMotion(next);
                    try { localStorage.setItem('reduce_motion', next ? '1' : '0'); } catch {}
                    toast.success(next ? t('motion.reduced') : t('motion.enabled'));
                  }}
                  title="Toggle reduced motion"
                >
                  {reduceMotion ? 'Motion: Low' : 'Motion: On'}
                </Button>

                {/* Sound Panel */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowSoundPanel((v) => !v)}
                    title="Sound settings"
                  >
                    Sound
                  </Button>
                  {showSoundPanel && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border rounded-lg shadow-2xl p-3 z-30">
                      <div className="text-xs font-semibold mb-2">Volume</div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span>SFX</span><span>{sfxVol}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={sfxVol}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setSfxVol(v);
                            try { setVolume?.(v / 100); } catch {}
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span>Ambient</span><span>{ambVol}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={ambVol}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setAmbVol(v);
                            try { setAmbientLevel?.(v / 100); } catch {}
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="mt-3 text-xs font-semibold flex items-center justify-between">
                        <span>Mixer</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => {
                            applyMixerPreset?.('quiet');
                            setCatActions(Math.round((getCategoryLevel?.('actions') ?? 1) * 100));
                            setCatTurn(Math.round((getCategoryLevel?.('turn') ?? 1) * 100));
                            setCatChips(Math.round((getCategoryLevel?.('chips') ?? 1) * 100));
                            setCatUI(Math.round((getCategoryLevel?.('ui') ?? 1) * 100));
                            setCatCards(Math.round((getCategoryLevel?.('cards') ?? 1) * 100));
                            setCatFlow(Math.round((getCategoryLevel?.('flow') ?? 1) * 100));
                            setAmbVol(Math.round((getAmbientLevel?.() ?? 0.15) * 100));
                          }}>Quiet</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => {
                            applyMixerPreset?.('balanced');
                            setCatActions(Math.round((getCategoryLevel?.('actions') ?? 1) * 100));
                            setCatTurn(Math.round((getCategoryLevel?.('turn') ?? 1) * 100));
                            setCatChips(Math.round((getCategoryLevel?.('chips') ?? 1) * 100));
                            setCatUI(Math.round((getCategoryLevel?.('ui') ?? 1) * 100));
                            setCatCards(Math.round((getCategoryLevel?.('cards') ?? 1) * 100));
                            setCatFlow(Math.round((getCategoryLevel?.('flow') ?? 1) * 100));
                            setAmbVol(Math.round((getAmbientLevel?.() ?? 0.15) * 100));
                          }}>Balanced</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => {
                            applyMixerPreset?.('focus');
                            setCatActions(Math.round((getCategoryLevel?.('actions') ?? 1) * 100));
                            setCatTurn(Math.round((getCategoryLevel?.('turn') ?? 1) * 100));
                            setCatChips(Math.round((getCategoryLevel?.('chips') ?? 1) * 100));
                            setCatUI(Math.round((getCategoryLevel?.('ui') ?? 1) * 100));
                            setCatCards(Math.round((getCategoryLevel?.('cards') ?? 1) * 100));
                            setCatFlow(Math.round((getCategoryLevel?.('flow') ?? 1) * 100));
                            setAmbVol(Math.round((getAmbientLevel?.() ?? 0.15) * 100));
                          }}>Focus</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1"><span>Actions</span><span>{catActions}</span></div>
                          <input type="range" min={0} max={100} value={catActions} onChange={(e)=>{const v=parseInt(e.target.value)||0; setCatActions(v); try{ setCategoryLevel?.('actions', v/100);}catch{} }} className="w-full" />
                          <div className="flex justify-end mt-1"><Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>{ try { playSound('raise'); } catch {} }}>Test</Button></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1"><span>Turn</span><span>{catTurn}</span></div>
                          <input type="range" min={0} max={100} value={catTurn} onChange={(e)=>{const v=parseInt(e.target.value)||0; setCatTurn(v); try{ setCategoryLevel?.('turn', v/100);}catch{} }} className="w-full" />
                          <div className="flex justify-end mt-1"><Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>{ try { playSound('yourTurn'); } catch {} }}>Test</Button></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1"><span>Chips</span><span>{catChips}</span></div>
                          <input type="range" min={0} max={100} value={catChips} onChange={(e)=>{const v=parseInt(e.target.value)||0; setCatChips(v); try{ setCategoryLevel?.('chips', v/100);}catch{} }} className="w-full" />
                          <div className="flex justify-end mt-1"><Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>{ try { playSound('chipBet'); } catch {} }}>Test</Button></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1"><span>UI</span><span>{catUI}</span></div>
                          <input type="range" min={0} max={100} value={catUI} onChange={(e)=>{const v=parseInt(e.target.value)||0; setCatUI(v); try{ setCategoryLevel?.('ui', v/100);}catch{} }} className="w-full" />
                          <div className="flex justify-end mt-1"><Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>{ try { playSound('buttonClick'); } catch {} }}>Test</Button></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1"><span>Cards</span><span>{catCards}</span></div>
                          <input type="range" min={0} max={100} value={catCards} onChange={(e)=>{const v=parseInt(e.target.value)||0; setCatCards(v); try{ setCategoryLevel?.('cards', v/100);}catch{} }} className="w-full" />
                          <div className="flex justify-end mt-1"><Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>{ try { playSound('cardFlip'); } catch {} }}>Test</Button></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1"><span>Flow</span><span>{catFlow}</span></div>
                          <input type="range" min={0} max={100} value={catFlow} onChange={(e)=>{const v=parseInt(e.target.value)||0; setCatFlow(v); try{ setCategoryLevel?.('flow', v/100);}catch{} }} className="w-full" />
                          <div className="flex justify-end mt-1"><Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={()=>{ try { playSound('gameStart'); } catch {} }}>Test</Button></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* One-Thumb Mode */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const next = oneThumb === 'right' ? 'left' : 'right';
                    setOneThumb(next);
                    try { localStorage.setItem('one_thumb', next); } catch {}
                    toast.success(t('oneThumb.set', { v: next }));
                  }}
                  title="Toggle one-thumb reach"
                >
                  Thumb: {oneThumb}
                </Button>

                {/* Win Streak Display */}
                {winStreak > 0 && (
                  <CompactStreak streak={winStreak} isVisible={true} />
                )}

                {/* Emoji Reaction Button */}
                {gameState && (
                  <EmojiReaction onSendReaction={handleSendReaction} />
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

                {/* 3D Casino View - always visible */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full relative"
                >
                  {/* Top-right Settings button (admin only, waiting or playing) */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                      {/* Spectator quick controls */}
                    <div className="flex items-center gap-1.5" />

                    {/* Open Spectator Drawer */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 bg-white/90 text-gray-900 border shadow hover:bg-white"
                      onClick={() => setShowSpectatorDrawer(true)}
                      title={t('spectator.title')}
                    >
                      {t('button.spectators')}
                    </Button>

                      <Button
                        size="sm"
                        className="h-8 px-3 bg-white/90 text-gray-900 border shadow hover:bg-white"
                        onClick={() => setShowSettings(true)}
                        title={t('settings.title')}
                      >
                        {t('button.settings')}
                      </Button>

              
                    </div>
                  )}
                  {(gameState?.tableName || (gameState as any)?.variant) && (
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                      {gameState?.tableName && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/90 dark:bg-gray-900/90 border shadow">
                          {gameState.tableName}
                        </span>
                      )}
                      {(gameState as any)?.variant && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/90 dark:bg-gray-900/90 border shadow capitalize">
                          {String((gameState as any).variant).replace('_',' ')}
                        </span>
                      )}
                    </div>
                  )}
                  <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-gray-700 shadow-xl overflow-hidden">
                    <CardContent className="p-0" style={{ height: isSmallScreen ? (isLandscape ? '44vh' : '32vh') : (isLandscape ? '560px' : '480px') }}>
                      <div className="relative h-full">
                        <RoundTable3D 
                          gameState={gameState} 
                          currentPlayerId={playerId} 
                          isAdmin={isAdmin}
                        />
                        {isAdmin && gameState?.status === 'waiting' && (
                          <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
                            <Button
                              size="sm"
                              className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white shadow"
                              onClick={() => {
                                try {
                                  const totalPlayers = ((gameState?.players?.length) || 0) + (((gameState as any)?.botCount) || 0);
                                  if (totalPlayers < 2) {
                                    try { toast.info('Need at least 2 players. Add a bot in Settings.'); } catch {}
                                    setShowSettings(true);
                                    return;
                                  }
                                  gameSocket.emit('start_game', { gameId, playerId });
                                } catch {}
                              }}
                              title={'Start game'}
                            >
                              Start Game
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  
                  {/* Settings Drawer inside 3D box (slides in from left) */}
                  {isAdmin && showSettings && (
                    <div className="absolute inset-0 z-30">
                      <div className="absolute inset-0 bg-black/30" onClick={() => setShowSettings(false)} />
                      <div className="absolute inset-y-0 left-0 w-[84%] sm:w-96 max-w-full bg-white dark:bg-gray-900 border-r shadow-2xl p-4 transform transition-transform duration-300 translate-x-0">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-base">{t('settings.title')}</CardTitle>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setShowSettings(false)} title={t('common.close')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.tableName')}</span>
                            <input
                              className="flex-1 border rounded px-2 py-1 text-xs bg-background"
                              value={tableNameInput}
                              onChange={(e) => setTableNameInput(e.target.value)}
                              placeholder={gameState.tableName || t('settings.tableName')}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.private')}</span>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={isPrivateInput}
                              onChange={(e) => setIsPrivateInput(e.target.checked)}
                              disabled={gameState?.status !== 'waiting'}
                              title={gameState?.status !== 'waiting' ? t('privacy.cannotChange') : undefined}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.spectators')}</span>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 text-xs bg-background w-28"
                              value={spectatorLimitInput}
                              min={0}
                              max={200}
                              onChange={(e) => setSpectatorLimitInput(parseInt(e.target.value))}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.variant')}</span>
                            <select
                              className="border rounded px-2 py-1 text-xs bg-background"
                              value={variantInput}
                              onChange={(e) => setVariantInput(e.target.value)}
                              disabled={gameState?.status !== 'waiting'}
                              title={gameState?.status !== 'waiting' ? t('variant.cannotChange') : undefined}
                            >
                              <option value="classic">{t('variant.classic')}</option>
                              <option value="ak47">{t('variant.ak47')}</option>
                              <option value="muflis">{t('variant.muflis')}</option>
                              <option value="high_roller">{t('variant.highRoller')}</option>
                              <option value="turbo">{t('variant.turbo')}</option>
                              <option value="joker_wild">{t('variant.jokerWild')}</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.maxPlayers')}</span>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 text-xs bg-background w-24"
                              value={maxPlayersInput}
                              min={2}
                              max={10}
                              onChange={(e) => setMaxPlayersInput(parseInt(e.target.value))}
                              disabled={gameState?.status !== 'waiting'}
                              title={gameState?.status !== 'waiting' ? t('maxPlayers.cannotChange') : undefined}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.bots')}</span>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 text-xs bg-background w-24"
                              value={botCountInput}
                              min={0}
                              max={4}
                              onChange={(e) => setBotCountInput(parseInt(e.target.value))}
                              disabled={gameState?.status !== 'waiting'}
                              title={gameState?.status !== 'waiting' ? t('bots.cannotChange') : undefined}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.minBet')}</span>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 text-xs bg-background w-24"
                              value={minBetInput}
                              min={1}
                              onChange={(e) => setMinBetInput(parseInt(e.target.value))}
                              disabled={gameState?.status !== 'waiting'}
                              title={gameState?.status !== 'waiting' ? t('minBet.cannotChange') : undefined}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.blindShowAfter')}</span>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 text-xs bg-background w-24"
                              value={minShowRoundsInput}
                              min={1}
                              max={10}
                              onChange={(e) => setMinShowRoundsInput(parseInt(e.target.value))}
                              disabled={gameState?.status !== 'waiting'}
                              title={t('settings.rounds')}
                            />
                            <span className="text-xs text-muted-foreground">{t('settings.rounds')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.rajkapoor135')}</span>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={rulesRajkapoor135Input}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setRulesRajkapoor135Input(val);
                                if (val) setRulesDoubleSeq235Input(true);
                              }}
                              disabled={gameState?.status !== 'waiting'}
                              title={t('settings.rajkapoor135')}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-28 text-xs text-muted-foreground">{t('settings.special910Q')}</span>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={rulesSpecial910QInput}
                              onChange={(e) => setRulesSpecial910QInput(e.target.checked)}
                              disabled={gameState?.status !== 'waiting'}
                              title={t('settings.special910Q')}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-3">
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              gameSocket.emit('update_lobby', {
                                gameId,
                                playerId,
                                tableName: tableNameInput || gameState.tableName,
                                maxPlayers: maxPlayersInput,
                                botCount: botCountInput,
                                variant: variantInput,
                                isPrivate: isPrivateInput,
                                spectatorLimit: spectatorLimitInput,
                                minBet: minBetInput,
                                minShowRounds: minShowRoundsInput,
                                rulesRajkapoor135: rulesRajkapoor135Input,
                                rulesDoubleSeq235: rulesDoubleSeq235Input,
                                rulesSpecial910Q: rulesSpecial910QInput
                              });
                              setShowSettings(false);
                            }}
                            disabled={!settingsChanged}
                            title={!settingsChanged ? t('settings.noChanges') : undefined}
                          >
                            {t('settings.save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spectator Drawer inside 3D box (slides in from left) */}
                  {isAdmin && showSpectatorDrawer && (
                    <div className="absolute inset-0 z-30">
                      <div className="absolute inset-0 bg-black/30" onClick={() => setShowSpectatorDrawer(false)} />
                      <div className="absolute inset-y-0 left-0 w-[84%] sm:w-96 max-w-full bg-white dark:bg-gray-900 border-r shadow-2xl p-4 transform transition-transform duration-300 translate-x-0">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-base">{t('spectator.title')}</CardTitle>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setShowSpectatorDrawer(false)} title={t('common.close')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">{t('spectator.privacy')}</div>
                            <button
                              onClick={() => {
                                if (gameState?.status !== 'waiting') {
                                  try { toast.info(t('privacy.cannotChange')); } catch {}
                                  return;
                                }
                                const next = !isGamePrivate;
                                setIsGamePrivate(next);
                                try {
                                  gameSocket.emit('update_lobby', {
                                    gameId,
                                    playerId,
                                    isPrivate: next,
                                  });
                                } catch {}
                              }}
                              className={`text-[11px] font-semibold px-2 py-1 rounded ${isGamePrivate ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                              title={isGamePrivate ? t('spectator.privateTip') : t('spectator.publicTip')}
                            >
                              {isGamePrivate ? t('spectator.private') : t('spectator.public')}
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">{t('spectator.watchingNow')}</div>
                            <div className="px-2 py-0.5 rounded bg-white dark:bg-gray-900 border text-[11px]">
                              👁 {spectators.length}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{t('spectator.limit')}</span>
                            <input
                              type="number"
                              className="border rounded px-2 py-1 text-xs bg-background w-24"
                              value={spectatorLimitInput}
                              min={0}
                              max={200}
                              onChange={(e) => setSpectatorLimitInput(parseInt(e.target.value))}
                            />
                          </div>

                          {/* Share link (only when public) */}
                          {!isGamePrivate && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium">{t('spectator.shareLink')}</div>
                              <div className="flex items-center gap-2">
                                <input
                                  className="flex-1 border rounded px-2 py-1 text-xs bg-background"
                                  readOnly
                                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${encodeURIComponent(gameId)}/spectate`}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={async () => {
                                    try {
                                      const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                      const link = `${origin}/game/${encodeURIComponent(gameId)}/spectate`;
                                      await navigator.clipboard.writeText(link);
                                      setCopiedSpectator(true);
                                      setTimeout(() => setCopiedSpectator(false), 1200);
                                    } catch {}
                                  }}
                                >
                                  {copiedSpectator ? t('common.copied') : t('common.copy')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-3">
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              gameSocket.emit('update_lobby', {
                                gameId,
                                playerId,
                                isPrivate: isGamePrivate,
                                spectatorLimit: spectatorLimitInput
                              });
                              setShowSpectatorDrawer(false);
                            }}
                            disabled={!spectatorChanged}
                            title={!spectatorChanged ? t('spectator.noChanges') : undefined}
                          >
                            {t('common.save')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

        {/* Players (Lobby/Waiting) - replaced by 3D seats */}

        {/* Side Show Indicator - Shows active challenges */}
        <SideShowIndicator
          challenge={sideShowChallenge}
          players={gameState.players}
        />

        {/* Spectator Mode - replaced by in-box drawer */}

        {/* Turn Timer */}
        {gameState.status === 'playing' && !isEliminated && (
          <TurnTimer
            isMyTurn={gameState.currentTurn === playerId}
            turnTimeout={(gameState as any).turnTimeout || 60}
            turnTimeRemaining={(gameState as any).turnTimeRemaining || 60}
            warningThreshold={10}
          />
        )}

        {/* Game Board - Your Cards & Actions */}
        {gameState.status === 'playing' && !isEliminated && (
          <GameBoard
            gameState={gameState}
            currentPlayerId={playerId}
            onMove={(move) => gameSocket.makeMove(gameId, playerId, move)}
            uiDensity={uiDensity}
            reduceMotion={reduceMotion}
            oneThumbSide={oneThumb}
            hapticIntensity={hapticIntensity}
            onSideShowChallenge={(targetId) => handleSideShowChallenge(targetId)}
          />
        )}

        {isEliminated && (
          <div className="my-6 p-4 rounded-xl border bg-white dark:bg-gray-900 shadow text-center">
            <div className="text-xl font-bold mb-1">You are out for this round</div>
            <div className="text-sm text-muted-foreground mb-3">Eliminated after side show</div>
            <Button onClick={handleLeaveGame} variant="outline" className="h-9">Leave Table</Button>
          </div>
        )}

        {/* Side Show Modal - Challenge/Accept/Decline */}
        <SideShow
          challenge={sideShowChallenge}
          results={sideShowResults}
          currentPlayerId={playerId}
          players={gameState.players}
          onAccept={handleAcceptSideShow}
          onDecline={handleDeclineSideShow}
          onChallenge={handleSideShowChallenge}
          canChallenge={(() => {
            if (gameState.status !== 'playing') return false;
            if (gameState.currentTurn !== playerId) return false;
            const active = gameState.players.filter(p => p.isActive && !p.hasFolded);
            if (active.length <= 2) return false;
            const me = gameState.players.find(p => p.id === playerId);
            if (!me?.hasSeen) return false;
            return active.some(p => p.id !== playerId && p.hasSeen);
          })()}
          isCurrentTurn={gameState.currentTurn === playerId}
          currentPlayerHasSeen={!!meNow?.hasSeen}
          onSeeThenAccept={() => {
            try {
              gameSocket.emit('player_move', { gameId, playerId, move: { type: 'SEE' } });
              setTimeout(() => {
                try { handleAcceptSideShow(); } catch {}
              }, 300);
            } catch {}
          }}
        />

        {/* Voice Chat */}
        {showVoiceChat && (
          <div className="max-w-md mx-auto mb-6">
            <VoiceChat
              key={callActive ? 'vc-active' : 'vc-idle'}
              gameId={gameId}
              currentPlayerId={playerId}
              currentPlayerName={gameState.players.find(p => p.id === playerId)?.name || 'Player'}
              signaling={{
                on: (ev: string, cb: any) => gameSocket.on(ev, cb),
                emit: (ev: string, payload: any) => gameSocket.emit(ev, payload)
              }}
              isVisible={showVoiceChat}
              onToggleVisibility={() => setShowVoiceChat(false)}
            />
          </div>
        )}

        {/* Settings Modal (admin only) - replaced by in-box drawer */}

        {/* Game Finished - Winner Celebration */}
        {gameState.status === 'finished' && gameState.winner && !suppressWinner && (
          <WinnerCelebration
            winnerName={gameState.players.find((p) => p.id === gameState.winner)?.name || 'Unknown'}
            winnerChips={gameState.players.find((p) => p.id === gameState.winner)?.chips || 0}
            potAmount={gameState.pot}
            players={gameState.players.map((p) => ({
              id: p.id,
              name: p.name,
              cards: p.cards,
              handRanking: p.cards.length === 3 ? evaluateHand(p.cards).description : undefined,
              finalChips: p.chips,
              isWinner: p.id === gameState.winner,
              position: p.position,
            }))}
            onGoHome={() => window.location.href = '/'}
            onPlayAgain={( (() => {
              const hostId = (gameState as any)?.hostId;
              const fallbackHost = gameState.players?.[0]?.id;
              return (hostId ? hostId === playerId : fallbackHost === playerId);
            })() ) ? (() => {
              try {
                toast.info(t('rematch.start'));
                setSuppressWinner(true);
                gameSocket.emit('rematch', { gameId, playerId });
              } catch (e) {
                try { toast.error(t('rematch.failed')); } catch {}
              }
            }) : undefined}
          />
        )}

        {/* Floating Emoji Reactions */}
        <ReactionContainer 
          reactions={reactions} 
          onComplete={handleRemoveReaction}
        />

        

        {/* Streak Celebration */}
        <StreakCelebration
          streak={winStreak}
          show={showStreakCelebration}
          onComplete={() => setShowStreakCelebration(false)}
        />

        {/* Chat Box - hide during winner announcement */}
        {gameState && gameState.status !== 'finished' && (
          <ChatBox
            messages={chatMessages}
            currentPlayerId={playerId}
            onSendMessage={handleSendChatMessage}
            onTyping={handleTyping}
            typingUsers={typingUsers}
            deliveredIds={deliveredIds}
            players={gameState.players.map(p => ({ id: p.id, name: p.name }))}
            onSendReaction={handleSendReaction}
            quickPhraseGroups={[
              { label: 'Speed', items: ['Your turn','Hurry up 🙂','I call','I fold','Raise!','Show time!'] },
              { label: 'GG', items: ['Good luck & have fun!','Nice hand!','Good game','Well played','Thanks!'] },
              { label: 'Strategy', items: ['Blind or seen?','All-in?','Check pot','Split pot?','Side show?'] }
            ]}
            playerAvatars={Object.fromEntries(
              (gameState.players || []).map(p => [
                p.id,
                // Use player image if available, else ui-avatars fallback
                (p as any).image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0D8ABC&color=fff&size=64`
              ])
            )}
            onEditMessage={handleEditChatMessage}
            onDeleteMessage={handleDeleteChatMessage}
            onStartCall={() => {
              gameSocket.emit('voice_call_start', {
                gameId,
                initiatorId: playerId,
                initiatorName: gameState.players.find(p => p.id === playerId)?.name || 'Player'
              });
              setCallActive(true);
              setShowVoiceChat(true);
            }}
            onLeaveCall={() => {
              try {
                gameSocket.emit('voice_call_end', { gameId, initiatorId: playerId });
              } catch {}
              setCallActive(false);
              setShowVoiceChat(false);
            }}
            callActive={callActive}
            isInVoiceChat={showVoiceChat}
            onOpenVoiceChat={() => setShowVoiceChat(true)}
          />
        )}

        {/* Quick Join pill for active call */}
        {callActive && !showVoiceChat && (
          <div className="fixed bottom-20 right-2 sm:bottom-24 sm:right-4 z-40">
            <button
              onClick={() => setShowVoiceChat(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              <span>📞 Join call</span>
            </button>
          </div>
        )}

        {/* Nudge Button - Show when it's not your turn and you're waiting */}
        {gameState && gameState.status === 'playing' && gameState.currentTurn && gameState.currentTurn !== playerId && (
          <div className="fixed bottom-32 right-4 z-40">
            <NudgeButton
              targetPlayerId={gameState.currentTurn}
              targetPlayerName={gameState.players.find(p => p.id === gameState.currentTurn)?.name || 'Player'}
              onNudge={handleNudge}
              canNudge={waitingTime > 15}
              waitingTime={waitingTime}
              onCooldownEnd={() => {
                // Inform receiver to dismiss overlay when sender can nudge again
                gameSocket.emit('nudge_ready', {
                  gameId,
                  from: playerId,
                  to: gameState.currentTurn,
                });
              }}
            />
          </div>
        )}

        {/* Nudge Overlay - Show when you get nudged */}
        <NudgeOverlay 
          show={showNudgeOverlay} 
          onComplete={() => setShowNudgeOverlay(false)} 
        />

        {/* Global Notification Feed - Shows chat, nudges, and actions to ALL players */}
        <GlobalNotificationFeed
          notifications={globalNotifications}
          maxVisible={5}
          autoHideDuration={5000}
        />

        {/* Voice Chat Indicator removed; mic now inside chat box */}

        {/* Gesture Controls - Touch & Swipe Controls */}
        {gameState && gameState.status === 'playing' && (
          <GestureControls
            isYourTurn={gameState.currentTurn === playerId}
            onCall={() => handleGestureAction('call')}
            onRaise={() => handleGestureAction('raise')}
            onFold={() => handleGestureAction('fold')}
            onSee={() => handleGestureAction('see')}
            canCall={gameState.currentTurn === playerId && (gameState.currentBet || 0) > 0}
            canRaise={gameState.currentTurn === playerId}
            canFold={gameState.currentTurn === playerId}
            canSee={gameState.currentTurn === playerId && !currentPlayer?.hasSeen}
            showHints={true}
          />
        )}

        {/* Keyboard Shortcuts - Desktop Controls */}
        {gameState && gameState.status === 'playing' && (
          <KeyboardShortcuts
            isYourTurn={gameState.currentTurn === playerId}
            onCall={() => handleGestureAction('call')}
            onRaise={() => handleGestureAction('raise')}
            onFold={() => handleGestureAction('fold')}
            onSee={() => handleGestureAction('see')}
            canCall={gameState.currentTurn === playerId && (gameState.currentBet || 0) > 0}
            canRaise={gameState.currentTurn === playerId}
            canFold={gameState.currentTurn === playerId}
            canSee={gameState.currentTurn === playerId && !currentPlayer?.hasSeen}
          />
        )}
      </div>
      {/* Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-xl border p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
                <Button size="sm" variant="outline" className="h-8" onClick={() => setShowShortcuts(false)}>Close</Button>
              </div>
              <ul className="text-sm space-y-1">
                <li><span className="font-semibold">/</span> Focus chat</li>
                <li><span className="font-semibold">Enter</span> Send message</li>
                <li><span className="font-semibold">Shift+Enter</span> New line</li>
                <li><span className="font-semibold">C</span> Call (your turn)</li>
                <li><span className="font-semibold">R</span> Raise (your turn)</li>
                <li><span className="font-semibold">F</span> Fold (your turn)</li>
                <li><span className="font-semibold">S</span> See Cards</li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </I18nProvider>
  );
}

