const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const express = require('express');
const GameDatabase = require('./database/db');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Database
const db = new GameDatabase();
console.log('✓ Database initialized and ready');

// Game state management - now using database
const games = new Map(); // Keep in-memory cache for active games

// Helper functions - Now using database
function getPlayerStats(playerId, playerName) {
  let player = db.getPlayer(playerId);
  if (!player) {
    player = db.createOrUpdatePlayer(playerId, playerName);
  }
  return {
    id: player.id,
    name: player.name,
    gamesPlayed: player.games_played,
    gamesWon: player.games_won,
    totalWinnings: player.total_winnings,
    totalLosses: player.total_losses,
    lastPlayed: new Date(player.last_played * 1000),
  };
}

function updatePlayerStats(playerId, playerName, won, chipsChange) {
  db.createOrUpdatePlayer(playerId, playerName);
  db.updatePlayerStats(playerId, won, chipsChange);
}

function getLeaderboard(limit = 50) {
  const allStats = db.getLeaderboard(limit);
  
  return allStats.map((stat, index) => ({
    rank: index + 1,
    id: stat.id,
    name: stat.name,
    gamesPlayed: stat.games_played,
    gamesWon: stat.games_won,
    totalWinnings: stat.total_winnings,
    winRate: stat.games_played > 0 ? Math.round((stat.games_won / stat.games_played) * 100) : 0,
  }));
}

// Game class - Now with database persistence
class TeenPatiGame {
  constructor(gameId, minBet = 10, variant = 'classic', skipDbCreate = false) {
    this.id = gameId;
    this.players = [];
    this.currentTurn = null;
    this.status = 'waiting';
    this.winner = null;
    this.pot = 0;
    this.currentBet = minBet;
    this.minBet = minBet;
    this.roundNumber = 1;
    this.deck = [];
    this.variant = variant;
    // Config: allow blind SHOW after N rounds (default 3)
    this.minShowRounds = 3;
    this.createdAt = new Date();
    this.callActive = false;
    this.botTimer = null;
    // Lobby/admin
    this.hostId = null;
    this.admins = [];
    this.tableName = null;
    this.maxPlayers = 3;
    this.botCount = 0;
    this.seats = []; // { position, playerId?, isBot? }
    this.isPrivate = true;
    this.spectatorLimit = 20;
    this.spectatorCount = 0;
    // Optional rules
    this.rulesRajkapoor135 = false;   // 2-3-5 ranks highest among sequences
    this.rulesDoubleSeq235 = false;   // suited 2-3-5 ranks highest among pure sequences
    this.rulesSpecial910Q = false;    // 9-10-Q outranks sequences and pure sequences

    // Side show state
    this.sideShowChallenge = null; // { challenger: playerId, target: playerId, challengerCards: [], targetCards: [] }
    this.sideShowResults = null; // { winner: playerId, loser: playerId, potSplit: number }

    // Turn timer
    this.turnTimer = null;
    this.turnTimeout = 60; // seconds
    this.turnStartTime = null;

    // Create game in database (skip if loading from database)
    if (!skipDbCreate) {
      // Check if game already exists
      const existingGame = db.getGame(gameId);
      if (!existingGame) {
        db.createGame(gameId, minBet, variant);
        console.log(`✓ Game ${gameId} created in database with variant: ${variant}`);
      } else {
        console.log(`ℹ️ Game ${gameId} already exists in database, skipping creation`);
      }
    }
  }
  
  // Save current game state to database
  saveToDatabase() {
    db.updateGame(this.id, {
      status: this.status,
      pot: this.pot,
      currentBet: this.currentBet,
      currentPlayerIndex: this.players.findIndex(p => p.id === this.currentTurn),
      winnerId: this.winner
    });
  }
  
  // Load game from database
  static loadFromDatabase(gameId) {
    const gameData = db.getGame(gameId);
    if (!gameData) return null;
    
    // Pass skipDbCreate=true to avoid duplicate insertion
    const game = new TeenPatiGame(gameId, gameData.minBet, gameData.variant || 'classic', true);
    game.status = gameData.status;
    game.pot = gameData.pot;
    game.currentBet = gameData.currentBet;
    game.players = gameData.players;
    game.winner = gameData.winnerId;
    game.tableName = gameData.name || null;
    game.hostId = gameData.hostId || null;
    game.maxPlayers = gameData.maxPlayers || 3;
    game.admins = gameData.admins || [];
    game.callActive = !!gameData.callActive;
    game.isPrivate = !!gameData.isPrivate;
    game.spectatorLimit = gameData.spectatorLimit || 20;
    game.rulesRajkapoor135 = !!gameData.rulesRajkapoor135;
    game.rulesDoubleSeq235 = !!gameData.rulesDoubleSeq235;
    game.rulesSpecial910Q = !!gameData.rulesSpecial910Q;
    // rebuild seats
    game.seats = Array.from({ length: game.maxPlayers }, (_, i) => ({ position: i + 1 }));
    game.players.forEach(p => {
      if (p.position >= 1 && p.position <= game.maxPlayers) {
        game.seats[p.position - 1].playerId = p.id;
        if (p.isBot) game.seats[p.position - 1].isBot = true;
      }
    });
    
    if (gameData.currentPlayerIndex >= 0 && gameData.players[gameData.currentPlayerIndex]) {
      game.currentTurn = gameData.players[gameData.currentPlayerIndex].id;
    }
    
    return game;
  }

