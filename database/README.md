# Teen Patti Game Database

This project now uses **SQLite** database for persistent game data storage instead of in-memory storage.

## 🎯 Benefits of Database-Driven Approach

### Before (In-Memory):
- ❌ All data lost on server restart
- ❌ No game history
- ❌ No player statistics
- ❌ Can't recover from crashes
- ❌ No audit trail

### After (Database-Driven):
- ✅ **Persistent Storage** - Data survives server restarts
- ✅ **Game History** - All games and actions logged
- ✅ **Player Statistics** - Track wins, losses, total earnings
- ✅ **Crash Recovery** - Games can be resumed
- ✅ **Audit Trail** - Complete history of all actions
- ✅ **Leaderboard** - Real persistent player rankings
- ✅ **Analytics** - Query game data for insights

## 📊 Database Schema

### Tables:

1. **games** - Stores game information
   - `id` (TEXT) - Game ID
   - `status` - waiting/playing/finished
   - `pot` - Current pot amount
   - `current_bet` - Current bet amount
   - `min_bet` - Minimum bet
   - `current_player_index` - Index of current player
   - `winner_id` - Winner player ID
   - Timestamps

2. **players** - Stores player profiles
   - `id` (TEXT) - Player ID
   - `name` - Player name
   - `games_played` - Total games
   - `games_won` - Total wins
   - `total_winnings` - Total chips won
   - `total_losses` - Total chips lost
   - Timestamps

3. **game_players** - Links players to games
   - Game-specific player data
   - Current chips, bets, status
   - Position in game
   - Socket ID for reconnection

4. **player_cards** - Stores dealt cards
   - Game ID + Player ID
   - Card suit and rank
   - Card index (for ordering)

5. **game_actions** - Logs all game actions
   - Player actions (join, bet, raise, fold, see, show)
   - Amounts
   - Timestamps
   - Complete audit trail

## 🚀 Usage

### Starting the Server

```bash
npm run dev:unified
```

The database will be automatically created at `database/teenpatti.db` on first run.

### Database Location

- **Development**: `database/teenpatti.db`
- **Automatic**: Created on first server start
- **SQLite**: No separate database server needed

## 📝 API Changes

### All game operations now persist to database:

#### Game Creation
```javascript
const game = new TeenPatiGame(gameId, minBet);
// Automatically creates game in database
```

#### Player Actions
```javascript
game.addPlayer(playerId, name, position, socketId);
// Saves player to database
// Logs 'join' action

game.handlePlayerAction(playerId, { type: 'CALL' });
// Saves bet to database
// Logs 'call' action
// Updates game state
```

#### Game State
```javascript
game.saveToDatabase();
// Manually save current state

TeenPatiGame.loadFromDatabase(gameId);
// Load game from database
```

## 🔍 Querying the Database

### View Player Stats
```javascript
const stats = db.getPlayer(playerId);
console.log(stats.games_played, stats.games_won);
```

### View Leaderboard
```javascript
const leaderboard = db.getLeaderboard(50);
leaderboard.forEach(player => {
  console.log(player.name, player.total_winnings);
});
```

### View Game History
```javascript
const actions = db.getGameActions(gameId);
actions.forEach(action => {
  console.log(action.player_name, action.action, action.amount);
});
```

### Get All Games
```javascript
const games = db.getAllGames();
console.log(`Total games: ${games.length}`);
```

## 🛠️ Maintenance

### Cleanup Old Games
```javascript
db.cleanupOldGames(7); // Delete finished games older than 7 days
```

### Backup Database
```bash
# Copy the database file
cp database/teenpatti.db database/backups/teenpatti_backup_$(date +%Y%m%d).db
```

### View Database
```bash
# Install sqlite3 command line tool
sqlite3 database/teenpatti.db

# Run queries
sqlite> SELECT * FROM games;
sqlite> SELECT * FROM players ORDER BY total_winnings DESC LIMIT 10;
sqlite> SELECT * FROM game_actions WHERE game_id = 'game-123';
```

## 📈 Performance

- **SQLite** - Fast, embedded database
- **WAL Mode** - Better concurrency
- **Indexes** - Optimized queries
- **In-Memory Cache** - Active games cached for speed
- **Auto-save** - All actions auto-persisted

## 🔒 Data Integrity

- **Foreign Keys** - Enforced relationships
- **Cascade Delete** - Clean data removal
- **Transactions** - Atomic operations
- **Unique Constraints** - Prevent duplicates

## 📊 Example Queries

### Top 10 Players
```sql
SELECT name, games_won, total_winnings 
FROM players 
ORDER BY total_winnings DESC 
LIMIT 10;
```

### Recent Game Actions
```sql
SELECT p.name, ga.action, ga.amount, ga.timestamp
FROM game_actions ga
JOIN players p ON ga.player_id = p.id
WHERE ga.game_id = 'game-xyz'
ORDER BY ga.timestamp DESC;
```

### Player Win Rate
```sql
SELECT name, 
       games_played, 
       games_won,
       ROUND(games_won * 100.0 / games_played, 2) as win_rate
FROM players
WHERE games_played > 0
ORDER BY win_rate DESC;
```

## 🎮 Features Enabled by Database

1. **Persistent Leaderboards** - Real rankings across sessions
2. **Game History** - View past games and outcomes
3. **Player Profiles** - Lifetime statistics
4. **Reconnection** - Resume games after disconnect
5. **Crash Recovery** - No data loss on server crash
6. **Analytics Dashboard** - Potential for future analytics
7. **Audit Trail** - Complete game action history
8. **Anti-Cheat** - Track suspicious patterns

## 🚦 Migration from In-Memory

The migration is **automatic**. The server will:
1. Create database on first run
2. Continue using in-memory cache for active games
3. Persist all state changes to database
4. No manual migration needed

## 💡 Future Enhancements

Possible future features:
- PostgreSQL/MySQL support for scaling
- Real-time analytics dashboard
- Player achievements and badges
- Tournament support
- Game replay functionality
- Advanced statistics and graphs

---

**Database initialized and ready!** 🎉

All game data is now persistent and queryable.

