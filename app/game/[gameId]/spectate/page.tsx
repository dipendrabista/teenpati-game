'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Users, Play, Clock, Coins, Trophy, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { GameBoard } from '@/components/game/GameBoard';

const DynamicRoundTable3D = dynamic(() => import('@/components/game/RoundTable3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[55vh] sm:h-[700px] bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 rounded-lg">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <p>Loading 3D Table...</p>
      </div>
    </div>
  ),
});

import { ChatBox, type ChatMessage } from '@/components/game/ChatBox';
import { CompactStreak, StreakCelebration } from '@/components/game/StreakTracker';
import { GestureControls, KeyboardShortcuts } from '@/components/game/GestureControls';
import { NudgeButton, NudgeOverlay } from '@/components/game/NudgeButton';
import { GlobalNotificationFeed, type GlobalNotification } from '@/components/game/GlobalNotificationFeed';
import { SideShow, SideShowIndicator } from '@/components/game/SideShow';
import { GameState, PlayerAction } from '@/types/game';
import { playSound, startAmbient, stopAmbient } from '@/lib/sounds';
import Link from 'next/link';


export default function SpectatePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [gameDuration, setGameDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [winStreak, setWinStreak] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ playerId: string; playerName: string }[]>([]);
  const typingRef = useRef<Record<string, number>>({});
  const [deliveredIds, setDeliveredIds] = useState<Set<string>>(new Set());
  const [globalNotifications, setGlobalNotifications] = useState<GlobalNotification[]>([]);
  const [pendingChatEdits, setPendingChatEdits] = useState<Record<string, string>>({});
  const [pendingChatDeletes, setPendingChatDeletes] = useState<Set<string>>(new Set());
  const [sideShowChallenge, setSideShowChallenge] = useState<any>(null);
  const [sideShowResults, setSideShowResults] = useState<any>(null);

  const gameStartTimeRef = useRef<number | null>(null);
  const previousWinnerRef = useRef<string | null>(null);
  const previousPlayerCount = useRef(0);
  const previousStatus = useRef<string>('');
  const socketRef = useRef<any>(null);

  // Spectators can't make moves - this is a dummy function
  const handleMove = (move: PlayerAction) => {
    // Spectators can't make moves
    console.log('Spectator attempted to make move:', move);
  };

  useEffect(() => {
    // Initialize ambient sound
    startAmbient();

    return () => {
      stopAmbient();
    };
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const connectAsSpectator = async () => {
      try {
        setConnectionAttempts(prev => prev + 1);
        // Fetch current game info from API
        const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`, { cache: 'no-store' });
        let data: any | null = null;
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data) {
            data = json.data;
          }
        } else if (res.status === 404) {
          // Fallback stub so the table can render even if the game isn't created yet
          data = {
            id: gameId,
            players: [],
            currentTurn: null,
            status: 'waiting',
            winner: null,
            pot: 0,
            currentBet: 0,
            minBet: 10,
            roundNumber: 1,
            createdAt: Date.now(),
            startedAt: null,
            name: `Table ${String(gameId).slice(-4)}`,
            tableName: `Table ${String(gameId).slice(-4)}`,
            maxPlayers: 3,
            isPrivate: false,
            spectatorLimit: 20,
            spectatorCount: 0,
            variant: 'classic',
          };
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
        if (!data) throw new Error('Game not found');
        if (data.isPrivate) {
          setError('This table is private. Spectating is not allowed.');
          return;
        }
        // Hydrate minimal GameState
        const gs: GameState = {
          id: data.id,
          players: (data.players || []).map((p: any) => ({
            id: p.id, name: p.name, chips: p.chips, initialChips: p.initialChips,
            isReady: !!p.isReady, position: p.position, cards: [], hasSeen: !!p.hasSeen,
            hasFolded: !!p.hasFolded, currentBet: p.currentBet, totalBet: p.totalBet, isActive: !!p.isActive
          })),
          currentTurn: data.currentTurn || null,
          status: data.status,
          winner: data.winner || null,
          pot: data.pot || 0,
          currentBet: data.currentBet || 0,
          minBet: data.minBet || 10,
          roundNumber: data.roundNumber || 1,
          deck: [],
          createdAt: new Date(data.createdAt || Date.now()),
          startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
          variant: data.variant
        };
        // Attach meta for header and list badges
        (gs as any).tableName = data.tableName || data.name || '';
        (gs as any).variant = data.variant || (gs as any).variant;
        (gs as any).spectatorCount = data.spectatorCount || 0;
        (gs as any).maxPlayers = data.maxPlayers || 3;
        (gs as any).hostId = data.hostId || null;
        (gs as any).admins = data.admins || [];
        setGameState(gs);
        setIsConnected(true);
        gameStartTimeRef.current = Date.now();
      } catch (err) {
        console.error('Failed to connect as spectator:', err);
        setError('Failed to connect to game. It may not exist or be private.');
      }
    };

    connectAsSpectator();

    return () => {
      setIsConnected(false);
    };
  }, [gameId]);

  // Poll for live updates (state + spectator count)
  useEffect(() => {
    if (!isConnected || !gameId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success || !json.data) return;
        const data = json.data as any;
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: (data.players || []).map((p: any) => ({
              id: p.id, name: p.name, chips: p.chips, initialChips: p.initialChips,
              isReady: !!p.isReady, position: p.position, cards: [], hasSeen: !!p.hasSeen,
              hasFolded: !!p.hasFolded, currentBet: p.currentBet, totalBet: p.totalBet, isActive: !!p.isActive
            })),
            currentTurn: data.currentTurn || null,
            status: data.status,
            pot: data.pot || 0,
            currentBet: data.currentBet || 0,
          };
        });
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isConnected, gameId]);

  // Track game duration
  useEffect(() => {
    if (!gameStartTimeRef.current || !isConnected) return;

    const interval = setInterval(() => {
      setGameDuration(Math.floor((Date.now() - gameStartTimeRef.current!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Live socket updates (spectate join/leave and game_state deltas)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (typeof window === 'undefined' || !gameId) return;
        const { io } = await import('socket.io-client');
        const sock = io(window.location.origin, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
        });
        socketRef.current = sock;

        sock.on('connect', () => {
          try { sock.emit('spectate_join', { gameId }); } catch {}
        });
        sock.on('spectate_ok', () => {
          if (!active) return;
        });
        sock.on('spectate_error', (e: any) => {
          if (!active) return;
          setError(e?.message || 'Unable to spectate this table');
        });
        sock.on('game_state', (state: any) => {
          if (!active) return;
          setGameState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              pot: state?.pot ?? prev.pot,
              currentBet: state?.currentBet ?? prev.currentBet,
              currentTurn: state?.currentTurn ?? prev.currentTurn,
              status: state?.status ?? prev.status,
            };
          });
        });
      } catch {}
    })();
    return () => {
      active = false;
      try {
        if (socketRef.current) {
          socketRef.current.emit('spectate_leave', { gameId });
          socketRef.current.disconnect();
        }
      } catch {}
    };
  }, [gameId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Eye className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700 dark:text-red-300">
              Spectate Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameState || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <CardTitle>Connecting to Game...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Attempt {connectionAttempts} - Joining as spectator
            </p>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activePlayers = gameState.players.filter(p => p.isActive && !p.hasFolded);
  const spectatorCount = (gameState as any)?.spectatorCount ?? 0;
  const tableName = (gameState as any)?.tableName as string | undefined;
  const variant = (gameState as any)?.variant as string | undefined;
  const maxPlayers = (gameState as any)?.maxPlayers ?? 3;
  const hostId = (gameState as any)?.hostId as string | undefined;
  const admins = ((gameState as any)?.admins as string[] | undefined) ?? [];
  const seatsAvailable = (gameState.players?.length || 0) < (maxPlayers || 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Spectator Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Spectating Game
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {gameId.slice(-6)}
                </Badge>
                {tableName && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    {tableName}
                  </Badge>
                )}
                {variant && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 capitalize">
                    {variant.replace('_',' ')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activePlayers.length} Players
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {spectatorCount} Spectators
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDuration(gameDuration)}
                </span>
              </div>

              {/* Pot removed for cleaner spectator header */}

              {gameState.status === 'playing' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Play className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}

              {seatsAvailable && (
                <Link href={`/game/${encodeURIComponent(gameId)}?name=Guest`}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Join as Player
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D Table */}
            <Card>
              <CardContent className="p-0">
                <DynamicRoundTable3D
                  gameState={gameState}
                  currentPlayerId="" // Empty for spectator
                  gameId={gameId}
                  hidePot={true}
                />
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Game Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {gameState.roundNumber}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Round
                    </div>
                  </div>
                  {/* Pot and Current Bet removed in spectator info */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {activePlayers.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Active Players
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Player List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      player.id === gameState.currentTurn
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        player.isActive && !player.hasFolded
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span>{player.name}</span>
                          {hostId === player.id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 border">
                              Host
                            </span>
                          )}
                          {admins.includes(player.id) && hostId !== player.id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {player.hasSeen ? 'Seen' : 'Blind'}
                        </div>
                      </div>
                    </div>
                    {player.id === gameState.currentTurn && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        Turn
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            

            {/* Chat (Read-only for spectators) */}
            <Card>
              <CardHeader>
                <CardTitle>Game Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Spectators can watch but not chat</p>
                  <p className="text-sm mt-1">Join the game to participate!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

        {/* Global Notifications */}
        <GlobalNotificationFeed
          notifications={globalNotifications}
        />

      {/* Side Show Components */}
      <SideShowIndicator
        challenge={sideShowChallenge}
        players={gameState.players}
      />
    </div>
  );
}