  addPlayer(playerId, playerName, position, socketId = null) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error(`Game is full (maximum ${this.maxPlayers} players)`);
    }

    const player = {
      id: playerId,
      name: playerName,
      chips: 1000,
      initialChips: 1000,
      isReady: false,
      position,
      cards: [],
      hasSeen: false,
      hasFolded: false,
      currentBet: 0,
      totalBet: 0,
      isActive: true,
      socketId: socketId
    };

    this.players.push(player);
    // seat tracking
    if (!this.seats.length) {
      this.seats = Array.from({ length: this.maxPlayers }, (_, i) => ({ position: i + 1 }));
    }
    const seat = this.seats.find(s => !s.playerId);
    if (seat) {
      seat.playerId = playerId;
      player.position = seat.position;
    }
    
    // Save to database
    db.addPlayerToGame(this.id, player);
    db.logAction(this.id, playerId, 'join');
    console.log(`✓ Player ${playerName} added to game ${this.id} in database`);
    
    return player;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    try { db.removePlayerFromGame(this.id, playerId); } catch {}
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }
  
  updatePlayer(playerId, updates) {
    const player = this.getPlayer(playerId);
    if (player) {
      Object.assign(player, updates);
      // Save to database
      db.updateGamePlayer(this.id, playerId, updates);
    }
  }

  setPlayerReady(playerId, callback) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.isReady = true;
      try { db.updateGamePlayer(this.id, playerId, { isReady: true }); } catch {}
    }

    if (this.players.length >= 2 && this.players.every(p => p.isReady)) {
      setTimeout(() => {
        this.startGame();
        if (callback) callback();
      }, 2000);
    }
  }

  createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, id: `${suit}-${rank}` });
      }
    }

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  startGame() {
    if (this.status !== 'waiting' || this.players.length < 2) {
      return;
    }

    this.status = 'playing';
    this.startedAt = new Date();
    this.deck = this.createDeck();

    this.players.forEach(player => {
      player.cards = this.deck.splice(0, 3);
      player.isActive = true;
      player.hasFolded = false;
      player.hasSeen = false;
      player.currentBet = 0;
      player.totalBet = 0;
      
      // Save cards to database
      db.setPlayerCards(this.id, player.id, player.cards);
    });

    this.players.forEach(player => {
      player.chips -= this.minBet;
      player.currentBet = this.minBet;
      player.totalBet = this.minBet;
      this.pot += this.minBet;
      
      // Update player in database
      this.updatePlayer(player.id, {
        chips: player.chips,
        currentBet: this.minBet
      });
    });

    this.currentTurn = this.players[0].id;
  }

  // Reset state and prepare a new round with same players/seats
  resetForRematch({ resetChips = true } = {}) {
    // Increment round number for the next game
    this.roundNumber = (typeof this.roundNumber === 'number' ? this.roundNumber : 1) + 1;
    // Reset core game state
    this.status = 'waiting';
    this.winner = null;
    this.finishedAt = null;
    this.deck = [];
    this.pot = 0;
    this.currentBet = this.minBet || 10;
    this.lastAction = null;
    this.sideShowChallenge = null;
    this.sideShowResults = null;
    // Reset players
    this.players.forEach((p) => {
      p.isActive = true;
      p.hasFolded = false;
      p.hasSeen = false;
      p.currentBet = 0;
      p.totalBet = 0;
      p.cards = [];
      if (resetChips) {
        const nextChips = p.initialChips || 1000;
        p.chips = nextChips;
        try { db.updateGamePlayer(this.id, p.id, { chips: nextChips, currentBet: 0, isReady: true }); } catch {}
      } else {
        try { db.updateGamePlayer(this.id, p.id, { currentBet: 0, isReady: true }); } catch {}
      }
      try { db.setPlayerCards(this.id, p.id, []); } catch {}
    });
    // Persist reset
    try {
      db.updateGame(this.id, { callActive: 0 });
      this.saveToDatabase();
    } catch {}
  }
  handlePlayerAction(playerId, action) {
    const player = this.getPlayer(playerId);
    
    // Allow SEE action at any time (not just on player's turn)
    if (action.type === 'SEE') {
      if (!player) {
        throw new Error('Player not found');
      }
      if (!player.isActive) {
        throw new Error('Player is not active');
      }
      if (player.hasFolded) {
        throw new Error('Player has folded');
      }
      
      player.hasSeen = true;
      
      // Save to database
      this.updatePlayer(playerId, { hasSeen: true });
      db.logAction(this.id, playerId, 'see');
      
      return { action: 'see' };
    }
    
    // For all other actions, validate it's the player's turn
    if (!player || this.currentTurn !== playerId || !player.isActive || player.hasFolded) {
      throw new Error('Invalid move');
    }

    let actionResult = null;

    switch (action.type) {

      case 'CALL':
        actionResult = this.handleCall(player);
        break;

      case 'RAISE':
        actionResult = this.handleRaise(player, action.amount);
        break;

      case 'FOLD':
        actionResult = this.handleFold(player);
        break;

      case 'SHOW':
        actionResult = this.handleShow(player);
        break;

      case 'SIDE_SHOW':
        actionResult = this.handleSideShow(player, action.targetPlayerId);
        break;

      case 'ACCEPT_SIDE_SHOW':
        actionResult = this.handleAcceptSideShow(player);
        break;

      case 'DECLINE_SIDE_SHOW':
        actionResult = this.handleDeclineSideShow(player);
        break;

      default:
        throw new Error('Unknown action');
    }

    if (actionResult && !actionResult.gameEnded) {
      this.nextTurn();
    }

    return actionResult;
  }

  handleCall(player) {
    const betMultiplier = player.hasSeen ? 2 : 1;
    const callAmount = this.currentBet * betMultiplier;

    // Allow all-in call if player doesn't have enough chips
    const actualCall = Math.min(player.chips, callAmount);
    if (actualCall <= 0) {
      throw new Error('Not enough chips');
    }

    player.chips -= actualCall;
    player.currentBet = actualCall;
    player.totalBet += actualCall;
    this.pot += actualCall;

    this.lastAction = {
      playerId: player.id,
      action: 'call',
      amount: actualCall,
    };
    
    // Save to database
    this.updatePlayer(player.id, {
      chips: player.chips,
      currentBet: actualCall
    });
    this.saveToDatabase();
    db.logAction(this.id, player.id, 'call', actualCall);

    return { action: 'call', amount: actualCall };
  }

  handleRaise(player, amount) {
    const betMultiplier = player.hasSeen ? 2 : 1;
    const minRaise = this.currentBet * 2 * betMultiplier;

    if (amount < minRaise) {
      throw new Error(`Minimum raise is ${minRaise}`);
    }

    if (player.chips < amount) {
      throw new Error('Not enough chips');
    }

    player.chips -= amount;
    player.currentBet = amount;
    player.totalBet += amount;
    this.pot += amount;
    this.currentBet = amount / betMultiplier;

    this.lastAction = {
      playerId: player.id,
      action: 'raise',
      amount,
    };
    
    // Save to database
    this.updatePlayer(player.id, {
      chips: player.chips,
      currentBet: amount
    });
    this.saveToDatabase();
    db.logAction(this.id, player.id, 'raise', amount);

    return { action: 'raise', amount };
  }

  handleFold(player) {
    player.hasFolded = true;
    player.isActive = false;

    this.lastAction = {
      playerId: player.id,
      action: 'fold',
    };
    
    // Save to database
    this.updatePlayer(player.id, {
      hasFolded: true
      // Note: isActive is in-memory only, not stored in database
    });
    db.logAction(this.id, player.id, 'fold');

    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);

    if (activePlayers.length === 1) {
      this.endGame(activePlayers[0].id);
      return { action: 'fold', gameEnded: true, winner: activePlayers[0].id };
    }

    return { action: 'fold' };
  }

  handleShow(initiator) {
    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);

    // Special rules for SHOW when 2 players left
    if (activePlayers.length === 2) {
      const [p1, p2] = activePlayers;
      const hasBlind = !p1.hasSeen || !p2.hasSeen;
      const hasSeen = p1.hasSeen || p2.hasSeen;

      // If one player is blind and the other is seen:
      if (hasBlind && hasSeen) {
        if (initiator && initiator.hasSeen) {
          // Seen player cannot SHOW while an opponent is blind. Must side show.
          throw new Error('Seen player cannot show while any blind players remain. Use side show.');
        }
        // Blind SHOW allowed after configured rounds
        if (this.roundNumber < (this.minShowRounds || 3)) {
          throw new Error(`Blind show allowed after ${this.minShowRounds || 3} rounds`);
        }
        // Proceed to show and decide winner
        const winner = this.compareHands(p1, p2);
        try { db.logAction(this.id, initiator ? initiator.id : winner.id, 'show'); } catch {}
        this.lastAction = {
          playerId: initiator ? initiator.id : winner.id,
          action: 'show'
        };
        this.endGame(winner.id);
        return { action: 'show', gameEnded: true, winner: winner.id };
      }

      // Both seen -> standard SHOW allowed
      if (p1.hasSeen && p2.hasSeen) {
        const winner = this.compareHands(p1, p2);
        if (initiator) { db.logAction(this.id, initiator.id, 'show'); }
        const other = activePlayers.find(p => !initiator || p.id !== initiator.id);
        if (other) { db.logAction(this.id, other.id, 'show'); }
        this.lastAction = { playerId: initiator ? initiator.id : p1.id, action: 'show' };
        this.endGame(winner.id);
        return { action: 'show', gameEnded: true, winner: winner.id };
      }

      // Both blind -> require blind show rounds
      if (!p1.hasSeen && !p2.hasSeen) {
        if (this.roundNumber < (this.minShowRounds || 3)) {
          throw new Error(`Blind show allowed after ${this.minShowRounds || 3} rounds`);
        }
        const winner = this.compareHands(p1, p2);
        try { db.logAction(this.id, initiator ? initiator.id : winner.id, 'show'); } catch {}
        this.lastAction = { playerId: initiator ? initiator.id : winner.id, action: 'show' };
        this.endGame(winner.id);
        return { action: 'show', gameEnded: true, winner: winner.id };
      }
    }

    // Allow BLIND SHOW when all active players are blind and enough rounds have passed
    const allBlind = activePlayers.length >= 2 && activePlayers.every(p => !p.hasSeen);
    if (!(allBlind && this.roundNumber >= (this.minShowRounds || 3))) {
      throw new Error('Show not allowed yet');
    }

    // Determine best hand among active players
    let bestPlayer = activePlayers[0];
    let bestValue = this.evaluateHand(bestPlayer.cards);
    for (let i = 1; i < activePlayers.length; i++) {
      const val = this.evaluateHand(activePlayers[i].cards);
      if (val > bestValue) {
        bestValue = val;
        bestPlayer = activePlayers[i];
      }
    }

    try { db.logAction(this.id, initiator ? initiator.id : bestPlayer.id, 'show'); } catch {}

    this.lastAction = {
      playerId: initiator ? initiator.id : bestPlayer.id,
      action: 'show'
    };

    this.endGame(bestPlayer.id);
    return { action: 'show', gameEnded: true, winner: bestPlayer.id };
  }

  compareHands(player1, player2) {
    const hand1Value = this.evaluateHand(player1.cards);
    const hand2Value = this.evaluateHand(player2.cards);

    return hand1Value > hand2Value ? player1 : player2;
  }

  evaluateHand(cards) {
    const rankValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    const values = cards.map(c => rankValues[c.rank]).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    const sameSuit = suits.every(s => s === suits[0]);
    const is235 = (values[0] === 5 && values[1] === 3 && values[2] === 2);
    const is910Q = (values[0] === 12 && values[1] === 10 && values[2] === 9);

    if (cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
      return 10000 + values[0] * 100;
    }

    const isSeq = (values[0] === values[1] + 1 && values[1] === values[2] + 1) ||
                  (values[0] === 14 && values[1] === 3 && values[2] === 2);

    // Special 9-10-Q outranks any sequence and pure sequence when enabled
    if (this.rulesSpecial910Q && is910Q) {
      return 9300;
    }

    if (sameSuit && isSeq) {
      // Pure sequence (straight flush). If optional rule enabled and 2-3-5, push above AKQ suited
      if (is235 && this.rulesDoubleSeq235) {
        return 9200; // higher than any 9000+14
      }
      return 9000 + values[0];
    }

    if (isSeq) {
      // Sequence. If optional rule enabled and 2-3-5, push above AKQ sequence
      if (is235 && this.rulesRajkapoor135) {
        return 8200; // higher than any 8000+14
      }
      return 8000 + values[0];
    }

    if (sameSuit) {
      return 7000 + values[0] * 100 + values[1] * 10 + values[2];
    }

    if (cards[0].rank === cards[1].rank || cards[1].rank === cards[2].rank || cards[0].rank === cards[2].rank) {
      const pairValue = cards.find((card, i) => cards.findIndex(c => c.rank === card.rank) !== i);
      const pairRank = pairValue ? rankValues[pairValue.rank] : 0;
      return 6000 + pairRank * 100;
    }

    return values[0] * 100 + values[1] * 10 + values[2];
  }

  // Side Show Methods
  handleSideShow(challenger, targetPlayerId) {
    const targetPlayer = this.getPlayer(targetPlayerId);

    if (!targetPlayer || !targetPlayer.isActive || targetPlayer.hasFolded) {
      throw new Error('Invalid side show target');
    }

    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);
    if (activePlayers.length <= 2) {
      throw new Error('Side show requires at least 3 active players');
    }
    if (!challenger.hasSeen) {
      throw new Error('Challenger must be seen to request side show');
    }
    if (!targetPlayer.hasSeen) {
      throw new Error('Side show target must be seen');
    }

    // Create side show challenge
    this.sideShowChallenge = {
      challenger: challenger.id,
      target: targetPlayerId,
      challengerCards: [...challenger.cards],
      targetCards: [...targetPlayer.cards],
      timestamp: Date.now()
    };

    // Don't advance turn until side show is resolved
    db.logAction(this.id, challenger.id, 'side_show', 0, targetPlayerId);

    return {
      action: 'side_show',
      challenger: challenger.id,
      target: targetPlayerId,
      pending: true
    };
  }

  handleAcceptSideShow(player) {
    if (!this.sideShowChallenge || this.sideShowChallenge.target !== player.id) {
      throw new Error('No pending side show for this player');
    }

    // Compare cards
    const challenger = this.getPlayer(this.sideShowChallenge.challenger);
    const target = this.getPlayer(this.sideShowChallenge.target);

    if (!challenger || !target) {
      throw new Error('Players not found');
    }

    const challengerValue = this.evaluateHand(this.sideShowChallenge.challengerCards);
    const targetValue = this.evaluateHand(this.sideShowChallenge.targetCards);

    let winner, loser;
    if (challengerValue > targetValue) {
      winner = challenger;
      loser = target;
    } else {
      winner = target;
      loser = challenger;
    }

    // Winner takes half the pot (or agreed amount)
    const potSplit = Math.floor(this.pot / 2);
    winner.chips += potSplit;
    this.pot -= potSplit;

    // Update side show results
    this.sideShowResults = {
      winner: winner.id,
      loser: loser.id,
      potSplit: potSplit,
      timestamp: Date.now()
    };

    // Update players
    this.updatePlayer(winner.id, { chips: winner.chips });
    this.updatePlayer(loser.id, { chips: loser.chips });

    // Clear side show state
    this.sideShowChallenge = null;

    // Automatically fold the loser (remove from active play)
    try {
      this.handleFold(loser);
    } catch {}
    // Fully remove loser from the table (exit game)
    try {
      this.removePlayer(loser.id);
      // Also clear their seat
      this.seats.forEach(s => { 
        if (s.playerId === loser.id) {
          delete s.playerId;
          delete s.isBot;
        }
      });
      db.logAction(this.id, loser.id, 'player_left');
    } catch {}

    // Log actions
    db.logAction(this.id, player.id, 'accept_side_show');
    db.logAction(this.id, winner.id, 'side_show_win', potSplit);

    // Check if only one player is left after removing the loser
    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);
    let gameEnded = false;
    let finalWinner = winner.id;
    
    if (activePlayers.length === 1) {
      // Only one player left, end the game
      this.endGame(activePlayers[0].id);
      gameEnded = true;
      finalWinner = activePlayers[0].id;
    } else {
      // Game continues, advance turn to next player
      this.nextTurn();
    }

    return {
      action: 'accept_side_show',
      winner: winner.id,
      loser: loser.id,
      potSplit: potSplit,
      gameEnded: gameEnded,
      finalWinner: gameEnded ? finalWinner : undefined
    };
  }

  handleDeclineSideShow(player) {
    if (!this.sideShowChallenge || this.sideShowChallenge.target !== player.id) {
      throw new Error('No pending side show for this player');
    }

    // Challenger loses their current bet
    const challenger = this.getPlayer(this.sideShowChallenge.challenger);
    const challengerId = this.sideShowChallenge.challenger;
    if (challenger) {
      const betAmount = challenger.currentBet;
      challenger.chips += betAmount; // Return the bet
      challenger.currentBet = 0;
      challenger.totalBet -= betAmount;
      this.pot -= betAmount;

      this.updatePlayer(challenger.id, {
        chips: challenger.chips,
        currentBet: challenger.currentBet
      });
    }

    // Clear side show state
    this.sideShowChallenge = null;

    db.logAction(this.id, player.id, 'decline_side_show');

    // Advance turn to next player
    this.nextTurn();

    return {
      action: 'decline_side_show',
      challenger: challengerId,
      gameEnded: false
    };
  }

  endGame(winnerId) {
    const winner = this.getPlayer(winnerId);
    if (winner) {
      winner.chips += this.pot;
      this.updatePlayer(winnerId, { chips: winner.chips });
    }

    this.status = 'finished';
    this.winner = winnerId;
    this.finishedAt = new Date();
    if (this.botTimer) {
      try { clearTimeout(this.botTimer); } catch {}
      this.botTimer = null;
    }

    // Persist player stats
    this.players.forEach(player => {
      const won = player.id === winnerId;
      const initialChips = player.initialChips || 1000;
      const chipsChange = player.chips - initialChips;
      updatePlayerStats(player.id, player.name, won, chipsChange);
    });

    // Record settlements: per-player net and moves count
    try {
      const roundNumber = this.roundNumber || 1;
      const settlements = this.players.map(p => ({
        playerId: p.id,
        finalChips: p.chips,
        netChips: (p.chips - (p.initialChips || 1000)),
        movesCount: db.getMovesCount(this.id, p.id)
      }));
      db.addGameSettlements(this.id, roundNumber, settlements);

      // Build transfers (winner(s) receive from loser(s))
      const winners = this.players
        .map(p => ({ id: p.id, name: p.name, net: (p.chips - (p.initialChips || 1000)) }))
        .filter(p => p.net > 0)
        .sort((a,b) => b.net - a.net);
      const losers = this.players
        .map(p => ({ id: p.id, name: p.name, net: (p.chips - (p.initialChips || 1000)) }))
        .filter(p => p.net < 0)
        .sort((a,b) => a.net - b.net); // most negative first

      const transfers = [];
      let w = 0, l = 0;
      let winnerRemaining = winners[w]?.net || 0;
      let loserRemaining = Math.abs(losers[l]?.net || 0);
      while (w < winners.length && l < losers.length) {
        const amount = Math.min(winnerRemaining, loserRemaining);
        if (amount > 0) {
          transfers.push({ from: losers[l].id, to: winners[w].id, amount });
          winnerRemaining -= amount;
          loserRemaining -= amount;
        }
        if (winnerRemaining === 0) {
          w++;
          winnerRemaining = winners[w]?.net || 0;
        }
        if (loserRemaining === 0) {
          l++;
          loserRemaining = Math.abs(losers[l]?.net || 0);
        }
      }
      if (transfers.length) {
        db.addSettlementTransfers(this.id, roundNumber, transfers);
      }
    } catch (e) {
      console.warn('⚠️ Settlement persistence failed:', e?.message);
    }
    
    // Save final game state to database
    this.saveToDatabase();
    console.log(`✓ Game ${this.id} ended. Winner: ${winnerId}`);
  }

  startTurnTimer(io) {
    // Clear any existing timer
    this.clearTurnTimer();
    
    // Don't start timer for bots
    const currentPlayer = this.players.find(p => p.id === this.currentTurn);
    if (!currentPlayer || currentPlayer.isBot) return;
    
    this.turnStartTime = Date.now();
    
    // Set timeout for auto-fold
    this.turnTimer = setTimeout(() => {
      try {
        console.log(`⏰ Turn timeout for player ${this.currentTurn}`);
        // Auto-fold the player
        const player = this.players.find(p => p.id === this.currentTurn);
        if (player && player.isActive && !player.hasFolded) {
          const result = this.handleFold(player);
          if (io) {
            io.to(this.id).emit('game_state', this.toJSON());
            io.to(this.id).emit('game_message', {
              type: 'player_move',
              playerId: player.id,
              data: { ...result, autoFold: true, reason: 'timeout' },
              timestamp: new Date()
            });
            io.to(this.id).emit('turn_timeout', { playerId: player.id });
          }
          if (!result.gameEnded) {
            this.nextTurn();
            this.startTurnTimer(io);
          }
        }
      } catch (err) {
        console.warn('Turn timeout error:', err?.message);
      }
    }, this.turnTimeout * 1000);
  }

  clearTurnTimer() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    this.turnStartTime = null;
  }

  getTurnTimeRemaining() {
    if (!this.turnStartTime) return this.turnTimeout;
    const elapsed = Math.floor((Date.now() - this.turnStartTime) / 1000);
    return Math.max(0, this.turnTimeout - elapsed);
  }

  nextTurn() {
    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);
    if (activePlayers.length <= 1) return;

    const currentIndex = activePlayers.findIndex(p => p.id === this.currentTurn);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    this.currentTurn = activePlayers[nextIndex].id;
    
    // Save turn change to database
    this.saveToDatabase();
  }

  toJSON() {
    return {
      id: this.id,
      players: this.players,
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      pot: this.pot,
      currentBet: this.currentBet,
      minBet: this.minBet,
      variant: this.variant,
      minShowRounds: this.minShowRounds,
      roundNumber: this.roundNumber,
      deck: [],
      lastAction: this.lastAction,
      sideShowChallenge: this.sideShowChallenge,
      sideShowResults: this.sideShowResults,
      callActive: this.callActive,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      hostId: this.hostId,
      admins: this.admins,
      tableName: this.tableName,
      maxPlayers: this.maxPlayers,
      botCount: this.botCount,
      seats: this.seats,
      isPrivate: this.isPrivate,
      spectatorLimit: this.spectatorLimit,
      spectatorCount: this.spectatorCount,
      rulesRajkapoor135: this.rulesRajkapoor135,
      rulesDoubleSeq235: this.rulesDoubleSeq235,
      rulesSpecial910Q: this.rulesSpecial910Q,
      turnTimeout: this.turnTimeout,
      turnTimeRemaining: this.getTurnTimeRemaining(),
    };
  }
}

