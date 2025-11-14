-- Teen Patti Game Database Schema

-- Games table - stores game information
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
    pot INTEGER NOT NULL DEFAULT 0,
    current_bet INTEGER NOT NULL DEFAULT 10,
    min_bet INTEGER NOT NULL DEFAULT 10,
    variant TEXT NOT NULL DEFAULT 'classic', -- game variant (classic, ak47, muflis, etc.)
    current_player_index INTEGER NOT NULL DEFAULT 0,
    winner_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    finished_at INTEGER
);

-- Players table - stores player information with OAuth support
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    image TEXT,
    oauth_provider TEXT, -- 'google', 'facebook', or NULL for guest
    oauth_id TEXT, -- ID from OAuth provider
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    total_winnings INTEGER NOT NULL DEFAULT 0,
    total_losses INTEGER NOT NULL DEFAULT 0,
    last_played INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    UNIQUE(oauth_provider, oauth_id)
);

-- Game Players table - many-to-many relationship
CREATE TABLE IF NOT EXISTS game_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    chips INTEGER NOT NULL DEFAULT 1000,
    current_bet INTEGER NOT NULL DEFAULT 0,
    has_folded INTEGER NOT NULL DEFAULT 0, -- SQLite uses 0/1 for boolean
    has_seen INTEGER NOT NULL DEFAULT 0,
    is_all_in INTEGER NOT NULL DEFAULT 0,
    socket_id TEXT,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(game_id, player_id)
);

-- Cards table - stores cards dealt to players
CREATE TABLE IF NOT EXISTS player_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    card_suit TEXT NOT NULL, -- hearts, diamonds, clubs, spades
    card_rank TEXT NOT NULL, -- 2-10, J, Q, K, A
    card_index INTEGER NOT NULL, -- 0, 1, 2 (for ordering)
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(game_id, player_id, card_index)
);

-- Game Actions table - log of all game actions
CREATE TABLE IF NOT EXISTS game_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    action TEXT NOT NULL, -- join, bet, call, raise, fold, see, show
    amount INTEGER,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_players_game ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player ON game_players(player_id);
CREATE INDEX IF NOT EXISTS idx_player_cards_game_player ON player_cards(game_id, player_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_game ON game_actions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_player ON game_actions(player_id);

