import { NextResponse } from 'next/server';

// Use CommonJS require for the existing db wrapper
// eslint-disable-next-line @typescript-eslint/no-var-requires
const GameDatabase = require('@/database/db');

export async function GET(_req: Request, ctx: { params: { gameId: string } }) {
  try {
    const { gameId } = ctx.params;
    const db = new GameDatabase();

    const game = db.getGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const players = db.getGamePlayers(gameId);
    const playersWithCards = players.map((p: any) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      chips: p.chips,
      hasSeen: p.hasSeen,
      hasFolded: p.hasFolded,
      cards: db.getPlayerCards(gameId, p.id),
    }));

    const actions = db.getGameActions(gameId, 500).map((a: any) => ({
      action: a.action,
      amount: a.amount,
      playerId: a.player_id,
      playerName: a.player_name,
      timestamp: a.timestamp,
    }));

    // Settlements and transfers for all rounds for this game
    const settlements = db.getGameSettlements(gameId);
    const transfers = db.getSettlementTransfers(gameId);

    const report = {
      gameId: game.id,
      tableName: game.name || null,
      variant: game.variant,
      status: game.status,
      pot: game.pot,
      minBet: game.minBet,
      hostId: game.hostId || null,
      createdAt: game.created_at || null,
      finishedAt: game.finished_at || null,
      winnerId: game.winnerId || game.winner_id || null,
      players: playersWithCards,
      actions,
      settlements,
      transfers,
    };

    return NextResponse.json(report);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build report' }, { status: 500 });
  }
}


