'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Trophy, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Eye,
  EyeOff,
  XCircle,
  CheckCircle,
  Calendar,
  Coins,
  Share2,
  Copy
} from 'lucide-react';

interface GameHistoryEntry {
  id: string;
  status: string;
  pot: number;
  winnerId: string;
  createdAt: number;
  finishedAt: number;
  duration: number;
  playerResult: {
    won: boolean;
    chips: number;
    chipsChange: number;
    hasSeen: boolean;
    hasFolded: boolean;
  };
  players: Array<{
    id: string;
    name: string;
    chips: number;
    hasFolded: boolean;
    hasSeen: boolean;
  }>;
  lastActions: Array<{
    action: string;
    playerId: string;
    amount: number | null;
  }>;
}

export default function GameHistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    totalWinnings: 0,
    totalLosses: 0,
  });
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/games/history');
      return;
    }

    if (session?.user?.id) {
      fetchGameHistory(session.user.id);
    }
  }, [session, status, router]);

  const fetchGameHistory = async (playerId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/games/history?playerId=${playerId}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch game history');
      }
      
      const data = await response.json();
      setHistory(data);

      // Calculate stats
      const wins = data.filter((g: GameHistoryEntry) => g.playerResult.won).length;
      const losses = data.length - wins;
      const totalWinnings = data
        .filter((g: GameHistoryEntry) => g.playerResult.chipsChange > 0)
        .reduce((sum: number, g: GameHistoryEntry) => sum + g.playerResult.chipsChange, 0);
      const totalLosses = Math.abs(data
        .filter((g: GameHistoryEntry) => g.playerResult.chipsChange < 0)
        .reduce((sum: number, g: GameHistoryEntry) => sum + g.playerResult.chipsChange, 0));

      setStats({
        totalGames: data.length,
        wins,
        losses,
        totalWinnings,
        totalLosses,
      });
    } catch (error) {
      console.error('Error fetching game history:', error);
      setError('Could not load game history.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const relativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp * 1000;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-12 w-40 bg-white/10 animate-pulse rounded" />
          <div className="h-28 bg-white/10 animate-pulse rounded" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/10 animate-pulse rounded" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/10 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-3 sm:p-4 md:p-8">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl top-1/2 left-1/2 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6 md:mb-8">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-400/40 text-white rounded p-3 flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={() => session?.user?.id && fetchGameHistory(session.user.id)} className="bg-white/20 hover:bg-white/30">Retry</Button>
          </div>
        )}

        {/* Title */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-blue-400" />
              <CardTitle className="text-3xl text-white">Game History</CardTitle>
            </div>
            <CardDescription className="text-white/70 text-lg">
              Your last {history.length} games
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Total Games</p>
              <p className="text-white text-2xl font-bold">{stats.totalGames}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Wins</p>
              <p className="text-green-400 text-2xl font-bold">{stats.wins}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Losses</p>
              <p className="text-red-400 text-2xl font-bold">{stats.losses}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Total Won</p>
              <p className="text-green-400 text-xl font-bold">+{stats.totalWinnings}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4 text-center">
              <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Total Lost</p>
              <p className="text-red-400 text-xl font-bold">-{stats.totalLosses}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            className={`${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white border-white/20'}`}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'wins' ? 'default' : 'outline'}
            className={`${filter === 'wins' ? 'bg-green-600 text-white' : 'bg-white/10 text-white border-white/20'}`}
            onClick={() => setFilter('wins')}
          >
            Wins
          </Button>
          <Button
            variant={filter === 'losses' ? 'default' : 'outline'}
            className={`${filter === 'losses' ? 'bg-red-600 text-white' : 'bg-white/10 text-white border-white/20'}`}
            onClick={() => setFilter('losses')}
          >
            Losses
          </Button>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {history.filter(g => filter === 'all' ? true : filter === 'wins' ? g.playerResult.won : !g.playerResult.won).map((game) => (
            <Card 
              key={game.id} 
              className={`
                bg-white/10 backdrop-blur-lg border-2 transition-all hover:scale-[1.01]
                ${game.playerResult.won 
                  ? 'border-green-400/50 shadow-lg shadow-green-400/20' 
                  : 'border-red-400/30'
                }
              `}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Result Badge */}
                  <div className="md:col-span-2">
                    <div className={`
                      text-center p-4 rounded-lg
                      ${game.playerResult.won 
                        ? 'bg-green-500/20 border-2 border-green-400' 
                        : 'bg-red-500/20 border-2 border-red-400'
                      }
                    `}>
                      {game.playerResult.won ? (
                        <>
                          <Trophy className="w-8 h-8 text-green-400 mx-auto mb-1" />
                          <p className="text-green-400 font-bold text-lg">WIN</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-1" />
                          <p className="text-red-400 font-bold text-lg">LOSS</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="md:col-span-6 space-y-2">
                    {/* Date & Duration */}
                    <div className="flex items-center gap-4 text-white/70">
                      <div className="flex items-center gap-1" title={formatDate(game.createdAt)}>
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{relativeTime(game.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDuration(game.duration)}</span>
                      </div>
                    </div>

                    {/* Players */}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-white/70" />
                      <div className="flex gap-2 flex-wrap">
                        {game.players.map((player, idx) => (
                          <div 
                            key={player.id} 
                            className={`
                              px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1
                              ${player.id === session?.user?.id 
                                ? 'bg-blue-500/30 text-blue-200 border border-blue-400' 
                                : 'bg-white/10 text-white/80'
                              }
                            `}
                          >
                            {player.name}
                            {player.hasFolded && <XCircle className="w-3 h-3" />}
                            {player.hasSeen ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Your Actions */}
                    <div className="flex gap-2 text-xs">
                      {game.playerResult.hasSeen ? (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded">
                          👁️ Seen
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                          🔒 Blind
                        </span>
                      )}
                      {game.playerResult.hasFolded && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">
                          ❌ Folded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chips Result + Share/Copy */}
                  <div className="md:col-span-4 text-right">
                    <div className="space-y-2">
                      {/* Pot */}
                      <div className="flex items-center justify-end gap-2">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/70 text-sm">Pot:</span>
                        <span className="text-yellow-400 font-bold">{game.pot}</span>
                      </div>

                      {/* Change */}
                      <div className={`
                        text-2xl font-bold
                        ${game.playerResult.chipsChange >= 0 ? 'text-green-400' : 'text-red-400'}
                      `}>
                        {game.playerResult.chipsChange >= 0 ? '+' : ''}{game.playerResult.chipsChange}
                      </div>

                      {/* Final Chips */}
                      <div className="text-white/70 text-sm">
                        Final: {game.playerResult.chips} chips
                      </div>
                      {/* Share & Copy */}
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          className="h-8 px-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                          onClick={async () => {
                            try {
                              const url = `${location.origin}/game/${game.id}`;
                              await navigator.clipboard.writeText(url);
                              const a = await import('sonner'); a.toast.success('Link copied');
                            } catch {}
                          }}
                          title="Copy game link"
                        >
                          <Share2 className="w-3.5 h-3.5 mr-1" /> Link
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 px-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                          onClick={async () => { try { await navigator.clipboard.writeText(game.id); const a = await import('sonner'); a.toast.success('Game ID copied'); } catch {} }}
                          title="Copy Game ID"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> ID
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {history.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 text-lg mb-2">No games played yet</p>
                <p className="text-white/50 mb-6">Start playing to build your game history!</p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Play Your First Game
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            <Trophy className="mr-2 h-5 w-5" />
            Play New Game
          </Button>
          <Button
            onClick={() => router.push('/leaderboard')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-6 text-lg"
          >
            <Trophy className="mr-2 h-5 w-5" />
            View Leaderboard
          </Button>
          <Button
            onClick={() => router.push('/profile')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-6 text-lg"
          >
            <Users className="mr-2 h-5 w-5" />
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

