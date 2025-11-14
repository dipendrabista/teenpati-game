// API utilities for fetching player stats and leaderboard

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3003';

export interface PlayerStatsResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    gamesPlayed: number;
    gamesWon: number;
    totalWinnings: number;
    totalLosses: number;
    winRate: number;
    lastPlayed: string;
  };
}

export interface LeaderboardResponse {
  success: boolean;
  data: Array<{
    rank: number;
    id: string;
    name: string;
    gamesPlayed: number;
    gamesWon: number;
    totalWinnings: number;
    winRate: number;
  }>;
  totalPlayers: number;
}

export interface StatsSummaryResponse {
  success: boolean;
  data: {
    totalPlayers: number;
    totalGames: number;
    activeGames: number;
  };
}

export async function fetchLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      success: false,
      data: [],
      totalPlayers: 0,
    };
  }
}

export async function fetchPlayerStats(playerId: string): Promise<PlayerStatsResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/player-stats/${playerId}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

export async function fetchStatsSummary(): Promise<StatsSummaryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats-summary`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats summary');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    return {
      success: false,
      data: {
        totalPlayers: 0,
        totalGames: 0,
        activeGames: 0,
      },
    };
  }
}

