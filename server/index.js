const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Dynamic CORS - works with localhost and ngrok
app.use(cors({
  origin: true, // Allow all origins (for development)
  credentials: true,
}));

// Trust proxy for ngrok
app.set('trust proxy', 1);

const server = http.createServer(app);

// Socket.io with ngrok support
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (ngrok URLs included)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  cookie: false,
});

// Import game utilities (we'll need to convert teenPatiUtils to CommonJS or use a bundler)
// For now, I'll implement basic game logic here

const games = new Map();

// Player statistics storage (in-memory, could be moved to database)
const playerStats = new Map();

// Initialize or get player stats
function getPlayerStats(playerId, playerName) {
  if (!playerStats.has(playerId)) {
    playerStats.set(playerId, {
      id: playerId,
      name: playerName,
      gamesPlayed: 0,
      gamesWon: 0,
      totalWinnings: 0,
      totalLosses: 0,
      lastPlayed: new Date(),
    });
  }
  return playerStats.get(playerId);
}

// Update player stats after game
function updatePlayerStats(playerId, playerName, won, chipsChange) {
  const stats = getPlayerStats(playerId, playerName);
  stats.gamesPlayed += 1;
  if (won) {
    stats.gamesWon += 1;
    stats.totalWinnings += chipsChange;
  } else {
    stats.totalLosses += Math.abs(chipsChange);
  }
  stats.lastPlayed = new Date();
  playerStats.set(playerId, stats);
}

// Get leaderboard
function getLeaderboard(limit = 50) {
  const allStats = Array.from(playerStats.values());
  
  // Calculate win rate and sort
  const ranked = allStats
    .map(stat => ({
      ...stat,
      winRate: stat.gamesPlayed > 0 ? Math.round((stat.gamesWon / stat.gamesPlayed) * 100) : 0,
    }))
    .sort((a, b) => {
      // Primary: total winnings
      if (b.totalWinnings !== a.totalWinnings) {
        return b.totalWinnings - a.totalWinnings;
      }
      // Secondary: win rate
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      // Tertiary: games won
      return b.gamesWon - a.gamesWon;
    })
    .slice(0, limit)
    .map((stat, index) => ({
      rank: index + 1,
      id: stat.id,
      name: stat.name,
      gamesPlayed: stat.gamesPlayed,
      gamesWon: stat.gamesWon,
      totalWinnings: stat.totalWinnings,
      winRate: stat.winRate,
    }));

  return ranked;
}

// Game state management
class TeenPatiGame {
  constructor(gameId) {
    this.id = gameId;
    this.players = [];
    this.currentTurn = null;
    this.status = 'waiting';
    this.winner = null;
    this.pot = 0;
    this.currentBet = 10; // Boot amount
    this.minBet = 10;
    this.roundNumber = 1;
    this.deck = [];
    this.createdAt = new Date();
  }

  addPlayer(playerId, playerName, position) {
    if (this.players.length >= 3) {
      throw new Error('Game is full (maximum 3 players)');
    }

    const player = {
      id: playerId,
      name: playerName,
      chips: 1000,
      initialChips: 1000, // Track initial chips for stats
      isReady: false,
      position,
      cards: [],
      hasSeen: false,
      hasFolded: false,
      currentBet: 0,
      totalBet: 0,
      isActive: true,
    };

    this.players.push(player);
    return player;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  setPlayerReady(playerId, callback) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.isReady = true;
    }

    // Start game if 2 or 3 players are ready
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

    // Shuffle
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

    // Deal cards
    this.players.forEach(player => {
      player.cards = this.deck.splice(0, 3);
      player.isActive = true;
      player.hasFolded = false;
      player.hasSeen = false;
      player.currentBet = 0;
      player.totalBet = 0;
    });

    // Collect boot from all players
    this.players.forEach(player => {
      player.chips -= this.minBet;
      player.totalBet = this.minBet;
      this.pot += this.minBet;
    });

