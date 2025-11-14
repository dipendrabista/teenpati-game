import { Card, Suit, Rank, HandRank, HandRanking } from '@/types/game';

const rankValues: Record<Rank, number> = {
  'A': 14,
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

// Create a standard 52-card deck
export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
      });
    }
  }
  
  return shuffleDeck(deck);
}

// Shuffle deck using Fisher-Yates algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal 3 cards to each player
export function dealCards(deck: Card[], playerCount: number): { hands: Card[][], remainingDeck: Card[] } {
  const hands: Card[][] = [];
  let currentDeck = [...deck];
  
  for (let i = 0; i < playerCount; i++) {
    hands.push(currentDeck.splice(0, 3));
  }
  
  return { hands, remainingDeck: currentDeck };
}

// Check if cards form a trail (three of a kind)
function isTrail(cards: Card[]): boolean {
  return cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}

// Check if cards form a pure sequence (straight flush)
function isPureSequence(cards: Card[]): boolean {
  const sameSuit = cards.every(card => card.suit === cards[0].suit);
  if (!sameSuit) return false;
  return isSequence(cards);
}

// Check if cards form a sequence (straight)
function isSequence(cards: Card[]): boolean {
  const values = cards.map(card => rankValues[card.rank]).sort((a, b) => a - b);
  
  // Check normal sequence
  if (values[0] + 1 === values[1] && values[1] + 1 === values[2]) {
    return true;
  }
  
  // Check A-2-3 sequence
  if (values[0] === 2 && values[1] === 3 && values[2] === 14) {
    return true;
  }
  
  return false;
}

// Check if cards are all same suit (color/flush)
function isColor(cards: Card[]): boolean {
  return cards.every(card => card.suit === cards[0].suit);
}

// Check if cards form a pair
function isPair(cards: Card[]): boolean {
  return cards[0].rank === cards[1].rank || 
         cards[1].rank === cards[2].rank || 
         cards[0].rank === cards[2].rank;
}

// Get the numeric value for comparison
function getHandValue(cards: Card[], handRank: HandRank): number {
  const values = cards.map(card => rankValues[card.rank]).sort((a, b) => b - a);
  
  switch (handRank) {
    case 'trail':
      // Base: 10000 + card value * 100
      return 10000 + rankValues[cards[0].rank] * 100;
    
    case 'pure_sequence':
      // Base: 9000 + high card value
      if (values[0] === 14 && values[1] === 3 && values[2] === 2) {
        // A-2-3 is the highest pure sequence
        return 9000 + 1000;
      }
      return 9000 + values[0];
    
    case 'sequence':
      // Base: 8000 + high card value
      if (values[0] === 14 && values[1] === 3 && values[2] === 2) {
        // A-2-3 is the highest sequence
        return 8000 + 1000;
      }
      return 8000 + values[0];
    
    case 'color':
      // Base: 7000 + high card
      return 7000 + values[0] * 100 + values[1] * 10 + values[2];
    
    case 'pair': {
      // Base: 6000 + pair value * 100 + kicker
      const pairValue = cards.find((card, i) => 
        cards.findIndex(c => c.rank === card.rank) !== i
      );
      const pairRank = pairValue ? rankValues[pairValue.rank] : 0;
      const kicker = values.find(v => v !== pairRank) || 0;
      return 6000 + pairRank * 100 + kicker;
    }
    
    case 'high_card':
      // Base: 0 + high card combination
      return values[0] * 100 + values[1] * 10 + values[2];
    
    default:
      return 0;
  }
}

// Evaluate hand and return ranking
export function evaluateHand(cards: Card[]): HandRanking {
  if (cards.length !== 3) {
    throw new Error('Teen Pati hands must have exactly 3 cards');
  }
  
  let rank: HandRank;
  let description: string;
  
  if (isTrail(cards)) {
    rank = 'trail';
    description = `Trail (${cards[0].rank}-${cards[1].rank}-${cards[2].rank})`;
  } else if (isPureSequence(cards)) {
    rank = 'pure_sequence';
    description = 'Pure Sequence';
  } else if (isSequence(cards)) {
    rank = 'sequence';
    description = 'Sequence';
  } else if (isColor(cards)) {
    rank = 'color';
    description = 'Color';
  } else if (isPair(cards)) {
    rank = 'pair';
    const pairCard = cards.find((card, i) => 
      cards.findIndex(c => c.rank === card.rank) !== i
    );
    description = `Pair (${pairCard?.rank})`;
  } else {
    rank = 'high_card';
    const highCard = cards.reduce((max, card) => 
      rankValues[card.rank] > rankValues[max.rank] ? card : max
    );
    description = `High Card (${highCard.rank})`;
  }
  
  const value = getHandValue(cards, rank);
  
  return { rank, value, description };
}

// Compare two hands and return 1 if hand1 wins, -1 if hand2 wins, 0 if tie
export function compareHands(cards1: Card[], cards2: Card[]): number {
  const hand1 = evaluateHand(cards1);
  const hand2 = evaluateHand(cards2);
  
  if (hand1.value > hand2.value) return 1;
  if (hand1.value < hand2.value) return -1;
  return 0;
}

// Find the winner among multiple hands
export function findWinner(hands: { playerId: string; cards: Card[] }[]): string {
  let winner = hands[0];
  let bestHand = evaluateHand(hands[0].cards);
  
  for (let i = 1; i < hands.length; i++) {
    const currentHand = evaluateHand(hands[i].cards);
    if (currentHand.value > bestHand.value) {
      winner = hands[i];
      bestHand = currentHand;
    }
  }
  
  return winner.playerId;
}

// Calculate bet amount based on blind/seen status
export function calculateBetAmount(currentBet: number, hasSeen: boolean, multiplier: number = 1): number {
  // Blind players bet half, seen players bet full
  const baseBet = hasSeen ? currentBet : currentBet / 2;
  return baseBet * multiplier;
}

// Check if a player can request sideshow
export function canRequestSideshow(
  requestingPlayerHasSeen: boolean,
  targetPlayerHasSeen: boolean,
  requestingPlayerIndex: number,
  targetPlayerIndex: number
): boolean {
  // Both players must have seen their cards
  if (!requestingPlayerHasSeen || !targetPlayerHasSeen) return false;
  
  // Target must be the previous player
  return (requestingPlayerIndex - 1 + 3) % 3 === targetPlayerIndex;
}

