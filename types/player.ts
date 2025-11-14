export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
  rank: number;
  winRate: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  gamesWon: number;
  totalWinnings: number;
  winRate: number;
}

