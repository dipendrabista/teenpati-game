import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Import database
const GameDatabase = require('@/database/db');
const db = new GameDatabase();

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const playerId = session.user.id;

    // Fetch from real database
    let player = db.getPlayer(playerId);
    
    // If player doesn't exist, create with defaults
    if (!player) {
      console.log(`Creating new player record for ${playerId}`);
      db.createOrUpdatePlayer(playerId, session.user.name || 'Player');
      player = db.getPlayer(playerId);
    }

    const stats = {
      gamesPlayed: player.games_played || 0,
      gamesWon: player.games_won || 0,
      totalWinnings: player.total_winnings || 0,
      totalLosses: player.total_losses || 0,
      winRate: player.games_played > 0 
        ? Math.round((player.games_won / player.games_played) * 100) 
        : 0,
      lastPlayed: player.last_played 
        ? new Date(player.last_played * 1000).toLocaleDateString()
        : 'Never',
      playerId: playerId,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image
    };

    console.log(`✓ Fetched stats for player ${playerId}: ${stats.gamesPlayed} games`);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

