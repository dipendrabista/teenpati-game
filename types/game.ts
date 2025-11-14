export type PlayerId = string;
export type GameId = string;

// Card types for Teen Pati
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
  value?: number; // For card ranking/comparison
}

// Teen Pati hand rankings (highest to lowest)
export type HandRank = 
  | 'trail'         // Three of a kind (e.g., AAA, KKK)
  | 'pure_sequence' // Straight flush (e.g., A-K-Q of same suit)
  | 'sequence'      // Straight (e.g., A-K-Q of different suits)
  | 'color'         // Flush (all same suit)
  | 'pair'          // Two cards same rank
  | 'high_card';    // No combination

export interface HandRanking {
  rank: HandRank;
  value: number; // For comparison
  description: string;
}

export interface Player {
  id: PlayerId;
  name: string;
  avatar?: string;
  chips: number;
  initialChips?: number; // Starting chip count
  isReady: boolean;
  position: number; // seat index starting at 1
  cards: Card[];
  hasSeen: boolean;  // Whether player has seen their cards
  hasFolded: boolean;
  currentBet: number;
  totalBet: number;  // Total bet in this round
  isActive: boolean; // Still in the game
  isBot?: boolean;   // Optional bot flag
}

export interface GameState {
  id: GameId;
  players: Player[];
  currentTurn: PlayerId | null;
  status: 'waiting' | 'playing' | 'finished';
  winner: PlayerId | null;
  pot: number;           // Total money in the pot
  currentBet: number;    // Current bet amount
  minBet: number;        // Minimum bet (boot amount)
  roundNumber: number;
  deck: Card[];
  variant?: string;      // Game variant ID
  // Lobby/admin
  hostId?: PlayerId;     // Creator/primary admin
  admins?: PlayerId[];   // Additional admins
  tableName?: string;    // Group/table name
  maxPlayers?: number;   // Seats count
  botCount?: number;     // Number of bots pre-seated
  isPrivate?: boolean;   // Table privacy
  spectatorLimit?: number; // Max spectators allowed
  seats?: Array<{
    position: number;
    playerId?: PlayerId;
    isBot?: boolean;
  }>;
  lastAction?: {
    playerId: PlayerId;
    action: 'bet' | 'call' | 'raise' | 'fold' | 'show' | 'sideshow';
    amount?: number;
  };
  // Side show state
  sideShowChallenge?: {
    challenger: PlayerId;
    target: PlayerId;
    challengerCards: Card[];
    targetCards: Card[];
    timestamp: number;
  };
  sideShowResults?: {
    winner: PlayerId;
    loser: PlayerId;
    potSplit: number;
  };
  callActive?: boolean;
  // Optional rule toggles
  rulesRajkapoor135?: boolean;   // Treat 2-3-5 as highest sequence
  rulesDoubleSeq235?: boolean;   // Treat suited 2-3-5 as highest pure sequence
  rulesSpecial910Q?: boolean;    // Treat 9-10-Q as outranking sequences & pure sequences
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

export type PlayerAction = 
  | { type: 'SEE'; playerId: PlayerId }
  | { type: 'BET'; playerId: PlayerId; amount: number }
  | { type: 'CALL'; playerId: PlayerId }
  | { type: 'RAISE'; playerId: PlayerId; amount: number }
  | { type: 'FOLD'; playerId: PlayerId }
  | { type: 'SHOW'; playerId: PlayerId }
  | { type: 'SIDE_SHOW'; playerId: PlayerId; targetPlayerId: PlayerId }
  | { type: 'ACCEPT_SIDE_SHOW'; playerId: PlayerId }
  | { type: 'DECLINE_SIDE_SHOW'; playerId: PlayerId };

export type GameAction = 
  | { type: 'MOVE'; playerId: PlayerId; data: PlayerAction }
  | { type: 'READY'; playerId: PlayerId }
  | { type: 'LEAVE'; playerId: PlayerId };

export interface GameMessage {
  type: 'player_joined' | 'player_left' | 'game_started' | 'game_ended' | 'player_move' | 'round_end' | 'error';
  playerId?: PlayerId;
  data?: any;
  message?: string;
  timestamp: Date;
}

