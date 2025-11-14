'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Medal, Award, Crown, TrendingUp, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  email?: string;
  image?: string | null;
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
  totalLosses: number;
  winRate: number;
  lastPlayed: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [session]);

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const response = await fetch('/api/leaderboard?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data);

      // Find current user's rank if logged in
      if (session?.user?.id) {
        const userEntry = data.find((entry: LeaderboardEntry) => entry.id === session.user.id);
        if (userEntry) {
          setCurrentUserRank(userEntry.rank);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Could not load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" fill="currentColor" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-white/50 text-lg font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 border-orange-300';
    if (rank <= 10) return 'bg-gradient-to-r from-purple-500 to-purple-700 border-purple-400';
    return 'bg-white/10 border-white/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-12 w-40 bg-white/10 animate-pulse rounded" />
          <div className="h-28 bg-white/10 animate-pulse rounded" />
          <div className="h-10 w-80 bg-white/10 animate-pulse rounded" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/10 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-3 sm:p-4 md:p-8">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl top-10 left-1/4 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl top-1/2 right-1/4 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl bottom-10 left-1/2 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          {currentUserRank && (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
              <span className="text-white/70 text-sm mr-2">Your Rank:</span>
              <span className="text-white font-bold text-lg">#{currentUserRank}</span>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-400/40 text-white rounded p-3 flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={fetchLeaderboard} className="bg-white/20 hover:bg-white/30">Retry</Button>
          </div>
        )}

        {/* Title Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-10 h-10 text-yellow-400" />
              <CardTitle className="text-4xl text-white">Global Leaderboard</CardTitle>
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
            <CardDescription className="text-white/70 text-lg">
              Top {leaderboard.length} players ranked by total winnings
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search */}
        <div className="mb-4 flex justify-end">
          <div className="w-full sm:w-80">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player by name..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
            {/* 2nd Place */}
            <Card className="bg-gradient-to-br from-gray-300/20 to-gray-500/20 backdrop-blur-lg border-gray-300/30 mt-8">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Medal className="w-12 h-12 text-gray-400" />
                </div>
                <div className="text-6xl mb-2">🥈</div>
                {leaderboard[1].image ? (
                  <img
                    src={leaderboard[1].image}
                    alt={leaderboard[1].name}
                    className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-gray-300"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-300">
                    {leaderboard[1].name.charAt(0)}
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{leaderboard[1].name}</h3>
                <p className="text-yellow-400 font-bold text-xl mb-2">
                  🪙 {leaderboard[1].totalWinnings.toLocaleString()}
                </p>
                <div className="text-white/60 text-sm">
                  <div>{leaderboard[1].gamesWon} wins</div>
                  <div>{leaderboard[1].winRate}% win rate</div>
                </div>
              </CardContent>
            </Card>

            {/* 1st Place */}
            <Card className="bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 backdrop-blur-lg border-yellow-300/50">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Crown className="w-16 h-16 text-yellow-400 animate-pulse" fill="currentColor" />
                </div>
                <div className="text-7xl mb-2">🏆</div>
                {leaderboard[0].image ? (
                  <img
                    src={leaderboard[0].image}
                    alt={leaderboard[0].name}
                    className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-yellow-400 shadow-lg shadow-yellow-400/50"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold border-4 border-yellow-400 shadow-lg shadow-yellow-400/50">
                    {leaderboard[0].name.charAt(0)}
                  </div>
                )}
                <h3 className="text-white font-bold text-2xl mb-1">{leaderboard[0].name}</h3>
                <p className="text-yellow-300 font-bold text-2xl mb-2">
                  🪙 {leaderboard[0].totalWinnings.toLocaleString()}
                </p>
                <div className="text-white/70 text-sm">
                  <div className="font-semibold">{leaderboard[0].gamesWon} wins</div>
                  <div>{leaderboard[0].winRate}% win rate</div>
                </div>
              </CardContent>
            </Card>

            {/* 3rd Place */}
            <Card className="bg-gradient-to-br from-orange-400/20 to-orange-600/20 backdrop-blur-lg border-orange-400/30 mt-8">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <Medal className="w-12 h-12 text-orange-600" />
                </div>
                <div className="text-6xl mb-2">🥉</div>
                {leaderboard[2].image ? (
                  <img
                    src={leaderboard[2].image}
                    alt={leaderboard[2].name}
                    className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-orange-400"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold border-4 border-orange-400">
                    {leaderboard[2].name.charAt(0)}
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{leaderboard[2].name}</h3>
                <p className="text-yellow-400 font-bold text-xl mb-2">
                  🪙 {leaderboard[2].totalWinnings.toLocaleString()}
                </p>
                <div className="text-white/60 text-sm">
                  <div>{leaderboard[2].gamesWon} wins</div>
                  <div>{leaderboard[2].winRate}% win rate</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Leaderboard List */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              <Award className="w-6 h-6 text-purple-400" />
              Full Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map((player) => {
                const isCurrentUser = session?.user?.id === player.id;
                const netWinnings = player.totalWinnings - player.totalLosses;
                
                return (
                  <div
                    key={player.id}
                    className={`
                      flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all
                      ${isCurrentUser 
                        ? 'bg-blue-500/30 border-2 border-blue-400 shadow-lg shadow-blue-400/30' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }
                    `}
                  >
                    {/* Rank */}
                    <div className={`
                      w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg border-2
                      ${getRankBadgeColor(player.rank)}
                    `}>
                      {getRankIcon(player.rank)}
                    </div>

                    {/* Avatar with presence dot */}
                    <div className="relative">
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={player.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold border-2 border-white/30">
                          {player.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-white" title="Online" />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-base sm:text-lg">
                          {player.name}
                        </h3>
                        {isCurrentUser && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-white/60 text-xs sm:text-sm">
                        {player.gamesPlayed} games • {player.gamesWon} wins • {player.winRate}% win rate
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold text-base sm:text-xl mb-1">
                        🪙 {player.totalWinnings.toLocaleString()}
                      </div>
                      <div className={`text-xs sm:text-sm font-semibold ${netWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {netWinnings >= 0 ? '+' : ''}{netWinnings.toLocaleString()} net
                      </div>
                    </div>

                    {/* Trending */}
                    {player.rank <= 10 && (
                      <div className="text-green-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            <Trophy className="mr-2 h-5 w-5" />
            Play & Climb Ranks
          </Button>
          {session && (
            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-6 text-lg"
            >
              <Star className="mr-2 h-5 w-5" />
              View My Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

