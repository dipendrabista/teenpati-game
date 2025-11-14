const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class GameDatabase {
  constructor(dbPath = path.join(__dirname, 'teenpatti.db')) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Better performance
    this.initDatabase();
  }

  initDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
    console.log('✓ Database initialized');

    // Lightweight migrations for existing databases (add missing columns)
    try {
      const columns = this.db.prepare("PRAGMA table_info(games)").all();
      const hasVariant = columns.some(c => c.name === 'variant');
      const hasName = columns.some(c => c.name === 'name');
      const hasHost = columns.some(c => c.name === 'host_id');
      const hasMaxPlayers = columns.some(c => c.name === 'max_players');
      const hasCallActive = columns.some(c => c.name === 'call_active');
      const hasIsPrivate = columns.some(c => c.name === 'is_private');
      const hasSpectatorLimit = columns.some(c => c.name === 'spectator_limit');
      const hasRuleRajkapoor = columns.some(c => c.name === 'rules_rajkapoor_135');
      const hasRuleDoubleSeq = columns.some(c => c.name === 'rules_double_seq_235');
      const hasRuleSpecial910Q = columns.some(c => c.name === 'rules_special_910q');
      // game_admins table
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const hasGameAdmins = tables.some(t => t.name === 'game_admins');
      // game_players.is_bot
      const gpCols = this.db.prepare("PRAGMA table_info(game_players)").all();
      const hasIsBot = gpCols.some(c => c.name === 'is_bot');
      const hasIsReady = gpCols.some(c => c.name === 'is_ready');
      const hasGameChat = tables.some(t => t.name === 'game_chat');
      const hasSettlements = tables.some(t => t.name === 'game_settlements');
      const hasSettlementTransfers = tables.some(t => t.name === 'game_settlement_transfers');
      if (!hasVariant) {
        console.log('⚠️  Adding missing column games.variant ...');
        this.db.exec("ALTER TABLE games ADD COLUMN variant TEXT NOT NULL DEFAULT 'classic'");
        console.log('✓ Column games.variant added');
      }
      if (!hasName) {
        console.log('⚠️  Adding missing column games.name ...');
        this.db.exec("ALTER TABLE games ADD COLUMN name TEXT");
        console.log('✓ Column games.name added');
      }
      if (!hasHost) {
        console.log('⚠️  Adding missing column games.host_id ...');
        this.db.exec("ALTER TABLE games ADD COLUMN host_id TEXT");
        console.log('✓ Column games.host_id added');
      }
      if (!hasMaxPlayers) {
        console.log('⚠️  Adding missing column games.max_players ...');
        this.db.exec("ALTER TABLE games ADD COLUMN max_players INTEGER NOT NULL DEFAULT 3");
        console.log('✓ Column games.max_players added');
      }
      if (!hasCallActive) {
        console.log('⚠️  Adding missing column games.call_active ...');
        this.db.exec("ALTER TABLE games ADD COLUMN call_active INTEGER NOT NULL DEFAULT 0");
        console.log('✓ Column games.call_active added');
      }
      if (!hasIsPrivate) {
        console.log('⚠️  Adding missing column games.is_private ...');
        this.db.exec("ALTER TABLE games ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0");
        console.log('✓ Column games.is_private added');
      }
      if (!hasSpectatorLimit) {
        console.log('⚠️  Adding missing column games.spectator_limit ...');
        this.db.exec("ALTER TABLE games ADD COLUMN spectator_limit INTEGER NOT NULL DEFAULT 20");
        console.log('✓ Column games.spectator_limit added');
      }
      if (!hasRuleRajkapoor) {
        console.log('⚠️  Adding missing column games.rules_rajkapoor_135 ...');
        this.db.exec("ALTER TABLE games ADD COLUMN rules_rajkapoor_135 INTEGER NOT NULL DEFAULT 0");
        console.log('✓ Column games.rules_rajkapoor_135 added');
      }
      if (!hasRuleDoubleSeq) {
        console.log('⚠️  Adding missing column games.rules_double_seq_235 ...');
        this.db.exec("ALTER TABLE games ADD COLUMN rules_double_seq_235 INTEGER NOT NULL DEFAULT 0");
        console.log('✓ Column games.rules_double_seq_235 added');
      }
      if (!hasRuleSpecial910Q) {
        console.log('⚠️  Adding missing column games.rules_special_910q ...');
        this.db.exec("ALTER TABLE games ADD COLUMN rules_special_910q INTEGER NOT NULL DEFAULT 0");
        console.log('✓ Column games.rules_special_910q added');
      }
      if (!hasGameAdmins) {
        console.log('⚠️  Creating table game_admins ...');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS game_admins (
            game_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            PRIMARY KEY (game_id, player_id)
          );
        `);
        console.log('✓ Table game_admins created');
      }
      if (!hasIsBot) {
        console.log('⚠️  Adding column game_players.is_bot ...');
        this.db.exec("ALTER TABLE game_players ADD COLUMN is_bot INTEGER NOT NULL DEFAULT 0");
        console.log('✓ Column game_players.is_bot added');
      }
      if (!hasIsReady) {
        console.log('⚠️  Adding column game_players.is_ready ...');
        this.db.exec("ALTER TABLE game_players ADD COLUMN is_ready INTEGER NOT NULL DEFAULT 0");
        console.log('✓ Column game_players.is_ready added');
      }
      if (!hasGameChat) {
        console.log('⚠️  Creating table game_chat ...');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS game_chat (
            id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            player_name TEXT NOT NULL,
            content TEXT NOT NULL,
            deleted INTEGER NOT NULL DEFAULT 0,
            edited_at INTEGER,
            created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
          );
          CREATE INDEX IF NOT EXISTS idx_gc_game_time ON game_chat (game_id, created_at);
        `);
        console.log('✓ Table game_chat created');
      }
      if (!hasSettlements) {
        console.log('⚠️  Creating table game_settlements ...');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS game_settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            round_number INTEGER NOT NULL DEFAULT 1,
            player_id TEXT NOT NULL,
            final_chips INTEGER NOT NULL,
            net_chips INTEGER NOT NULL,
            moves_count INTEGER NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
          );
          CREATE INDEX IF NOT EXISTS idx_gs_game_round ON game_settlements (game_id, round_number);
          CREATE INDEX IF NOT EXISTS idx_gs_player ON game_settlements (player_id);
        `);
        console.log('✓ Table game_settlements created');
      }
      if (!hasSettlementTransfers) {
        console.log('⚠️  Creating table game_settlement_transfers ...');
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS game_settlement_transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            round_number INTEGER NOT NULL DEFAULT 1,
            from_player_id TEXT NOT NULL,
            to_player_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
          );
          CREATE INDEX IF NOT EXISTS idx_gst_game_round ON game_settlement_transfers (game_id, round_number);
        `);
        console.log('✓ Table game_settlement_transfers created');
      }

      // Helpful indexes
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_gp_game ON game_players (game_id);
        CREATE INDEX IF NOT EXISTS idx_gp_game_pos ON game_players (game_id, position);
        CREATE INDEX IF NOT EXISTS idx_gp_game_player ON game_players (game_id, player_id);
        CREATE INDEX IF NOT EXISTS idx_pc_game_player ON player_cards (game_id, player_id);
        CREATE INDEX IF NOT EXISTS idx_ga_game_time ON game_actions (game_id, timestamp);
      `);
    } catch (e) {
      console.error('❌ Migration check failed:', e.message);
    }
  }

  // ==================== GAME OPERATIONS ====================

  createGame(gameId, minBet = 10, variant = 'classic') {
    const stmt = this.db.prepare(`
      INSERT INTO games (id, status, pot, current_bet, min_bet, variant, current_player_index)
      VALUES (?, 'waiting', 0, ?, ?, ?, 0)
    `);
    stmt.run(gameId, minBet, minBet, variant);
    return this.getGame(gameId);
  }

  getGame(gameId) {
    const game = this.db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return null;

    // Get players
    const players = this.getGamePlayers(gameId);
    const admins = this.getGameAdmins(gameId);
    
    // Get cards for each player
    players.forEach(player => {
      player.cards = this.getPlayerCards(gameId, player.id);
      player.hasFolded = !!player.has_folded;
      player.hasSeen = !!player.has_seen;
      player.isAllIn = !!player.is_all_in;
    });

    return {
      id: game.id,
      status: game.status,
      pot: game.pot,
      currentBet: game.current_bet,
      minBet: game.min_bet,
      currentPlayerIndex: game.current_player_index,
      winnerId: game.winner_id,
      name: game.name,
      hostId: game.host_id,
      maxPlayers: game.max_players,
      callActive: !!game.call_active,
      isPrivate: !!game.is_private,
      spectatorLimit: game.spectator_limit,
      variant: game.variant,
      rulesRajkapoor135: !!game.rules_rajkapoor_135,
      rulesDoubleSeq235: !!game.rules_double_seq_235,
      rulesSpecial910Q: !!game.rules_special_910q,
      players: players,
      admins: admins,
    };
  }

  updateGame(gameId, updates) {
    const fields = [];
    const values = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.pot !== undefined) {
      fields.push('pot = ?');
      values.push(updates.pot);
    }
    if (updates.currentBet !== undefined) {
      fields.push('current_bet = ?');
      values.push(updates.currentBet);
    }
    if (updates.currentPlayerIndex !== undefined) {
      fields.push('current_player_index = ?');
      values.push(updates.currentPlayerIndex);
    }
    if (updates.winnerId !== undefined) {
      fields.push('winner_id = ?');
      values.push(updates.winnerId);
    }
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.hostId !== undefined) {
      fields.push('host_id = ?');
      values.push(updates.hostId);
    }
    if (updates.maxPlayers !== undefined) {
      fields.push('max_players = ?');
      values.push(updates.maxPlayers);
    }
    if (updates.callActive !== undefined) {
      fields.push('call_active = ?');
      values.push(updates.callActive ? 1 : 0);
    }
    if (updates.variant !== undefined) {
      fields.push('variant = ?');
      values.push(updates.variant);
    }
    if (updates.minBet !== undefined) {
      fields.push('min_bet = ?');
      values.push(updates.minBet);
    }
    if (updates.isPrivate !== undefined) {
      fields.push('is_private = ?');
      values.push(updates.isPrivate ? 1 : 0);
    }
    if (updates.spectatorLimit !== undefined) {
      fields.push('spectator_limit = ?');
      values.push(updates.spectatorLimit);
    }
    if (updates.rulesRajkapoor135 !== undefined) {
      fields.push('rules_rajkapoor_135 = ?');
      values.push(updates.rulesRajkapoor135 ? 1 : 0);
    }
    if (updates.rulesDoubleSeq235 !== undefined) {
      fields.push('rules_double_seq_235 = ?');
      values.push(updates.rulesDoubleSeq235 ? 1 : 0);
    }
    if (updates.rulesSpecial910Q !== undefined) {
      fields.push('rules_special_910q = ?');
      values.push(updates.rulesSpecial910Q ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push("updated_at = strftime('%s', 'now')");
      values.push(gameId);
      
      const stmt = this.db.prepare(`
        UPDATE games SET ${fields.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);
    }
  }

  deleteGame(gameId) {
    this.db.prepare('DELETE FROM games WHERE id = ?').run(gameId);
  }

  getAllGames() {
    return this.db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
  }

  // ==================== PLAYER OPERATIONS ====================

  createOrUpdatePlayer(playerId, playerName) {
    const existing = this.db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
    
    if (existing) {
      this.db.prepare("UPDATE players SET last_played = strftime('%s', 'now') WHERE id = ?").run(playerId);
    } else {
      this.db.prepare(`
        INSERT INTO players (id, name) VALUES (?, ?)
      `).run(playerId, playerName);
    }
    
    return this.getPlayer(playerId);
  }

  getPlayer(playerId) {
    return this.db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  }

  updatePlayerStats(playerId, won, chipsChange) {
    const stmt = this.db.prepare(`
      UPDATE players 
      SET games_played = games_played + 1,
          games_won = games_won + ?,
          total_winnings = total_winnings + ?,
          total_losses = total_losses + ?,
          last_played = strftime('%s', 'now')
      WHERE id = ?
    `);
    
    if (won) {
      stmt.run(1, chipsChange, 0, playerId);
    } else {
      stmt.run(0, 0, Math.abs(chipsChange), playerId);
    }
  }

  getLeaderboard(limit = 50) {
    return this.db.prepare(`
      SELECT * FROM players 
      ORDER BY games_won DESC, total_winnings DESC
      LIMIT ?
    `).all(limit);
  }

  // ==================== GAME PLAYER OPERATIONS ====================

  addPlayerToGame(gameId, player) {
    this.createOrUpdatePlayer(player.id, player.name);
    
    // Check if player already exists in this game
    const existingPlayer = this.db.prepare(`
      SELECT player_id FROM game_players WHERE game_id = ? AND player_id = ?
    `).get(gameId, player.id);
    
    if (existingPlayer) {
      console.log(`ℹ️ Player ${player.id} already in game ${gameId}, updating instead`);
      // Update existing player instead of inserting
      this.updateGamePlayer(gameId, player.id, {
        playerName: player.name,
        position: player.position,
        chips: player.chips || 1000,
        currentBet: player.currentBet || 0,
        hasFolded: player.hasFolded || false,
        hasSeen: player.hasSeen || false,
        isAllIn: player.isAllIn || false,
        socketId: player.socketId || null,
        isBot: !!player.isBot
      });
      return;
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO game_players 
      (game_id, player_id, player_name, position, chips, current_bet, has_folded, has_seen, is_all_in, socket_id, is_bot, is_ready)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      gameId, 
      player.id, 
      player.name, 
      player.position, 
      player.chips || 1000,
      player.currentBet || 0,
      player.hasFolded ? 1 : 0,
      player.hasSeen ? 1 : 0,
      player.isAllIn ? 1 : 0,
      player.socketId || null,
      player.isBot ? 1 : 0,
      player.isReady ? 1 : 0
    );
    
    console.log(`✅ Player ${player.id} added to game ${gameId}`);
  }

  getGamePlayers(gameId) {
    const players = this.db.prepare(`
      SELECT * FROM game_players WHERE game_id = ? ORDER BY position
    `).all(gameId);
    
    return players.map(p => ({
      id: p.player_id,
      name: p.player_name,
      position: p.position,
      chips: p.chips,
      currentBet: p.current_bet,
      hasFolded: !!p.has_folded,
      hasSeen: !!p.has_seen,
      isAllIn: !!p.is_all_in,
      socketId: p.socket_id,
      cards: [],
      isBot: !!p.is_bot,
      isReady: !!p.is_ready
    }));
  }

  updateGamePlayer(gameId, playerId, updates) {
    console.log('📝 updateGamePlayer called with:', { gameId, playerId, updates });
    
    const fields = [];
    const values = [];
    
    // Map camelCase to snake_case and only include valid database columns
    if (updates.playerName !== undefined) {
      fields.push('player_name = ?');
      values.push(updates.playerName);
    }
    if (updates.position !== undefined) {
      fields.push('position = ?');
      values.push(updates.position);
    }
    if (updates.chips !== undefined) {
      fields.push('chips = ?');
      values.push(updates.chips);
    }
    if (updates.currentBet !== undefined) {
      fields.push('current_bet = ?');
      values.push(updates.currentBet);
    }
    if (updates.hasFolded !== undefined) {
      fields.push('has_folded = ?');
      values.push(updates.hasFolded ? 1 : 0);
    }
    if (updates.hasSeen !== undefined) {
      fields.push('has_seen = ?');
      values.push(updates.hasSeen ? 1 : 0);
    }
    if (updates.isAllIn !== undefined) {
      fields.push('is_all_in = ?');
      values.push(updates.isAllIn ? 1 : 0);
    }
    if (updates.socketId !== undefined) {
      fields.push('socket_id = ?');
      values.push(updates.socketId);
    }
    if (updates.isBot !== undefined) {
      fields.push('is_bot = ?');
      values.push(updates.isBot ? 1 : 0);
    }
    if (updates.isReady !== undefined) {
      fields.push('is_ready = ?');
      values.push(updates.isReady ? 1 : 0);
    }
    
    // Note: isActive is not stored in database (in-memory only)
    // Silently ignore it if passed

    if (fields.length > 0) {
      values.push(gameId, playerId);
      const query = `UPDATE game_players SET ${fields.join(', ')} WHERE game_id = ? AND player_id = ?`;
      console.log('🔍 SQL Query:', query);
      console.log('🔍 Values:', values);
      
      try {
        const stmt = this.db.prepare(query);
        stmt.run(...values);
      } catch (error) {
        console.error('❌ Error updating game player:');
        console.error('   Query:', query);
        console.error('   Values:', values);
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
        // Don't throw - just log the error and continue
        // throw error;
      }
    } else {
      console.log('⚠️  No fields to update');
    }
  }

  removePlayerFromGame(gameId, playerId) {
    this.db.prepare('DELETE FROM game_players WHERE game_id = ? AND player_id = ?').run(gameId, playerId);
    this.db.prepare('DELETE FROM player_cards WHERE game_id = ? AND player_id = ?').run(gameId, playerId);
  }

  // ==================== GAME ADMINS ====================
  addAdmin(gameId, playerId) {
    this.db.prepare(`INSERT OR IGNORE INTO game_admins (game_id, player_id) VALUES (?, ?)`)
      .run(gameId, playerId);
  }
  removeAdmin(gameId, playerId) {
    this.db.prepare(`DELETE FROM game_admins WHERE game_id = ? AND player_id = ?`)
      .run(gameId, playerId);
  }
  getGameAdmins(gameId) {
    const rows = this.db.prepare(`SELECT player_id FROM game_admins WHERE game_id = ?`).all(gameId);
    return rows.map(r => r.player_id);
  }

  // ==================== CHAT ====================
  addChatMessage({ id, gameId, playerId, playerName, content }) {
    this.db.prepare(`
      INSERT OR REPLACE INTO game_chat (id, game_id, player_id, player_name, content, deleted)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(id, gameId, playerId, playerName, content);
  }
  editChatMessage({ id, content }) {
    this.db.prepare(`
      UPDATE game_chat SET content = ?, edited_at = strftime('%s','now') WHERE id = ?
    `).run(content, id);
  }
  deleteChatMessage({ id }) {
    this.db.prepare(`
      UPDATE game_chat SET deleted = 1, edited_at = strftime('%s','now') WHERE id = ?
    `).run(id);
  }
  getRecentChat(gameId, limit = 50) {
    return this.db.prepare(`
      SELECT id, player_id as playerId, player_name as playerName, content, deleted, created_at as createdAt, edited_at as editedAt
      FROM game_chat
      WHERE game_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(gameId, limit).reverse();
  }

  // ==================== CARD OPERATIONS ====================

  setPlayerCards(gameId, playerId, cards) {
    // Delete existing cards
    this.db.prepare('DELETE FROM player_cards WHERE game_id = ? AND player_id = ?').run(gameId, playerId);
    
    // Insert new cards
    const stmt = this.db.prepare(`
      INSERT INTO player_cards (game_id, player_id, card_suit, card_rank, card_index)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    cards.forEach((card, index) => {
      stmt.run(gameId, playerId, card.suit, card.rank, index);
    });
  }

  getPlayerCards(gameId, playerId) {
    const cards = this.db.prepare(`
      SELECT card_suit as suit, card_rank as rank 
      FROM player_cards 
      WHERE game_id = ? AND player_id = ?
      ORDER BY card_index
    `).all(gameId, playerId);
    
    return cards;
  }

  // ==================== ACTION LOGGING ====================

  logAction(gameId, playerId, action, amount = null) {
    this.db.prepare(`
      INSERT INTO game_actions (game_id, player_id, action, amount)
      VALUES (?, ?, ?, ?)
    `).run(gameId, playerId, action, amount);
  }

  getGameActions(gameId, limit = 100) {
    return this.db.prepare(`
      SELECT ga.*, p.name as player_name
      FROM game_actions ga
      JOIN players p ON ga.player_id = p.id
      WHERE ga.game_id = ?
      ORDER BY ga.timestamp DESC
      LIMIT ?
    `).all(gameId, limit);
  }

  getMovesCount(gameId, playerId) {
    const row = this.db.prepare(`
      SELECT COUNT(*) as cnt FROM game_actions WHERE game_id = ? AND player_id = ?
    `).get(gameId, playerId);
    return row ? row.cnt : 0;
  }

  addGameSettlements(gameId, roundNumber, settlements) {
    const stmt = this.db.prepare(`
      INSERT INTO game_settlements (game_id, round_number, player_id, final_chips, net_chips, moves_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const trx = this.db.transaction((items) => {
      for (const s of items) {
        stmt.run(gameId, roundNumber, s.playerId, s.finalChips, s.netChips, s.movesCount);
      }
    });
    trx(settlements);
  }

  addSettlementTransfers(gameId, roundNumber, transfers) {
    const stmt = this.db.prepare(`
      INSERT INTO game_settlement_transfers (game_id, round_number, from_player_id, to_player_id, amount)
      VALUES (?, ?, ?, ?, ?)
    `);
    const trx = this.db.transaction((items) => {
      for (const t of items) {
        stmt.run(gameId, roundNumber, t.from, t.to, t.amount);
      }
    });
    trx(transfers);
  }

  getGameSettlements(gameId, roundNumber = null) {
    if (roundNumber != null) {
      return this.db.prepare(`
        SELECT game_id as gameId, round_number as roundNumber, player_id as playerId, final_chips as finalChips, net_chips as netChips, moves_count as movesCount, created_at as createdAt
        FROM game_settlements
        WHERE game_id = ? AND round_number = ?
        ORDER BY net_chips DESC
      `).all(gameId, roundNumber);
    }
    return this.db.prepare(`
      SELECT game_id as gameId, round_number as roundNumber, player_id as playerId, final_chips as finalChips, net_chips as netChips, moves_count as movesCount, created_at as createdAt
      FROM game_settlements
      WHERE game_id = ?
      ORDER BY round_number ASC, net_chips DESC
    `).all(gameId);
  }

  getSettlementTransfers(gameId, roundNumber = null) {
    if (roundNumber != null) {
      return this.db.prepare(`
        SELECT game_id as gameId, round_number as roundNumber, from_player_id as fromPlayerId, to_player_id as toPlayerId, amount, created_at as createdAt
        FROM game_settlement_transfers
        WHERE game_id = ? AND round_number = ?
        ORDER BY id ASC
      `).all(gameId, roundNumber);
    }
    return this.db.prepare(`
      SELECT game_id as gameId, round_number as roundNumber, from_player_id as fromPlayerId, to_player_id as toPlayerId, amount, created_at as createdAt
      FROM game_settlement_transfers
      WHERE game_id = ?
      ORDER BY round_number ASC, id ASC
    `).all(gameId);
  }

  // ==================== GAME HISTORY ====================

  getPlayerGameHistory(playerId, limit = 20) {
    // Get all finished games for this player
    const games = this.db.prepare(`
      SELECT 
        g.id,
        g.status,
        g.pot,
        g.winner_id,
        g.created_at,
        g.updated_at,
        g.finished_at,
        gp.chips as player_chips,
        gp.current_bet as player_bet,
        gp.has_folded as player_folded,
        gp.has_seen as player_seen
      FROM games g
      JOIN game_players gp ON g.id = gp.game_id
      WHERE gp.player_id = ? AND g.status = 'finished'
      ORDER BY g.finished_at DESC
      LIMIT ?
    `).all(playerId, limit);

    // Enrich each game with full details
    return games.map(game => {
      const players = this.getGamePlayers(game.id);
      const actions = this.getGameActions(game.id, 10);
      
      // Calculate duration
      const duration = game.finished_at && game.created_at 
        ? game.finished_at - game.created_at 
        : 0;

      // Player's result
      const playerWon = game.winner_id === playerId;
      const playerData = players.find(p => p.id === playerId);
      const chipsChange = playerWon 
        ? game.pot - (playerData?.currentBet || 0) 
        : -(playerData?.currentBet || 0);

      return {
        id: game.id,
        status: game.status,
        pot: game.pot,
        winnerId: game.winner_id,
        createdAt: game.created_at,
        finishedAt: game.finished_at,
        duration: duration,
        playerResult: {
          won: playerWon,
          chips: game.player_chips,
          chipsChange: chipsChange,
          hasSeen: !!game.player_seen,
          hasFolded: !!game.player_folded,
        },
        players: players,
        lastActions: actions.slice(0, 5).map(a => ({
          action: a.action,
          playerId: a.player_id,
          playerName: a.player_name,
          amount: a.amount,
          timestamp: a.timestamp
        }))
      };
    });
  }

  // ==================== UTILITY ====================

  close() {
    this.db.close();
  }

  // Clean up old finished games (optional cleanup)
  cleanupOldGames(daysOld = 7) {
    const cutoffTime = Math.floor(Date.now() / 1000) - (daysOld * 24 * 60 * 60);
    this.db.prepare(`
      DELETE FROM games 
      WHERE status = 'finished' AND updated_at < ?
    `).run(cutoffTime);
  }
}

module.exports = GameDatabase;

