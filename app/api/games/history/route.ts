import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Import database
const GameDatabase = require('@/database/db');
const db = new GameDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const playerId = searchParams.get('playerId') || session?.user?.id;
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 400 }
      );
    }

    // Fetch from real database
    const gameHistory = db.getPlayerGameHistory(playerId, limit);
    
    console.log(`✓ Fetched ${gameHistory.length} games for player ${playerId}`);
    
    // If no games found, return empty array (not mock data)
    if (gameHistory.length === 0) {
      console.log('  No games found in database');
      return NextResponse.json([]);
    }
    
    return NextResponse.json(gameHistory);
  } catch (error) {
    console.error('Error fetching game history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