// Prepare Next.js
app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // API routes
      if (pathname === '/api/leaderboard') {
        const limit = parseInt(parsedUrl.query.limit) || 50;
        const leaderboard = getLeaderboard(limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: leaderboard,
          totalPlayers: playerStats.size,
        }));
        return;
      }

      if (pathname?.startsWith('/api/games/')) {
        const gameId = pathname.split('/').pop();
        let game = games.get(gameId);
        if (!game) {
          // Try to load from DB
          const loaded = TeenPatiGame.loadFromDatabase(gameId);
          if (loaded) {
            game = loaded;
            games.set(gameId, game);
          }
        }
        // If still not found, return a minimal waiting stub so spectator can render the table
        if (!game) {
          const stub = {
            id: gameId,
            players: [],
            currentTurn: null,
            status: 'waiting',
            winner: null,
            pot: 0,
            currentBet: 0,
            minBet: 10,
            roundNumber: 1,
            deck: [],
            lastAction: null,
            sideShowChallenge: null,
            sideShowResults: null,
            callActive: false,
            createdAt: Date.now(),
            startedAt: null,
            finishedAt: null,
            hostId: null,
            admins: [],
            tableName: `Table ${String(gameId).slice(-4)}`,
            maxPlayers: 3,
            botCount: 0,
            seats: [],
            isPrivate: false,
            spectatorLimit: 20,
            spectatorCount: 0,
            variant: 'classic',
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: stub }));
          return;
        }
        // Return current state (do not block private here; client can enforce UI)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: game.toJSON() }));
        return;
      }

      if (pathname?.startsWith('/api/player-stats/')) {
        const playerId = pathname.split('/').pop();
        const stats = playerStats.get(playerId);
        
        if (!stats) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Player not found',
          }));
          return;
        }

        const winRate = stats.gamesPlayed > 0 
          ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
          : 0;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: { ...stats, winRate },
        }));
        return;
      }

      if (pathname === '/api/stats-summary') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            totalPlayers: playerStats.size,
            totalGames: games.size,
            activeGames: Array.from(games.values()).filter(g => g.status === 'playing').length,
          },
        }));
        return;
      }

      // Next.js handles everything else
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  // Socket.io on same server
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  function scheduleNextBotAction(gameId) {
    const game = games.get(gameId);
    if (!game) return;
    if (game.botTimer) {
      try { clearTimeout(game.botTimer); } catch {}
      game.botTimer = null;
    }
    if (game.status !== 'playing') return;
    const current = game.players.find(p => p.id === game.currentTurn);
    if (!current || !current.isBot) return;

    const delay = 800 + Math.floor(Math.random() * 1200);
    game.botTimer = setTimeout(() => {
      try {
        const me = game.players.find(p => p.id === game.currentTurn);
        if (!me || !me.isBot || game.status !== 'playing') return;

        if (!me.hasSeen && Math.random() < 0.25) {
          const resultSee = game.handlePlayerAction(me.id, { type: 'SEE' });
          io.to(gameId).emit('game_state', game.toJSON());
          io.to(gameId).emit('game_message', { type: 'player_move', playerId: me.id, data: resultSee, timestamp: new Date() });
          return scheduleNextBotAction(gameId);
        }

        const betMultiplier = me.hasSeen ? 2 : 1;
        const canCall = me.chips >= game.currentBet * betMultiplier;
        const rnd = Math.random();
        let move = { type: 'CALL' };
        if (!canCall) {
          move = { type: 'FOLD' };
        } else if (rnd < 0.15) {
          move = { type: 'FOLD' };
        } else if (rnd < 0.35) {
          const minRaise = Math.max(game.currentBet * 2 * betMultiplier, game.minBet * betMultiplier * 2);
          const raise = Math.min(me.chips, minRaise);
          move = { type: 'RAISE', amount: raise };
        } else {
          move = { type: 'CALL' };
        }

        const result = game.handlePlayerAction(me.id, move);
        io.to(gameId).emit('game_state', game.toJSON());
        io.to(gameId).emit('game_message', { type: 'player_move', playerId: me.id, data: result, timestamp: new Date() });

        if (!result?.gameEnded) {
          scheduleNextBotAction(gameId);
        }
      } catch (err) {
        console.warn('Bot action failed:', err?.message);
      }
    }, delay);
  }
  // Socket.io handlers
  io.on('connection', (socket) => {
    const clientIP = socket.handshake.address;
    const referer = socket.handshake.headers.referer || 'Direct';
    
    console.log('\n🔌 New Connection:');
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   IP: ${clientIP}`);
    console.log(`   Referer: ${referer}`);
    console.log(`   Transport: ${socket.conn.transport.name}\n`);

    socket.on('join_game', ({ gameId, playerId, playerName }) => {
      console.log('📥 join_game received:', { gameId, playerId, playerName, socketId: socket.id });
      
      try {
        let game = games.get(gameId);
        
        if (!game) {
          console.log('🆕 Creating new game:', gameId);
          game = new TeenPatiGame(gameId);
          games.set(gameId, game);
        }

        let player = game.getPlayer(playerId);
        if (!player) {
          const position = game.players.length + 1;
          console.log(`➕ Adding player ${playerName} at position ${position}`);
          player = game.addPlayer(playerId, playerName, position, socket.id);
          // First player becomes host/admin by default
          if (!game.hostId) {
            game.hostId = playerId;
            game.admins = [playerId];
            game.tableName = `Table ${String(gameId).slice(-4)}`;
            db.updateGame(gameId, { hostId: playerId, name: game.tableName, maxPlayers: game.maxPlayers });
            try { db.addAdmin(gameId, playerId); } catch {}
          }
          // No auto-bot on join; bots are controlled via lobby botCount and start_game logic
        } else {
          console.log('👤 Player already exists, reconnecting:', playerId);
          // Update socket ID for reconnection
          player.socketId = socket.id;
          game.updatePlayer(playerId, { socketId: socket.id });
        }

        socket.join(gameId);
        socket.gameId = gameId;
        socket.playerId = playerId;

        const gameState = game.toJSON();
        console.log('📤 Emitting game_state to room:', gameId, {
          status: gameState.status,
          players: gameState.players.length,
          playerNames: gameState.players.map(p => p.name)
        });

        io.to(gameId).emit('game_state', gameState);

        // Send recent chat history to the joining socket
        try {
          const recent = db.getRecentChat(gameId, 50);
          socket.emit('chat_recent', recent);
        } catch (e) {
          console.warn('chat_recent load failed:', e.message);
        }

        socket.to(gameId).emit('game_message', {
          type: 'player_joined',
          playerId,
          data: { playerName },
          timestamp: new Date(),
        });

        // Presence broadcast: player online
        io.to(gameId).emit('player_online', {
          playerId,
          playerName,
          timestamp: Date.now()
        });

        console.log('✅ Player joined successfully:', { playerId, playerName, gameId });

      } catch (error) {
        console.error('❌ Error in join_game:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Admin: update lobby (tableName, maxPlayers, bots)
    socket.on('update_lobby', ({ gameId, playerId, tableName, maxPlayers, botCount, variant, isPrivate, spectatorLimit, minBet, minShowRounds, rulesRajkapoor135, rulesDoubleSeq235, rulesSpecial910Q }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        const isAdmin = game.hostId === playerId || game.admins.includes(playerId);
        if (!isAdmin) throw new Error('Only admin can update lobby');
        if (game.status !== 'waiting') throw new Error('Cannot change lobby after game start');
        if (tableName !== undefined) game.tableName = String(tableName).slice(0, 40);
        if (maxPlayers !== undefined) {
          const m = Math.max(2, Math.min(10, parseInt(maxPlayers) || 3));
          game.maxPlayers = m;

          // Re-seat players compactly: humans first (in join order), then bots up to capacity/botCount
          const humans = (game.players || []).filter(p => !p.isBot);
          const bots = (game.players || []).filter(p => p.isBot);

          // Determine desired bot slots based on capacity minus humans
          let allowedBotSlots = Math.max(0, m - humans.length);

          // If a new botCount is provided, use it; otherwise keep existing but ensure not exceeding allowed slots
          let desiredBotCount = (botCount !== undefined)
            ? Math.max(0, Math.min(parseInt(botCount) || 0, allowedBotSlots))
            : Math.min(bots.length, allowedBotSlots);

          // If humans already fill capacity, remove all bots and set botCount = 0
          if (humans.length >= m) {
            desiredBotCount = 0;
          }

          // Remove all existing bots from game and DB, we'll re-add up to desiredBotCount
          bots.forEach(b => { try { db.removePlayerFromGame(game.id, b.id); } catch {} });
          game.players = humans.slice(); // keep only humans

          // Build seats fresh
          game.seats = Array.from({ length: m }, (_, i) => ({ position: i + 1 }));

          // Seat humans compactly (positions 1..humans.length)
          humans.slice(0, m).forEach((p, idx) => {
            p.position = idx + 1;
            game.seats[idx].playerId = p.id;
            try { db.updateGamePlayer(game.id, p.id, { position: p.position }); } catch {}
          });

          // Add bots up to desiredBotCount into remaining seats
          for (let i = 0; i < desiredBotCount; i++) {
            const seat = game.seats.find(s => !s.playerId);
            if (!seat) break;
            const botId = `bot-${game.id}-${i+1}`;
            const bot = {
              id: botId, name: `BOT ${i+1}`, chips: 1000, initialChips: 1000, isReady: true,
              position: seat.position, cards: [], hasSeen: true, hasFolded: false,
              currentBet: 0, totalBet: 0, isActive: true, isBot: true, socketId: null
            };
            game.players.push(bot);
            seat.playerId = botId;
            seat.isBot = true;
            try { db.addPlayerToGame(game.id, bot); } catch {}
          }

          // Persist desired botCount
          game.botCount = desiredBotCount;
        } else if (botCount !== undefined) {
          // Only bot count changed: adjust bots within current capacity
          const m = game.maxPlayers;
          const humans = (game.players || []).filter(p => !p.isBot);
          const allowedBotSlots = Math.max(0, m - humans.length);
          const desired = Math.max(0, Math.min(parseInt(botCount) || 0, allowedBotSlots));

          // Remove all bots
          (game.players || []).filter(p => p.isBot).forEach(p => { try { db.removePlayerFromGame(game.id, p.id); } catch {} });
          game.players = humans.slice();
          // Clear bot flags in seats
          game.seats?.forEach(s => { if (s.isBot) { delete s.isBot; if (s.playerId && !game.players.find(p => p.id === s.playerId)) delete s.playerId; } });

          // Ensure humans occupy seats compactly
          game.seats = Array.from({ length: m }, (_, i) => ({ position: i + 1 }));
          humans.slice(0, m).forEach((p, idx) => {
            p.position = idx + 1;
            game.seats[idx].playerId = p.id;
            try { db.updateGamePlayer(game.id, p.id, { position: p.position }); } catch {}
          });

          // Add bots up to desired number
          for (let i = 0; i < desired; i++) {
            const seat = game.seats.find(s => !s.playerId);
            if (!seat) break;
            const botId = `bot-${game.id}-${i+1}`;
            const bot = {
              id: botId, name: `BOT ${i+1}`, chips: 1000, initialChips: 1000, isReady: true,
              position: seat.position, cards: [], hasSeen: true, hasFolded: false,
              currentBet: 0, totalBet: 0, isActive: true, isBot: true, socketId: null
            };
            game.players.push(bot);
            seat.playerId = botId;
            seat.isBot = true;
            try { db.addPlayerToGame(game.id, bot); } catch {}
          }

          game.botCount = desired;
        }
        if (variant !== undefined) {
          const allowed = ['classic','ak47','muflis','high_roller','turbo','joker_wild'];
          const v = String(variant).toLowerCase();
          if (allowed.includes(v)) game.variant = v;
        }
        if (typeof minShowRounds !== 'undefined') {
          const r = Math.max(1, Math.min(10, parseInt(minShowRounds) || 3));
          game.minShowRounds = r;
        }
        if (typeof rulesRajkapoor135 !== 'undefined') {
          game.rulesRajkapoor135 = !!rulesRajkapoor135;
        }
        if (typeof rulesDoubleSeq235 !== 'undefined') {
          game.rulesDoubleSeq235 = !!rulesDoubleSeq235;
        }
        // Enforce: if Rajkapoor is enabled, suited 2-3-5 must also be enabled
        if (game.rulesRajkapoor135) {
          game.rulesDoubleSeq235 = true;
        }
        if (typeof rulesSpecial910Q !== 'undefined') {
          game.rulesSpecial910Q = !!rulesSpecial910Q;
        }
        if (typeof isPrivate !== 'undefined') {
          game.isPrivate = !!isPrivate;
        }
        if (typeof spectatorLimit !== 'undefined') {
          const lim = Math.max(0, Math.min(200, parseInt(spectatorLimit) || 0));
          game.spectatorLimit = lim;
        }
        if (typeof minBet !== 'undefined') {
          const mb = Math.max(1, parseInt(minBet) || game.minBet);
          game.minBet = mb;
        }
        db.updateGame(gameId, { 
          name: game.tableName, 
          maxPlayers: game.maxPlayers, 
          variant: game.variant,
          isPrivate: game.isPrivate,
          spectatorLimit: game.spectatorLimit,
          minBet: game.minBet,
          rulesRajkapoor135: game.rulesRajkapoor135,
          rulesDoubleSeq235: game.rulesDoubleSeq235,
          rulesSpecial910Q: game.rulesSpecial910Q
        });
        io.to(gameId).emit('game_state', game.toJSON());
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Seat request (optionally specify position)
    socket.on('seat_request', ({ gameId, playerId, position }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        const player = game.getPlayer(playerId);
        if (!player) throw new Error('Player not found');
        if (game.status !== 'waiting') throw new Error('Cannot change seat after start');
        // target seat
        let seat = null;
        if (position) {
          seat = game.seats.find(s => s.position === position);
          if (!seat) throw new Error('Invalid seat');
          if (seat.playerId && seat.playerId !== playerId) throw new Error('Seat occupied');
        } else {
          seat = game.seats.find(s => !s.playerId);
          if (!seat) throw new Error('No empty seat');
        }
        // free current seat
        const cur = game.seats.find(s => s.playerId === playerId);
        if (cur) delete cur.playerId;
        seat.playerId = playerId;
        player.position = seat.position;
        db.updateGamePlayer(gameId, playerId, { position: player.position });
        io.to(gameId).emit('game_state', game.toJSON());
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Host-only: start game
    socket.on('start_game', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        const isHost = game.hostId === playerId;
        if (!isHost) throw new Error('Only host can start');

        // If there are not enough human players and botCount > 0, add bots up to botCount (respect seats)
        try {
          const humanCount = (game.players || []).filter(p => !p.isBot).length;
          if (humanCount < 2 && game.maxPlayers >= 2 && (game.botCount || 0) > 0) {
            if (!game.seats || !game.seats.length) {
              game.seats = Array.from({ length: game.maxPlayers }, (_, i) => ({ position: i + 1 }));
            }
            const existingBots = (game.players || []).filter(p => p.isBot).length;
            const canAdd = Math.max(0, Math.min(game.botCount - existingBots, 2 - humanCount));
            for (let i = 0; i < canAdd; i++) {
              const seat = game.seats.find(s => !s.playerId);
              if (!seat) break;
              const idx = existingBots + i + 1;
              const botId = `bot-${game.id}-${idx}`;
              const bot = {
                id: botId, name: `BOT ${idx}`, chips: 1000, initialChips: 1000, isReady: true,
                position: seat.position, cards: [], hasSeen: true, hasFolded: false,
                currentBet: 0, totalBet: 0, isActive: true, isBot: true, socketId: null
              };
              game.players.push(bot);
              seat.playerId = botId;
              seat.isBot = true;
              try { db.addPlayerToGame(game.id, bot); } catch {}
            }
            if (canAdd > 0) {
              console.log(`🤖 Added ${canAdd} bot(s) on start to reach minimum players`);
              io.to(gameId).emit('game_state', game.toJSON());
            }
          }
        } catch (e) {
          console.warn('Auto-bot add on start failed:', e?.message);
        }

        if (!game.players || (game.players.filter(p => !p.isBot).length < 2 && (game.botCount || 0) === 0)) {
          throw new Error('Need at least 2 players to start the game');
        }

        game.startGame();
        io.to(gameId).emit('game_state', game.toJSON());
        io.to(gameId).emit('game_message', { type: 'game_started', timestamp: new Date() });
        game.startTurnTimer(io);
        scheduleNextBotAction(gameId);
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Admin: kick player
    socket.on('kick_player', ({ gameId, playerId, targetId }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        if (game.status !== 'waiting') throw new Error('Cannot kick after game has started');
        const isAdmin = game.hostId === playerId || game.admins.includes(playerId);
        if (!isAdmin) throw new Error('Only admin can remove');
        if (targetId === game.hostId) throw new Error('Cannot remove host');
        const target = game.getPlayer(targetId);
        game.removePlayer(targetId);
        game.seats.forEach(s => { if (s.playerId === targetId) delete s.playerId; });
        // If kicked entity was a bot, reduce desired botCount so it doesn't auto-respawn
        if (target && target.isBot) {
          game.botCount = Math.max(0, (game.botCount || 0) - 1);
          try { db.updateGame(gameId, { botCount: game.botCount }); } catch {}
        }
        io.to(gameId).emit('game_state', game.toJSON());
        io.to(gameId).emit('game_message', { type: 'player_left', playerId: targetId, timestamp: new Date() });
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Admin: transfer or assign admin
    socket.on('assign_admin', ({ gameId, playerId, targetId, makeHost = false }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        const isAdmin = game.hostId === playerId || game.admins.includes(playerId);
        if (!isAdmin) throw new Error('Only admin can assign');
        if (!game.admins.includes(targetId)) {
          game.admins.push(targetId);
          try { db.addAdmin(gameId, targetId); } catch {}
        }
        if (makeHost) {
          game.hostId = targetId;
          db.updateGame(gameId, { hostId: game.hostId });
        }
        io.to(gameId).emit('game_state', game.toJSON());
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    // Update player's display name (allowed before game start)
    socket.on('update_player_name', ({ gameId, playerId, name }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        const player = game.getPlayer(playerId);
        if (!player) throw new Error('Player not found');
        if (game.status !== 'waiting') throw new Error('Cannot change name after game start');
        const clean = String(name || '').trim().slice(0, 24);
        if (!clean) throw new Error('Invalid name');
        game.updatePlayer(playerId, { name: clean });
        io.to(gameId).emit('game_state', game.toJSON());
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    socket.on('player_ready', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');

        game.setPlayerReady(playerId, () => {
          io.to(gameId).emit('game_state', game.toJSON());
          io.to(gameId).emit('game_message', {
            type: 'game_started',
            timestamp: new Date(),
          });
          game.startTurnTimer(io);
          scheduleNextBotAction(gameId);
        });
        
        io.to(gameId).emit('game_state', game.toJSON());

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('player_move', ({ gameId, playerId, move }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');

        // Normalize move type defensively (accept 'show'/'call'/etc. in any case)
        if (move && typeof move.type === 'string') {
          move.type = move.type.toUpperCase();
        }

        const result = game.handlePlayerAction(playerId, move);
        
        // Clear timer for this turn since action was taken
        game.clearTurnTimer();
        
        io.to(gameId).emit('game_state', game.toJSON());

        io.to(gameId).emit('game_message', {
          type: 'player_move',
          playerId,
          data: result,
          timestamp: new Date(),
        });

        if (result.gameEnded) {
          game.clearTurnTimer();
          io.to(gameId).emit('game_message', {
            type: 'game_ended',
            playerId: result.winner,
            data: { winner: result.winner },
            timestamp: new Date(),
          });
        } else {
          // Start timer for next player's turn
          game.startTurnTimer(io);
          scheduleNextBotAction(gameId);
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Rematch: restart with same players/seats (host-only)
    socket.on('rematch', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        if (game.status !== 'finished') throw new Error('Game not finished');
        const isHost = game.hostId === playerId;
        if (!isHost) throw new Error('Only host can start again');

        game.resetForRematch({ resetChips: true });
        io.to(gameId).emit('game_state', game.toJSON());

        // Do NOT auto-start; let host click Start. Notify clients that reset is done.
        io.to(gameId).emit('game_message', { type: 'game_reset', timestamp: new Date() });
      } catch (e) {
        socket.emit('error', { message: e.message });
      }
    });

    socket.on('send_reaction', ({ gameId, playerId, playerName, emoji }) => {
      try {
        console.log(`😀 Reaction from ${playerName}: ${emoji}`);
        
        // Broadcast to all players in the game (including sender)
        io.to(gameId).emit('player_reaction', {
          playerId,
          playerName,
          emoji,
          timestamp: Date.now()
        });

      } catch (error) {
        console.error('Error sending reaction:', error);
        socket.emit('error', { message: 'Failed to send reaction' });
      }
    });

    // Handle chat messages
    socket.on('send_chat', ({ gameId, message }) => {
      try {
        console.log('\n💬 ===== CHAT MESSAGE =====');
        console.log('From:', message.playerName, `(${message.playerId})`);
        console.log('Message:', message.message);
        console.log('Game ID:', gameId);
        
        // Simple rate limiting per player (min 300ms between messages)
        try {
          socket._lastChatAt = socket._lastChatAt || 0;
          const now = Date.now();
          if (now - socket._lastChatAt < 300) {
            console.log('⏱️ Chat rate limited for', message.playerId);
            return;
          }
          socket._lastChatAt = now;
        } catch {}

        const game = games.get(gameId);
        if (game) {
          console.log('✅ Game found, broadcasting to room...');

          // Persist chat
          try {
            const id = message.id || `${message.playerId}-${Date.now()}`;
            db.addChatMessage({
              id,
              gameId,
              playerId: message.playerId,
              playerName: message.playerName || 'Player',
              content: String(message.message || '')
            });
            message.id = id;
          } catch (e) {
            console.warn('chat persist failed:', e.message);
          }

          // Broadcast to all players in the game
          io.to(gameId).emit('chat_message', message);
          
          console.log('✅ Chat message broadcasted to game room');
          console.log('========================\n');

          // Delivery ack back to sender
          socket.emit('chat_delivered', { id: message.id });
        } else {
          console.log('❌ Game not found!');
        }

      } catch (error) {
        console.error('❌ Error sending chat message:', error);
        socket.emit('error', { message: 'Failed to send chat message' });
      }
    });

    // Edit chat message
    socket.on('edit_chat', ({ gameId, id, playerId, message }) => {
      try {
        const game = games.get(gameId);
        if (!game) return;
        try { db.editChatMessage({ id, content: String(message || '') }); } catch {}
        // Broadcast edited content to room
        io.to(gameId).emit('chat_edited', { id, message, playerId });
      } catch (e) {
        console.error('❌ Error editing chat:', e);
      }
    });

    // Delete chat message
    socket.on('delete_chat', ({ gameId, id, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) return;
        try { db.deleteChatMessage({ id }); } catch {}
        io.to(gameId).emit('chat_deleted', { id, playerId });
      } catch (e) {
        console.error('❌ Error deleting chat:', e);
      }
    });

    // Typing indicator
    socket.on('typing', ({ gameId, playerId, playerName, isTyping }) => {
      try {
        io.to(gameId).emit('player_typing', {
          playerId,
          playerName,
          isTyping: !!isTyping,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error('❌ Error broadcasting typing:', e);
      }
    });

    // Handle nudge player
    socket.on('nudge_player', ({ gameId, from, fromName, to }) => {
      try {
        console.log('\n🔔 ===== NUDGE EVENT =====');
        console.log('From:', fromName, `(${from})`);
        console.log('To:', to);
        console.log('Game ID:', gameId);
        
        const game = games.get(gameId);
        if (game) {
          console.log('✅ Game found, broadcasting to room...');
          
          // Broadcast nudge to all players in game room
          io.to(gameId).emit('player_nudged', {
            from,
            fromName,
            to
          });
          
          console.log('✅ Nudge broadcasted to game room');
          console.log('========================\n');
        } else {
          console.log('❌ Game not found!');
        }

      } catch (error) {
        console.error('❌ Error sending nudge:', error);
        socket.emit('error', { message: 'Failed to send nudge' });
      }
    });

    // Notify when sender's nudge cooldown is over (to dismiss overlays)
    socket.on('nudge_ready', ({ gameId, from, to }) => {
      try {
        const game = games.get(gameId);
        if (game) {
          io.to(gameId).emit('nudge_ready', { from, to, timestamp: Date.now() });
        }
      } catch (error) {
        console.error('❌ Error sending nudge_ready:', error);
      }
    });

    socket.on('leave_game', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (game) {
          game.removePlayer(playerId);
          
          if (game.players.length === 0) {
            games.delete(gameId);
          } else {
            io.to(gameId).emit('game_state', game.toJSON());
            socket.to(gameId).emit('game_message', {
              type: 'player_left',
              playerId,
              timestamp: new Date(),
            });
          }
        }
        socket.leave(gameId);

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Spectator joins/leaves (ephemeral count + broadcast)
    socket.on('spectate_join', ({ gameId }) => {
      try {
        const game = games.get(gameId);
        if (!game) throw new Error('Game not found');
        if (game.isPrivate) throw new Error('Private table');
        if (game.spectatorLimit && game.spectatorCount >= game.spectatorLimit) {
          throw new Error('Spectator limit reached');
        }
        game.spectatorCount = (game.spectatorCount || 0) + 1;
        socket.join(`spectate:${gameId}`);
        socket._spectatingGame = gameId;
        io.to(gameId).emit('game_state', game.toJSON());
        socket.emit('spectate_ok', { spectatorCount: game.spectatorCount });
      } catch (e) {
        socket.emit('spectate_error', { message: e.message });
      }
    });

    socket.on('spectate_leave', ({ gameId }) => {
      try {
        const game = games.get(gameId);
        if (game && game.spectatorCount > 0) {
          game.spectatorCount -= 1;
          io.to(gameId).emit('game_state', game.toJSON());
        }
        socket.leave(`spectate:${gameId}`);
        delete socket._spectatingGame;
      } catch {}
    });

    // ================== VOICE SIGNALING RELAYS ==================
    socket.on('voice_call_start', ({ gameId, initiatorId, initiatorName }) => {
      try {
        const game = games.get(gameId);
        if (game) {
          game.callActive = true;
          try { db.updateGame(gameId, { callActive: true }); } catch {}
        }
        io.to(gameId).emit('voice_call_started', { initiatorId, initiatorName, timestamp: Date.now() });
      } catch (e) {
        console.error('❌ voice_call_start error:', e.message);
      }
    });
    socket.on('voice_call_end', ({ gameId, initiatorId }) => {
      try {
        const game = games.get(gameId);
        if (game) {
          game.callActive = false;
          try { db.updateGame(gameId, { callActive: false }); } catch {}
        }
        io.to(gameId).emit('voice_call_ended', { initiatorId, timestamp: Date.now() });
      } catch (e) {
        console.error('❌ voice_call_end error:', e.message);
      }
    });
    socket.on('voice_join', ({ gameId, playerId, playerName }) => {
      try {
        // Inform others in the room a participant is ready for voice
        socket.to(gameId).emit('voice_join', { playerId, playerName });
      } catch (e) {
        console.error('❌ voice_join error:', e.message);
      }
    });

    socket.on('voice_offer', ({ gameId, from, to, sdp }) => {
      try {
        const game = games.get(gameId);
        if (!game) return;
        const target = game.players.find(p => p.id === to);
        if (target?.socketId) io.to(target.socketId).emit('voice_offer', { from, sdp });
      } catch (e) {
        console.error('❌ voice_offer error:', e.message);
      }
    });

    socket.on('voice_answer', ({ gameId, from, to, sdp }) => {
      try {
        const game = games.get(gameId);
        if (!game) return;
        const target = game.players.find(p => p.id === to);
        if (target?.socketId) io.to(target.socketId).emit('voice_answer', { from, sdp });
      } catch (e) {
        console.error('❌ voice_answer error:', e.message);
      }
    });

    socket.on('voice_candidate', ({ gameId, from, to, candidate }) => {
      try {
        const game = games.get(gameId);
        if (!game) return;
        const target = game.players.find(p => p.id === to);
        if (target?.socketId) io.to(target.socketId).emit('voice_candidate', { from, candidate });
      } catch (e) {
        console.error('❌ voice_candidate error:', e.message);
      }
    });

    // Low-latency fallback audio chunks relay (non-WebRTC)
    socket.on('voice_chunk', async ({ gameId, from, data, ts }) => {
      try {
        // Broadcast to others in the same game
        socket.to(gameId).emit('voice_chunk', { from, data, ts: ts || Date.now() });
      } catch (e) {
        console.error('❌ voice_chunk error:', e.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Player disconnected:', socket.id);
      if (socket.gameId && socket.playerId) {
        io.to(socket.gameId).emit('player_offline', {
          playerId: socket.playerId,
          timestamp: Date.now(),
        });
      }
    });
  });

  // Start server
  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('\n🎮 ========================================');
    console.log('   Teen Patti - Unified Server');
    console.log('========================================');
    console.log(`\n✅ Server running on port ${port}`);
    console.log(`\n📡 Access URLs:`);
    console.log(`   Local:    http://localhost:${port}`);
    console.log(`   Network:  http://0.0.0.0:${port}`);
    console.log(`\n🎯 Features:`);
    console.log(`   ✓ Next.js Frontend`);
    console.log(`   ✓ Socket.io Backend (same port)`);
    console.log(`   ✓ Game API endpoints`);
    console.log(`\n🌐 For Ngrok (Single Tunnel):`);
    console.log(`   Run: ngrok http ${port}`);
    console.log(`   Share the ngrok URL - काम गर्छ!`);
    console.log(`\n========================================\n`);
  });
});

