export interface GameHistory {
  id: string;
  gameId: string;
  players: PlayerGameStats[];
  winner: string;
  pot: number;
  timestamp: Date;
  duration?: number;
}

export interface PlayerGameStats {
  id: string;
  name: string;
  initialChips: number;
  finalChips: number;
  profit: number; // finalChips - initialChips
  handsPlayed: number;
  folds: number;
  wins: number;
}

export interface PlayerTotalStats {
  playerId: string;
  playerName: string;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalProfit: number; // in chips
  winRate: number; // percentage
}

export interface MoneySettlement {
  chipValue: number; // e.g., 1 chip = Rs. 1
  settlements: Settlement[];
  totalMoneyInvolved: number;
}

export interface Settlement {
  from: string; // player name
  to: string; // player name
  amount: number; // in real money
  chips: number; // equivalent chips
  status: 'pending' | 'paid' | 'cancelled';
}

export interface GameSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  players: string[]; // player IDs
  games: GameHistory[];
  chipValue: number; // Rs. per chip
  totalGames: number;
}

