// Game Variants for Teen Patti
export interface GameVariant {
  id: string;
  name: string;
  description: string;
  rules: {
    maxPlayers: number;
    minBet: number;
    maxBet?: number;
    bootAmount: number;
    sideShowAllowed: boolean;
    wildCards?: boolean;
    jokers?: boolean;
    timeLimit?: number; // seconds per turn
    specialRules?: string[];
  };
  scoring: {
    trail: number;
    pureSequence: number;
    sequence: number;
    color: number;
    pair: number;
    highCard: number;
  };
  features: string[];
}

// Predefined game variants
export const GAME_VARIANTS: Record<string, GameVariant> = {
  classic: {
    id: 'classic',
    name: 'Classic Teen Patti',
    description: 'Traditional 3-player Teen Patti with standard rules',
    rules: {
      maxPlayers: 3,
      minBet: 10,
      bootAmount: 10,
      sideShowAllowed: true,
      specialRules: [
        '3 players maximum',
        'Standard betting rounds',
        'Side show available when 2 players remain'
      ]
    },
    scoring: {
      trail: 9000,
      pureSequence: 8000,
      sequence: 7000,
      color: 6000,
      pair: 5000,
      highCard: 1000
    },
    features: ['Side Show', 'Standard Betting', '3 Players']
  },

  ak47: {
    id: 'ak47',
    name: 'AK47 Wild',
    description: 'Aces, Kings, 4s and 7s are wild cards!',
    rules: {
      maxPlayers: 5,
      minBet: 5,
      bootAmount: 5,
      sideShowAllowed: false,
      wildCards: true,
      specialRules: [
        'Aces, Kings, 4s and 7s are wild',
        'Up to 5 players',
        'No side shows',
        'Faster gameplay'
      ]
    },
    scoring: {
      trail: 9000,
      pureSequence: 8000,
      sequence: 7000,
      color: 6000,
      pair: 5000,
      highCard: 1000
    },
    features: ['Wild Cards (A,K,4,7)', 'Up to 5 Players', 'Fast Paced']
  },

  muflis: {
    id: 'muflis',
    name: 'Muflis',
    description: 'Low stakes game for beginners',
    rules: {
      maxPlayers: 6,
      minBet: 1,
      bootAmount: 1,
      sideShowAllowed: true,
      timeLimit: 30,
      specialRules: [
        'Very low stakes',
        'Up to 6 players',
        '30 second turn limit',
        'Perfect for beginners'
      ]
    },
    scoring: {
      trail: 9000,
      pureSequence: 8000,
      sequence: 7000,
      color: 6000,
      pair: 5000,
      highCard: 1000
    },
    features: ['Low Stakes', 'Up to 6 Players', 'Time Limits', 'Beginner Friendly']
  },

  highroller: {
    id: 'highroller',
    name: 'High Roller',
    description: 'High stakes game for serious players',
    rules: {
      maxPlayers: 3,
      minBet: 100,
      maxBet: 10000,
      bootAmount: 100,
      sideShowAllowed: true,
      timeLimit: 60,
      specialRules: [
        'High stakes betting',
        'Maximum bet limit',
        '60 second turn limit',
        'For experienced players only'
      ]
    },
    scoring: {
      trail: 9000,
      pureSequence: 8000,
      sequence: 7000,
      color: 6000,
      pair: 5000,
      highCard: 1000
    },
    features: ['High Stakes', 'Bet Limits', '60s Turns', 'VIP Only']
  },

  turbo: {
    id: 'turbo',
    name: 'Turbo Mode',
    description: 'Fast-paced game with quick decisions',
    rules: {
      maxPlayers: 4,
      minBet: 20,
      bootAmount: 20,
      sideShowAllowed: false,
      timeLimit: 15,
      specialRules: [
        '15 second turn limit',
        'No side shows',
        'Quick betting rounds',
        'For fast players'
      ]
    },
    scoring: {
      trail: 9000,
      pureSequence: 8000,
      sequence: 7000,
      color: 6000,
      pair: 5000,
      highCard: 1000
    },
    features: ['15s Turns', 'No Side Shows', 'Fast Paced', 'Quick Rounds']
  },

  joker: {
    id: 'joker',
    name: 'Joker Wild',
    description: 'Jokers are wild cards that can be anything!',
    rules: {
      maxPlayers: 4,
      minBet: 15,
      bootAmount: 15,
      sideShowAllowed: true,
      jokers: true,
      specialRules: [
        'Jokers are completely wild',
        'Can represent any card',
        'More unpredictable gameplay',
        'Great for variety'
      ]
    },
    scoring: {
      trail: 9000,
      pureSequence: 8000,
      sequence: 7000,
      color: 6000,
      pair: 5000,
      highCard: 1000
    },
    features: ['Wild Jokers', 'Unpredictable', '4 Players Max', 'Fun Variant']
  }
};

// Default variant
export const DEFAULT_VARIANT = GAME_VARIANTS.classic;

// Get variant by ID
export function getVariantById(id: string): GameVariant {
  return GAME_VARIANTS[id] || DEFAULT_VARIANT;
}

// Get all available variants
export function getAllVariants(): GameVariant[] {
  return Object.values(GAME_VARIANTS);
}

// Check if variant supports side show
export function supportsSideShow(variantId: string): boolean {
  return getVariantById(variantId).rules.sideShowAllowed;
}

// Get scoring system for variant
export function getVariantScoring(variantId: string) {
  return getVariantById(variantId).scoring;
}

// Check if variant has wild cards
export function hasWildCards(variantId: string): boolean {
  return getVariantById(variantId).rules.wildCards || false;
}

// Check if variant has jokers
export function hasJokers(variantId: string): boolean {
  return getVariantById(variantId).rules.jokers || false;
}

// Get time limit for variant
export function getTimeLimit(variantId: string): number | undefined {
  return getVariantById(variantId).rules.timeLimit;
}
