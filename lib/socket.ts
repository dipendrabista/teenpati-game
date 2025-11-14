'use client';

import { io, Socket } from 'socket.io-client';
import { GameState, GameMessage, Player } from '@/types/game';

// Dynamic socket URL - works with localhost, ngrok, and unified server
function getSocketURL(): string {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // For ngrok (no port in URL OR hostname contains 'ngrok'), use the same domain on port 3003
    if (hostname.includes('ngrok') || (!port && !hostname.includes('localhost'))) {
      console.log('🔌 Using Ngrok mode - connecting to port 3003');
      // IMPORTANT: For ngrok with separate servers, we need to tunnel BOTH ports
      // For now, connect to same domain assuming unified server or proper setup
      return `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }
    
    // Check if using unified server (port 3000)
    if (port === '3000') {
      // Unified server - socket on same port
      return `${protocol}//${hostname}:${port}`;
    }
    
    // For localhost with separate servers, use port 3003
    return `${protocol}//${hostname}:3003`;
  }
  
  // Server-side fallback
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
}

export class GameSocket {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(gameId: string, playerId: string, playerName: string) {
    // If already connected, just rejoin the game
    if (this.socket?.connected) {
      console.log('🔄 Already connected, rejoining game...');
      this.emit('join_game', { gameId, playerId, playerName });
      return;
    }

    // If socket exists but disconnected, disconnect it properly first
    if (this.socket) {
      console.log('🧹 Cleaning up old socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const socketURL = getSocketURL();

    this.socket = io(socketURL, {
      query: {
        gameId,
        playerId,
        playerName,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
      path: '/socket.io/',
    });

    this.socket.on('connect', () => {
      this.emit('join_game', { gameId, playerId, playerName });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('Socket URL:', socketURL);
      this.emitToListeners('error', { message: `Connection failed: ${error.message}` });
    });

    this.socket.on('disconnect', (_reason) => {
    });

    this.socket.on('game_state', (state: GameState) => {
      this.emitToListeners('game_state', state);
    });

    this.socket.on('game_message', (message: GameMessage) => {
      this.emitToListeners('game_message', message);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('🚫 Game error:', error.message);
      this.emitToListeners('error', error);
    });

    // Passthrough for arbitrary server events (chat, nudge, typing, presence, etc.)
    // Avoid duplicating core events already handled above
    this.socket.onAny((event: string, ...args: any[]) => {
      if (['connect', 'connect_error', 'disconnect', 'game_state', 'game_message', 'error'].includes(event)) {
        return;
      }
      // Emit first argument as payload
      this.emitToListeners(event, args[0]);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }
  
  // Clean listeners without disconnecting socket
  cleanListeners() {
    console.log('🧹 Cleaning socket listeners...');
    this.listeners.clear();
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    this.listeners.get(event)?.delete(callback);
  }

  private emitToListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Game-specific methods
  joinGame(gameId: string, playerId: string, playerName: string) {
    this.emit('join_game', { gameId, playerId, playerName });
  }

  leaveGame(gameId: string, playerId: string) {
    this.emit('leave_game', { gameId, playerId });
  }

  playerReady(gameId: string, playerId: string) {
    this.emit('player_ready', { gameId, playerId });
  }

  makeMove(gameId: string, playerId: string, move: any) {
    this.emit('player_move', { gameId, playerId, move });
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
let gameSocketInstance: GameSocket | null = null;

export function getGameSocket(): GameSocket {
  if (!gameSocketInstance) {
    gameSocketInstance = new GameSocket();
  }
  return gameSocketInstance;
}

