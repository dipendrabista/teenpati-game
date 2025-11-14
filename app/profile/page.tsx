'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Gamepad2, TrendingUp, TrendingDown, Award, Star } from 'lucide-react';

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
  totalLosses: number;
  winRate: number;
  lastPlayed: string;
}

interface GameHistoryItem {
  id: string;
  status: string;
  pot: number;
  winnerId: string | null;
  createdAt: number;
  finishedAt: number | null;
  duration: number;
  playerResult: {
    won: boolean;
    chips: number;
    chipsChange: number;
    hasSeen: boolean;
    hasFolded: boolean;
  };
  players: Array<{ id: string; name: string }>;
  lastActions: Array<{ action: string; playerId: string; playerName: string; amount?: number; timestamp: number }>;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentGames, setRecentGames] = useState<GameHistoryItem[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to signin if not authenticated
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }

    if (session?.user?.id) {
      // Fetch player stats from API
      fetchPlayerStats(session.user.id);
      fetchRecentGames(session.user.id);
    }
  }, [session, status, router]);

  const fetchPlayerStats = async (playerId: string) => {
    try {
      const response = await fetch('/api/player/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats({
        gamesPlayed: data.gamesPlayed,
        gamesWon: data.gamesWon,
        totalWinnings: data.totalWinnings,
        totalLosses: data.totalLosses,
        winRate: data.winRate,
        lastPlayed: data.lastPlayed
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to default values
      setStats({
        gamesPlayed: 0,
        gamesWon: 0,
        totalWinnings: 0,
        totalLosses: 0,
        winRate: 0,
        lastPlayed: 'Never'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentGames = async (playerId: string) => {
    try {
      const response = await fetch(`/api/games/history?limit=10`);
      if (!response.ok) throw new Error('Failed to fetch game history');
      const data = await response.json();
      setRecentGames(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('No recent games found or failed to load.');
      setRecentGames([]);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-12 w-40 bg-white/10 animate-pulse rounded" />
          <div className="h-28 bg-white/10 animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-white/10 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const netWinnings = stats ? stats.totalWinnings - stats.totalLosses : 0;
  const isProfit = netWinnings >= 0;

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

        {/* Profile Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              {/* Profile Picture with presence dot */}
              <div className="relative">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl font-bold border-4 border-white/30 shadow-lg">
                    {session.user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white" title="Online" />
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <CardTitle className="text-2xl sm:text-3xl text-white mb-1 sm:mb-2">
                  {session.user.name || 'Player'}
                </CardTitle>
                <CardDescription className="text-white/70 text-sm sm:text-lg">
                  {session.user.email}
                </CardDescription>
                {/* Copy user ID */}
                {session.user.id && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={async () => { try { await navigator.clipboard.writeText(session.user.id as string); const a = await import('sonner'); a.toast.success('User ID copied'); } catch {} }}
                      className="text-[11px] px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white hover:bg-white/20"
                      title="Copy User ID"
                    >
                      Copy ID
                    </button>
                  </div>
                )}
                {stats && (
                  <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      <span className="text-yellow-400 font-semibold">
                        Level {Math.floor(stats.gamesPlayed / 10) + 1}
                      </span>
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm">
                      Last played: {stats.lastPlayed}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Games Played */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Gamepad2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Games Played</p>
                  <p className="text-white text-2xl font-bold">{stats?.gamesPlayed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Games Won */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Games Won</p>
                  <p className="text-white text-2xl font-bold">{stats?.gamesWon || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Win Rate</p>
                  <p className="text-white text-2xl font-bold">{stats?.winRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Winnings */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${isProfit ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {isProfit ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-white/70 text-sm">Net Winnings</p>
                  <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{netWinnings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Detailed Statistics</CardTitle>
            <CardDescription className="text-white/70">
              Your complete gaming performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Winnings */}
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Total Winnings</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-400">
                  +{stats?.totalWinnings || 0} chips
                </p>
              </div>

              {/* Total Losses */}
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Total Losses</span>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-400">
                  -{stats?.totalLosses || 0} chips
                </p>
              </div>

              {/* Games Lost */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <span className="text-white/70">Games Lost</span>
                <p className="text-xl font-bold text-white mt-1">
                  {stats ? stats.gamesPlayed - stats.gamesWon : 0}
                </p>
              </div>

              {/* Average Win */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <span className="text-white/70">Average Win</span>
                <p className="text-xl font-bold text-white mt-1">
                  {stats && stats.gamesWon > 0 
                    ? Math.round(stats.totalWinnings / stats.gamesWon)
                    : 0} chips
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Games (database-driven) */}
        <Card className="mt-6 bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Games</CardTitle>
            <CardDescription className="text-white/70">
              Last 10 games from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentGames.length === 0 ? (
              <div className="text-white/70 text-sm">No recent games yet.</div>
            ) : (
              <div className="space-y-3">
                {recentGames.map((g) => {
                  const started = g.createdAt ? new Date(g.createdAt * 1000).toLocaleString() : '-';
                  const finished = g.finishedAt ? new Date(g.finishedAt * 1000).toLocaleString() : '-';
                  const me = g.playerResult;
                  return (
                    <div key={g.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">{g.status}</span>
                          <span className="text-white font-semibold">Game</span>
                          <code className="text-[11px] text-white/60">{g.id}</code>
                        </div>
                        <div className="text-xs text-white/60 whitespace-nowrap">{started}</div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-white/80">
                        <div>Pot: <span className="font-semibold text-white">{g.pot}</span></div>
                        <div>Result: <span className={`font-semibold ${me.won ? 'text-green-400' : 'text-red-400'}`}>
                          {me.won ? `Won (+${me.chipsChange})` : `Lost (${me.chipsChange})`}
                        </span></div>
                        <div>Duration: <span className="font-semibold text-white">{g.duration ? `${Math.round(g.duration/60)} min` : '-'}</span></div>
                        <div className="truncate">Players: <span className="font-semibold text-white">
                          {g.players.map(p => p.name).join(', ')}
                        </span></div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs bg-white/10 text-white border-white/20 hover:bg-white/20"
                          onClick={() => window.open(`/api/games/${encodeURIComponent(g.id)}/report`, '_blank')}
                          title="Open raw database report (JSON)"
                        >
                          Open Report (JSON)
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => router.push(`/game/${encodeURIComponent(g.id)}/spectate`)}
                          title="Spectate this game (if live)"
                        >
                          Spectate
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            <Gamepad2 className="mr-2 h-5 w-5" />
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
        </div>
      </div>
    </div>
  );
}
