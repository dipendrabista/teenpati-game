'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, X, Minimize2, Maximize2, Mic, PhoneCall, PhoneOff, Smile, Volume2, VolumeX, QrCode, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toggleSound, isSoundEnabled, toggleAmbient, isAmbientEnabled } from '@/lib/sounds';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { track as trackAnalytics } from '@/lib/analytics';

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

interface TypingUser { playerId: string; playerName: string; }
interface ChatPlayer { id: string; name: string; }

interface ChatBoxProps {
  messages: ChatMessage[];
  currentPlayerId: string;
  onSendMessage: (message: string) => void;
  onEditMessage?: (id: string, message: string) => void;
  onDeleteMessage?: (id: string) => void;
  onTyping?: (isTyping: boolean) => void;
  typingUsers?: TypingUser[];
  deliveredIds?: Set<string>;
  players?: ChatPlayer[];
  onSendReaction?: (emoji: string) => void;
  quickPhrases?: string[];
  quickPhraseGroups?: { label: string; items: string[] }[];
  playerAvatars?: Record<string, string>;
  onlineMap?: Record<string, boolean>;
  onOpenVoiceChat?: () => void;
  onStartCall?: () => void;
  onLeaveCall?: () => void;
  callActive?: boolean;
  isInVoiceChat?: boolean;
}