    this.currentTurn = this.players[0].id;
  }

  handlePlayerAction(playerId, action) {
    const player = this.getPlayer(playerId);
    
    // Allow SEE action at any time (not just on player's turn)
    if (action.type === 'SEE') {
      console.log('[SEE Action]', {
        playerId,
        playerExists: !!player,
        isActive: player?.isActive,
        hasFolded: player?.hasFolded,
        gameStatus: this.status
      });
      
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
      console.log('[SEE Action] Success - player.hasSeen =', player.hasSeen);
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
        actionResult = this.handleShow();
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

    if (player.chips < callAmount) {
      throw new Error('Not enough chips');
    }

    player.chips -= callAmount;
    player.totalBet += callAmount;
    this.pot += callAmount;

    this.lastAction = {
      playerId: player.id,
      action: 'call',
      amount: callAmount,
    };

    return { action: 'call', amount: callAmount };
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
    player.totalBet += amount;
    this.pot += amount;
    this.currentBet = amount / betMultiplier;

    this.lastAction = {
      playerId: player.id,
      action: 'raise',
      amount,
    };

    return { action: 'raise', amount };
  }

  handleFold(player) {
    player.hasFolded = true;
    player.isActive = false;

    this.lastAction = {
      playerId: player.id,
      action: 'fold',
    };

    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);

    // If only one player left, they win
    if (activePlayers.length === 1) {
      this.endGame(activePlayers[0].id);
      return { action: 'fold', gameEnded: true, winner: activePlayers[0].id };
    }

    return { action: 'fold' };
  }

  handleShow() {
    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);

    if (activePlayers.length !== 2) {
      throw new Error('Show can only be done with 2 players');
    }

    // Compare hands
    const winner = this.compareHands(activePlayers[0], activePlayers[1]);
    this.endGame(winner.id);

    return { action: 'show', gameEnded: true, winner: winner.id };
  }

  compareHands(player1, player2) {
    const hand1Value = this.evaluateHand(player1.cards);
    const hand2Value = this.evaluateHand(player2.cards);

    return hand1Value > hand2Value ? player1 : player2;
  }

  evaluateHand(cards) {
    // Simplified hand evaluation - returns a numeric value
    const rankValues = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    const values = cards.map(c => rankValues[c.rank]).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    const sameSuit = suits.every(s => s === suits[0]);

    // Check trail (three of a kind)
    if (cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
      return 10000 + values[0] * 100;
    }

    // Check sequence
    const isSeq = (values[0] === values[1] + 1 && values[1] === values[2] + 1) ||
                  (values[0] === 14 && values[1] === 3 && values[2] === 2); // A-2-3

    // Pure sequence
    if (sameSuit && isSeq) {
      return 9000 + values[0];
    }

    // Sequence
    if (isSeq) {
      return 8000 + values[0];
    }

    // Color (flush)
    if (sameSuit) {
      return 7000 + values[0] * 100 + values[1] * 10 + values[2];
    }

    // Pair
    if (cards[0].rank === cards[1].rank || cards[1].rank === cards[2].rank || cards[0].rank === cards[2].rank) {
      const pairValue = cards.find((card, i) => cards.findIndex(c => c.rank === card.rank) !== i);
      const pairRank = pairValue ? rankValues[pairValue.rank] : 0;
      return 6000 + pairRank * 100;
    }

    // High card
    return values[0] * 100 + values[1] * 10 + values[2];
  }

  endGame(winnerId) {
    const winner = this.getPlayer(winnerId);
    if (winner) {
      winner.chips += this.pot;
    }

    this.status = 'finished';
    this.winner = winnerId;
    this.finishedAt = new Date();

    // Update player statistics
    this.players.forEach(player => {
      const won = player.id === winnerId;
      const initialChips = player.initialChips || 1000;
      const chipsChange = player.chips - initialChips;
      
      updatePlayerStats(player.id, player.name, won, chipsChange);
    });
  }

  nextTurn() {
    const activePlayers = this.players.filter(p => p.isActive && !p.hasFolded);
    if (activePlayers.length <= 1) return;

    const currentIndex = activePlayers.findIndex(p => p.id === this.currentTurn);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    this.currentTurn = activePlayers[nextIndex].id;
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
      roundNumber: this.roundNumber,
      deck: [], // Don't send deck to clients
      lastAction: this.lastAction,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    };
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  const clientIP = socket.handshake.address;
  const userAgent = socket.handshake.headers['user-agent'];
  const referer = socket.handshake.headers.referer || 'Direct connection';
  
  console.log('\n🔌 New Connection:');
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   IP: ${clientIP}`);
  console.log(`   Referer: ${referer}`);
  console.log(`   Transport: ${socket.conn.transport.name}`);
  console.log('');

  socket.on('join_game', ({ gameId, playerId, playerName }) => {
    console.log('📥 join_game received:', { gameId, playerId, playerName, socketId: socket.id });
    
    try {
      let game = games.get(gameId);
      
      if (!game) {
        console.log('🆕 Creating new game:', gameId);
        game = new TeenPatiGame(gameId);
        games.set(gameId, game);
      }

      // Check if player already exists
      let player = game.getPlayer(playerId);
      if (!player) {
        const position = game.players.length + 1;
        console.log(`➕ Adding player ${playerName} at position ${position}`);
        player = game.addPlayer(playerId, playerName, position);
      } else {
        console.log('👤 Player already exists, reconnecting:', playerId);
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

      // Send game state to all players
      io.to(gameId).emit('game_state', gameState);

      // Broadcast player joined
      socket.to(gameId).emit('game_message', {
        type: 'player_joined',
        playerId,
        data: { playerName },
        timestamp: new Date(),
      });

      console.log('✅ Player joined successfully:', { playerId, playerName, gameId });

    } catch (error) {
      console.error('❌ Error in join_game:', error.message);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player_ready', ({ gameId, playerId }) => {
    try {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');

      game.setPlayerReady(playerId, () => {
        // Emit game state after game starts
        io.to(gameId).emit('game_state', game.toJSON());
        io.to(gameId).emit('game_message', {
          type: 'game_started',
          timestamp: new Date(),
        });
      });
      
      // Emit immediate state (showing players ready)
      io.to(gameId).emit('game_state', game.toJSON());

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player_move', ({ gameId, playerId, move }) => {
    try {
      const game = games.get(gameId);
      if (!game) throw new Error('Game not found');

      const result = game.handlePlayerAction(playerId, move);
      
      // Send updated game state
      io.to(gameId).emit('game_state', game.toJSON());

      // Broadcast the move
      io.to(gameId).emit('game_message', {
        type: 'player_move',
        playerId,
        data: result,
        timestamp: new Date(),
      });

      // If game ended, send game_ended message
      if (result.gameEnded) {
        io.to(gameId).emit('game_message', {
          type: 'game_ended',
          playerId: result.winner,
          data: { winner: result.winner },
          timestamp: new Date(),
        });
      }

    } catch (error) {
      socket.emit('error', { message: error.message });
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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.gameId && socket.playerId) {
      const game = games.get(socket.gameId);
      if (game) {
        // Don't remove player immediately - they might reconnect
        // You could implement a timeout here
      }
    }
  });
});

// REST API Endpoints
app.get('/api/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const leaderboard = getLeaderboard(limit);
  res.json({
    success: true,
    data: leaderboard,
    totalPlayers: playerStats.size,
  });
});

app.get('/api/player-stats/:playerId', (req, res) => {
  const { playerId } = req.params;
  const stats = playerStats.get(playerId);
  
  if (!stats) {
    return res.status(404).json({
      success: false,
      message: 'Player not found',
    });
  }

  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  res.json({
    success: true,
    data: {
      ...stats,
      winRate,
    },
  });
});

app.get('/api/stats-summary', (req, res) => {
  res.json({
    success: true,
    data: {
      totalPlayers: playerStats.size,
      totalGames: games.size,
      activeGames: Array.from(games.values()).filter(g => g.status === 'playing').length,
    },
  });
});

const PORT = process.env.PORT || 3003;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for ngrok

server.listen(PORT, HOST, () => {
  console.log(`🎮 Teen Pati game server running on ${HOST}:${PORT}`);
  console.log(`\n📡 Connection URLs:`);
  console.log(`   Local:        http://localhost:${PORT}`);
  console.log(`   Network:      http://0.0.0.0:${PORT}`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   Leaderboard:  http://localhost:${PORT}/api/leaderboard`);
  console.log(`   Player Stats: http://localhost:${PORT}/api/player-stats/:playerId`);
  console.log(`   Stats Summary: http://localhost:${PORT}/api/stats-summary`);
  console.log(`\n🌐 For Ngrok: Run "ngrok http ${PORT}" in separate terminal`);
  console.log(`\n✅ Server ready! Waiting for connections...\n`);
});

