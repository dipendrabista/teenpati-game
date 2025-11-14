import { NextResponse } from 'next/server';

// Import database
const GameDatabase = require('@/database/db');
const db = new GameDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch from real database
    const allPlayers = db.getLeaderboard(limit);
    
    const leaderboard = allPlayers.map((player: any, index: number) => ({
      rank: index + 1,
      id: player.id,
      name: player.name,
      email: player.email || null,
      image: player.image || null,
      gamesPlayed: player.games_played || 0,
      gamesWon: player.games_won || 0,
      totalWinnings: player.total_winnings || 0,
      totalLosses: player.total_losses || 0,
      winRate: player.games_played > 0 
        ? Math.round((player.games_won / player.games_played) * 100)
        : 0,
      lastPlayed: player.last_played 
        ? new Date(player.last_played * 1000).toLocaleDateString()
        : 'Never'
    }));

    console.log(`✓ Fetched leaderboard: ${leaderboard.length} players`);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