export function ChatBox({ messages, currentPlayerId, onSendMessage, onEditMessage, onDeleteMessage, onTyping, typingUsers = [], deliveredIds, players = [], onSendReaction, quickPhrases, quickPhraseGroups, playerAvatars = {}, onlineMap = {}, onOpenVoiceChat, onStartCall, onLeaveCall, callActive = false, isInVoiceChat = false }: ChatBoxProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('chat_isOpen') === '1'; } catch { return false; }
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('chat_isMinimized') === '1'; } catch { return false; }
  });
  // Resizable width/height + fullscreen
  const [widthPx, setWidthPx] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem('chat_width');
      return saved ? Math.max(280, Math.min(parseInt(saved), Math.max(320, window.innerWidth - 16))) : 384; // ~sm:w-96
    } catch { return 384; }
  });
  const [heightPx, setHeightPx] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem('chat_height');
      if (saved) return Math.max(240, Math.min(parseInt(saved), Math.max(300, window.innerHeight - 16)));
      return Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.7);
    } catch { return 520; }
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('chat_fullscreen') === '1'; } catch { return false; }
  });
  const resizeRef = useRef<{ active: boolean; mode: 'corner' | 'width' | 'height'; startX: number; startY: number; startW: number; startH: number } | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const lastSendAtRef = useRef<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(messages.length);
  const [atBottom, setAtBottom] = useState(true);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionListOpen, setMentionListOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('chat_showEmoji') === '1'; } catch { return false; }
  });
  const lastTypingEmitRef = useRef<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isSoundEnabled());
  const [ambientOn, setAmbientOn] = useState<boolean>(() => (typeof window !== 'undefined' ? isAmbientEnabled() : false));
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pingMs, setPingMs] = useState<number | null>(null);

  // Persist UI state
  useEffect(() => {
    try { localStorage.setItem('chat_isOpen', isOpen ? '1' : '0'); } catch {}
  }, [isOpen]);
  useEffect(() => {
    try { localStorage.setItem('chat_isMinimized', isMinimized ? '1' : '0'); } catch {}
  }, [isMinimized]);
  useEffect(() => {
    try { localStorage.setItem('chat_showEmoji', showEmojiPicker ? '1' : '0'); } catch {}
  }, [showEmojiPicker]);
  useEffect(() => {
    if (widthPx > 0) { try { localStorage.setItem('chat_width', String(widthPx)); } catch {} }
  }, [widthPx]);
  useEffect(() => {
    if (heightPx > 0) { try { localStorage.setItem('chat_height', String(heightPx)); } catch {} }
  }, [heightPx]);
  useEffect(() => {
    try { localStorage.setItem('chat_fullscreen', isFullscreen ? '1' : '0'); } catch {}
  }, [isFullscreen]);
  useEffect(() => {
    // Initialize height if SSR defaulted to 0
    if (typeof window !== 'undefined' && (heightPx === 0 || Number.isNaN(heightPx))) {
      setHeightPx(Math.round(window.innerHeight * 0.7));
    }
  }, []);

  // Drag resize handlers
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));
  const startResize = (e: React.MouseEvent, mode: 'corner' | 'width' | 'height') => {
    if (isFullscreen || isMinimized) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    resizeRef.current = {
      active: true,
      mode,
      startX: sx,
      startY: sy,
      startW: widthPx || 384,
      startH: heightPx || Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.7),
    };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeEnd);
  };
  const onResizeMove = (e: MouseEvent) => {
    const st = resizeRef.current;
    if (!st || !st.active) return;
    const maxW = Math.max(320, window.innerWidth - 16);
    const maxH = Math.max(300, window.innerHeight - 16);
    // Anchored to bottom-right -> dragging left increases width, dragging up increases height
    const dw = st.startX - e.clientX;
    const dh = st.startY - e.clientY;
    if (st.mode === 'corner' || st.mode === 'width') {
      setWidthPx(clamp(Math.round(st.startW + dw), 280, maxW));
    }
    if (st.mode === 'corner' || st.mode === 'height') {
      setHeightPx(clamp(Math.round(st.startH + dh), 240, maxH));
    }
  };
  const onResizeEnd = () => {
    if (resizeRef.current) resizeRef.current.active = false;
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', onResizeEnd);
  };

  // Online/offline & ping
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const measure = async () => {
      const start = performance.now();
      try {
        await fetch('/', { method: 'HEAD', cache: 'no-store' });
        const ms = Math.round(performance.now() - start);
        setPingMs(ms);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };
    measure();
    const id = setInterval(measure, 15000);
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if at bottom)
  useEffect(() => {
    if (!scrollRef.current || !isOpen || isMinimized) return;
    const container = scrollRef.current;
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 40;
    if (nearBottom) {
      container.scrollTop = container.scrollHeight;
      setAtBottom(true);
      setShowNewMsgPill(false);
    } else {
      setAtBottom(false);
      setShowNewMsgPill(true);
    }
  }, [messages, isOpen, isMinimized]);

  // Track unread messages
  useEffect(() => {
    if (!isOpen || isMinimized) {
      const newMessages = messages.length - previousMessageCount.current;
      if (newMessages > 0) {
        setUnreadCount(prev => prev + newMessages);
      }
    } else {
      setUnreadCount(0);
    }
    previousMessageCount.current = messages.length;
  }, [messages, isOpen, isMinimized]);

  // Track scroll position to toggle atBottom/new message pill
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    setAtBottom(nearBottom);
    if (nearBottom) setShowNewMsgPill(false);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowNewMsgPill(false);
  };

  const sendMessage = (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    const now = Date.now();
    const delta = now - lastSendAtRef.current;
    if (delta < 800) {
      setCooldownMs(Math.max(0, 800 - delta));
      if (!cooldownTimerRef.current) {
        cooldownTimerRef.current = setInterval(() => {
          setCooldownMs((m) => {
            const next = Math.max(0, m - 100);
            if (next === 0 && cooldownTimerRef.current) { clearInterval(cooldownTimerRef.current); cooldownTimerRef.current = null; }
            return next;
          });
        }, 100);
      }
      try { toast.error(t('chat.cooldown')); } catch {}
      return;
    }
    try {
      onSendMessage(msg);
      setInputValue("");
      try { trackAnalytics('chat_send', { length: msg.length }); } catch {}
      lastSendAtRef.current = now;
    } catch (e) {
      console.warn('chat_message failed', e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue.trim());
    }
  };

  // '/' focus chat, '?' open shortcuts overlay (inline minimal)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isMinimized || !isOpen) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        const el = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement | null;
        el?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        alert(t('shortcuts.inline'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMinimized, isOpen, t]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get player color based on playerId (consistent colors)
  const getPlayerColor = (playerId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-rose-500',
    ];
    // Simple hash to get consistent color for same player
    const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get player initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMentionSuggestions = (): ChatPlayer[] => {
    if (!mentionListOpen || mentionQuery === null) return [];
    const q = mentionQuery.trim();
    const pool = players.filter(p => p.id !== currentPlayerId);
    const filtered = pool
      .filter(p => p.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const al = a.name.toLowerCase();
        const bl = b.name.toLowerCase();
        const ql = q.toLowerCase();
        const aScore = (al === ql ? -1 : 0) + (al.startsWith(ql) ? 0 : 1);
        const bScore = (bl === ql ? -1 : 0) + (bl.startsWith(ql) ? 0 : 1);
        if (aScore !== bScore) return aScore - bScore;
        return al.localeCompare(bl);
      })
      .slice(0, 5);
    // Include @all as special first option when query is empty or matches 'all'
    const includeAll = q === '' || 'all'.startsWith(q.toLowerCase());
    const allOption: ChatPlayer = { id: '__all__', name: 'all' };
    return includeAll ? [allOption, ...filtered] : filtered;
  };

  const insertMention = (name: string) => {
    // Replace the last @token with the selected name
    const replaced = inputValue.replace(/(^|\s)@(\w*)$/, (_m, g1) => `${g1}@${name} `);
    setInputValue(replaced);
    setMentionListOpen(false);
    setMentionQuery(null);
  };

  const renderMessageWithMentions = (text: string) => {
    // Highlight @mentions (alphanumeric and underscore)
    const parts = text.split(/(@[A-Za-z0-9_]+)/g);
    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith('@') && part.length > 1) {
            return (
              <span key={idx} className="font-semibold text-primary">
                {part}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  };

  const defaultQuickPhrases = [
    'GL & HF',
    'Nice hand!',
    "Your turn",
    'Hurry up 🙂',
    'Blind or Seen?',
    'I call',
    'I fold',
    'Raise!',
    'Show time!',
    'Good game',
  ];

  const chatEmojis = ['🃏','♠️','♥️','♦️','♣️','💰','🔥','😎','😂','😮','😡','🙏','👏','🎉','⏳','🤔','🤫','👀','🤯','🍀','📈','📉','☠️','👑','💣','🐢','🏃‍♂️'];
  const reactionEmojis = ['🔥','🎉','😎','👏','💰','🃏','🤔','🤯','👀','🍀','☠️','👑'];
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('recentChatEmojis');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const addRecentEmoji = (e: string) => {
    setRecentEmojis((prev) => {
      const next = [e, ...prev.filter(x => x !== e)].slice(0, 8);
      try { localStorage.setItem('recentChatEmojis', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Quick phrases category state
  const [qpCategoryIndex, setQpCategoryIndex] = useState(0);
  const currentQuickPhrases = (() => {
    if (quickPhraseGroups && quickPhraseGroups.length > 0) {
      const idx = Math.min(qpCategoryIndex, quickPhraseGroups.length - 1);
      return quickPhraseGroups[idx]?.items || [];
    }
    return (quickPhrases && quickPhrases.length > 0) ? quickPhrases : defaultQuickPhrases;
  })();

  // Floating chat button
  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setUnreadCount(0);
        }}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>
    );
  }

  // Chat window
  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden flex flex-col"
      style={
        isFullscreen
          ? { top: 8, bottom: 8, left: 8, right: 8, width: 'auto', height: 'auto' }
          : { height: isMinimized ? 'auto' : (heightPx > 0 ? `${heightPx}px` : '70vh'), width: widthPx > 0 ? `${widthPx}px` : undefined }
      }
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-white select-none"
        onDoubleClick={() => setIsFullscreen((v) => !v)}
      >
        <div className="flex items-center gap-2 relative">
          <MessageCircle className="h-5 w-5" />
          <span className="font-bold">Game Chat</span>
          {messages.length > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
          {/* Quick-share link removed */}
          {/* QR button */}
          <button
            type="button"
            onClick={() => setShowQr((s) => !s)}
            className="ml-1 h-6 w-6 rounded bg-white/15 hover:bg-white/25 flex items-center justify-center"
            title="Show QR to join"
          >
            <QrCode className="h-4 w-4" />
          </button>
          {showQr && (
            <div className="absolute top-9 left-0 bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-700 rounded-lg shadow-2xl p-2 z-10">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                alt="Join QR"
                className="h-40 w-40"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Start/Join call button (Messenger style) */}
          {callActive ? (
            isInVoiceChat ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLeaveCall?.()}
                className="h-8 px-2 text-white hover:bg-white/20"
                title="Leave call"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenVoiceChat?.()}
                className="h-8 px-2 text-white hover:bg-white/20"
                title="Join call"
              >
                <PhoneCall className="h-4 w-4" />
              </Button>
            )
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartCall?.()}
              className="h-8 px-2 text-white hover:bg-white/20"
              title="Start call"
            >
              <PhoneCall className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          {/* Ambient toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAmbientOn(toggleAmbient())}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            title={ambientOn ? 'Ambient on' : 'Ambient off'}
          >
            <Music2 className={`h-4 w-4 ${ambientOn ? '' : 'opacity-50'}`} />
          </Button>
          {/* Quick mute */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(toggleSound())}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resize handles (hidden on mobile) */}
      {!isMinimized && !isFullscreen && (
        <>
          {/* Left edge width handle */}
          <div
            onMouseDown={(e) => startResize(e, 'width')}
            className="hidden sm:block absolute top-12 bottom-12 left-0 w-1 cursor-ew-resize"
            style={{ zIndex: 5 }}
            aria-hidden
          />
          {/* Bottom-left corner handle */}
          <div
            onMouseDown={(e) => startResize(e, 'corner')}
            className="hidden sm:block absolute bottom-1 left-1 h-3 w-3 cursor-nwse-resize"
            style={{ zIndex: 5 }}
            aria-hidden
          />
        </>
      )}

      {!isMinimized && (
        <>
          {/* Reconnect bar */}
          {!isOnline && (
            <div className="bg-red-600 text-white text-xs text-center py-1">Reconnecting…</div>
          )}
          {/* Call banner */}
          {callActive && (
            <div className="px-3 pt-2 pb-0">
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                  <PhoneCall className="h-4 w-4" />
                  <span>{t('call.banner')}</span>
                </div>
                {isInVoiceChat ? (
                  <Button size="sm" variant="outline" onClick={() => onLeaveCall?.()} className="h-8">
                    Leave
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onOpenVoiceChat?.()} className="h-8">
                    Join
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quick chat: categories + phrases */}
          <div className="px-3 pt-2 pb-0">
            {quickPhraseGroups && quickPhraseGroups.length > 0 && (
              <div className="mb-1 flex gap-1 overflow-x-auto no-scrollbar">
                {quickPhraseGroups.map((g, i) => (
                  <button
                    key={g.label}
                    onClick={() => setQpCategoryIndex(i)}
                    className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${i === qpCategoryIndex ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {currentQuickPhrases
                .map((p) => {
                  // Strip emojis from quick replies
                  try {
                    // Remove extended pictographic (emoji) characters
                    // Fallback to return original if regex unsupported
                    // eslint-disable-next-line no-useless-escape
                    const sanitized = p.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s{2,}/g, ' ').trim();
                    return sanitized;
                  } catch {
                    return p.replace(/🙂|😊|😂|😎|🎉|🔥|💰|👑|💯|⏳/g, '').replace(/\s{2,}/g, ' ').trim();
                  }
                })
                .filter((p) => p.length > 0)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => onSendMessage(p)}
                    className="shrink-0 text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {p}
                  </button>
                ))}
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 p-3 no-scrollbar overflow-x-hidden overflow-y-auto min-h-0">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No messages yet. Start chatting!
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="flex flex-col w-full"
                    >
                      {msg.isSystem ? (
                        // System message
                        <div className="text-xs text-center text-muted-foreground italic bg-muted px-3 py-1 rounded-full">
                          {msg.message}
                        </div>
                      ) : (
                        // Player message with avatar
                        <div className={`flex gap-2 w-full ${
                          msg.playerId === currentPlayerId ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          {/* Player Avatar + presence dot */}
                          <div className="relative h-8 w-8 flex-shrink-0">
                            <Avatar className={`h-8 w-8 overflow-hidden ${playerAvatars[msg.playerId] ? '' : getPlayerColor(msg.playerId)}`}>
                              {playerAvatars[msg.playerId] && (
                                <AvatarImage src={playerAvatars[msg.playerId]} alt={msg.playerName} className="h-full w-full object-cover rounded-full" />
                              )}
                              <AvatarFallback className="text-white text-xs font-bold">
                                {getInitials(msg.playerName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${onlineMap[msg.playerId] ?? true ? 'bg-green-500' : 'bg-gray-400'}`} />
                          </div>
                          
                          {/* Message Content */}
                          <div className={`flex flex-col ${
                            msg.playerId === currentPlayerId ? 'items-end' : 'items-start'
                          } flex-1 min-w-0`}>
                            {/* Player name and time */}
                            <div className={`flex items-center gap-1.5 mb-1 ${
                              msg.playerId === currentPlayerId ? 'flex-row-reverse' : 'flex-row'
                            }`}>
                              <span className="text-xs font-bold text-foreground" title={msg.playerName}>
                                {msg.playerName}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            
                            {/* Message bubble / editor */}
                            {editingId === msg.id ? (
                              <div className={`max-w-[85%] rounded-2xl ${
                                msg.playerId === currentPlayerId
                                  ? 'bg-primary/10 rounded-tr-sm'
                                  : 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'
                              } p-2`}
                              >
                                <input
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      onEditMessage?.(msg.id, editingValue.trim());
                                      setEditingId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingId(null);
                                    }
                                  }}
                                  className="w-full bg-transparent text-sm outline-none"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                  <button className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={() => setEditingId(null)}>Cancel</button>
                                  <button className="text-xs px-2 py-1 rounded bg-primary text-white" onClick={() => { onEditMessage?.(msg.id, editingValue.trim()); setEditingId(null); }}>Save</button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`group relative max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                                  msg.playerId === currentPlayerId
                                    ? 'bg-primary text-white rounded-tr-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-tl-sm'
                                }`}
                                onContextMenu={(e) => { e.preventDefault(); if (msg.playerId === currentPlayerId) setLongPressedMsgId(msg.id); }}
                                onMouseDown={() => {
                                  if (msg.playerId !== currentPlayerId) return;
                                  longPressTimer.current = setTimeout(() => setLongPressedMsgId(msg.id), 400);
                                }}
                                onMouseUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                                onTouchStart={() => {
                                  if (msg.playerId !== currentPlayerId) return;
                                  longPressTimer.current = setTimeout(() => setLongPressedMsgId(msg.id), 350);
                                }}
                                onTouchEnd={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                              >
                                {renderMessageWithMentions(msg.message)}
                                {/* Actions */}
                                {msg.playerId === currentPlayerId && (
                                  <div className={`absolute -top-5 right-0 gap-1 ${longPressedMsgId === msg.id ? 'flex' : 'hidden group-hover:flex'}`}
                                    onMouseLeave={() => setLongPressedMsgId((id) => (id === msg.id ? null : id))}
                                  >
                                    <button
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10"
                                      onClick={() => { setEditingId(msg.id); setEditingValue(msg.message); }}
                                    >Edit</button>
                                    <button
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10"
                                      onClick={() => onDeleteMessage?.(msg.id)}
                                    >Delete</button>
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.playerId === currentPlayerId && deliveredIds && (
                              <div className="text-[10px] mt-0.5 opacity-60">
                                {deliveredIds.has(msg.id) ? '✓ delivered' : '… sending'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {typingUsers.length > 0 && (
                <div className="text-xs text-muted-foreground italic mt-2">
                  {(() => {
                    const names = typingUsers.map(t => t.playerName);
                    const shown = names.slice(0, 2);
                    const extra = names.length - shown.length;
                    return `${shown.join(', ')}${extra > 0 ? ` +${extra}` : ''} is typing...`;
                  })()}
                </div>
              )}
            </div>
            <AnimatePresence>
              {showNewMsgPill && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-16 sm:bottom-14 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                >
                  New messages ↓
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 relative">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setInputValue(v);
              // rate limit typing emits (300ms)
              const now = Date.now();
              if (now - lastTypingEmitRef.current >= 300) {
                onTyping?.(v.trim().length > 0);
                lastTypingEmitRef.current = now;
              }
                  // Detect mention pattern: last token starting with @
                  const tokenMatch = v.match(/(^|\s)@(\w*)$/);
                  if (tokenMatch) {
                    const q = tokenMatch[2] || '';
                    setMentionQuery(q.toLowerCase());
                    setMentionListOpen(true);
                    setMentionIndex(0);
                  } else {
                    setMentionListOpen(false);
                    setMentionQuery(null);
                  }
                }}
                onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setMentionListOpen(false);
                setMentionQuery(null);
                setShowEmojiPicker(false);
                return;
              }
              if (mentionListOpen) {
                const suggestions = getMentionSuggestions();
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setMentionIndex((prev) => (prev + 1) % Math.max(1, suggestions.length));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setMentionIndex((prev) => (prev - 1 + Math.max(1, suggestions.length)) % Math.max(1, suggestions.length));
                } else if (e.key === 'Enter') {
                  if (suggestions.length > 0) {
                    e.preventDefault();
                    insertMention(suggestions[Math.max(0, mentionIndex % suggestions.length)].name);
                  }
                }
              }
                }}
                onKeyPress={handleKeyPress}
                ref={inputRef}
                placeholder={t('chat.placeholder')}
                className="flex-1 h-10"
                maxLength={200}
              />
              {/* Emoji toggle (replaces voice record button) */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((s) => !s)}
                className="h-10 w-10 p-0 rounded-md border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
                title="Emojis"
              >
                <Smile className="h-4 w-4" />
              </button>
              <Button
                onClick={() => sendMessage(inputValue.trim())}
                disabled={!inputValue.trim() || cooldownMs > 0}
                className="h-10 w-10 p-0"
              >
                {cooldownMs > 0 ? `Wait ${Math.ceil(cooldownMs/100)}0ms` : t('chat.send')}
              </Button>
            </div>

            {/* Emoji picker panel */}
            {showEmojiPicker && (
              <div className="absolute bottom-14 right-3 z-20 w-64 max-h-60 overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl p-2">
                {recentEmojis.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Recent</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentEmojis.map((e) => (
                        <button
                          key={`recent-${e}`}
                          onClick={() => {
                            const input = inputRef.current;
                            const emoji = e;
                            if (!input) {
                              setInputValue((prev) => prev + emoji);
                            } else {
                              const start = input.selectionStart ?? input.value.length;
                              const end = input.selectionEnd ?? input.value.length;
                              const next = input.value.slice(0, start) + emoji + input.value.slice(end);
                              setInputValue(next);
                              setTimeout(() => {
                                try {
                                  input.focus();
                                  const caret = start + emoji.length;
                                  input.setSelectionRange(caret, caret);
                                } catch {}
                              }, 0);
                            }
                          }}
                          className="h-8 w-8 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-lg"
                          title={e}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-8 gap-1.5">
                  {chatEmojis.map((e) => (
                    <button
                      key={`pick-${e}`}
                      onClick={() => {
                        const input = inputRef.current;
                        const emoji = e;
                        if (!input) {
                          setInputValue((prev) => prev + emoji);
                        } else {
                          const start = input.selectionStart ?? input.value.length;
                          const end = input.selectionEnd ?? input.value.length;
                          const next = input.value.slice(0, start) + emoji + input.value.slice(end);
                          setInputValue(next);
                          setTimeout(() => {
                            try {
                              input.focus();
                              const caret = start + emoji.length;
                              input.setSelectionRange(caret, caret);
                            } catch {}
                          }, 0);
                        }
                        addRecentEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="h-8 w-8 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-lg"
                      title={e}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Mention suggestions */}
            {mentionListOpen && getMentionSuggestions().length > 0 && (
              <div className="mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden">
                {getMentionSuggestions().map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => insertMention(p.name)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${idx === mentionIndex ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  >
                    <div className={`h-6 w-6 rounded-full ${getPlayerColor(p.id)} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {getInitials(p.name)}
                    </div>
                    <span className="font-medium">@{p.name}{p.id === '__all__' ? ' (Everyone)' : ''}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground mt-1">
              Press Enter to send • {inputValue.length}/200
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

