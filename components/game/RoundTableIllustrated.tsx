'use client';

import { motion } from 'framer-motion';
import { GameState } from '@/types/game';

interface RoundTableProps {
  gameState: GameState;
  currentPlayerId: string;
}

export function RoundTableIllustrated({ gameState, currentPlayerId }: RoundTableProps) {
  const players = gameState.players;

  // Professional illustration-style positions (like the image)
  const getPlayerPosition = (index: number, total: number) => {
    if (total === 3) {
      const positions = [
        { top: '5%', left: '50%', transform: 'translateX(-50%)' },       // Top center
        { bottom: '10%', left: '15%', transform: 'translateX(-50%)' },   // Bottom left
        { bottom: '10%', right: '15%', transform: 'translateX(50%)' },   // Bottom right
      ];
      return positions[index];
    } else if (total === 2) {
      const positions = [
        { top: '50%', left: '15%', transform: 'translate(-50%, -50%)' },  // Left
        { top: '50%', right: '15%', transform: 'translate(50%, -50%)' },  // Right
      ];
      return positions[index];
    }
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  };

  return (
    <div className="relative w-full h-[700px] max-w-6xl mx-auto bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-3xl shadow-2xl overflow-hidden">
      {/* Casino Table - Professional Illustration Style */}
      <div 
        className="absolute left-1/2 top-1/2 w-[550px] h-[550px] rounded-full"
        style={{
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #8B4513 0%, #654321 50%, #5D4037 100%)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.4), inset 0 0 60px rgba(0,0,0,0.3)',
          border: '18px solid #4a2511',
        }}
      >
        {/* Felt Surface */}
        <div 
          className="absolute inset-5 rounded-full"
          style={{
            background: 'radial-gradient(circle, #2d5016 0%, #1a4d0d 100%)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Table decorative rings */}
          <div className="absolute inset-12 rounded-full border-4 border-green-700/20"></div>
          <div className="absolute inset-20 rounded-full border-2 border-green-600/15"></div>
        </div>

        {/* Center Pot Display */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Chip Stack */}
          <div className="relative w-24 h-20">
            {/* Multiple chip layers */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 w-20 h-5 rounded-full"
                style={{
                  bottom: `${i * 3}px`,
                  background: 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)',
                  boxShadow: `
                    0 2px 8px rgba(0,0,0,0.3),
                    inset 0 1px 2px rgba(255,255,255,0.3),
                    inset 0 -1px 2px rgba(0,0,0,0.3)
                  `,
                  border: '2px solid white',
                }}
              />
            ))}
            {/* POT Amount */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 bg-yellow-500 text-white font-black text-lg px-4 py-1 rounded-full shadow-xl"
              style={{ bottom: '20px' }}
            >
              💰 {gameState.pot}
            </div>
          </div>
        </motion.div>

        {/* Center Cards (Face-down) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-12 flex gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotateZ: -180 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ delay: i * 0.1 }}
              className="w-16 h-24 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-xl">
                🎴
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Players - Professional Illustration Style */}
      {players.map((player, index) => {
        const position = getPlayerPosition(index, players.length);
        const isCurrentPlayer = player.id === currentPlayerId;
        const isCurrentTurn = gameState.currentTurn === player.id;
        const hasFolded = player.hasFolded;

        return (
          <motion.div
            key={player.id}
            className="absolute"
            style={position}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.2 }}
          >
            {/* Player Container */}
            <div className="relative flex flex-col items-center">
              {/* Player Avatar & Chair */}
              <div className="relative">
                {/* Chair - Wooden Style (like image) */}
                <div className="relative w-28 h-32">
                  {/* Chair Back */}
                  <div 
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-24 h-28 rounded-t-2xl"
                    style={{
                      background: isCurrentPlayer 
                        ? 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)'
                        : 'linear-gradient(180deg, #8B4513 0%, #654321 100%)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.2)',
                      border: '3px solid ' + (isCurrentPlayer ? '#60a5fa' : '#5D4037'),
                    }}
                  />
                  {/* Chair Seat */}
                  <div 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-6 rounded-xl"
                    style={{
                      background: isCurrentPlayer 
                        ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                        : 'linear-gradient(180deg, #8B4513 0%, #654321 100%)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
                      border: '3px solid ' + (isCurrentPlayer ? '#60a5fa' : '#5D4037'),
                    }}
                  />
                  {/* Chair Legs */}
                  <div className="absolute bottom-0 left-3 w-2 h-5 bg-gray-800 rounded-b"></div>
                  <div className="absolute bottom-0 right-3 w-2 h-5 bg-gray-800 rounded-b"></div>
                </div>

                {/* Player Figure - Illustration Style */}
                <div 
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
                  style={{
                    filter: hasFolded ? 'grayscale(1) opacity(0.5)' : 'none'
                  }}
                >
                  {/* Head */}
                  <div 
                    className="w-14 h-16 rounded-[50%] mb-1"
                    style={{
                      background: 'linear-gradient(180deg, #ffdbac 0%, #ffc896 100%)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    {/* Hair */}
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-8 rounded-t-full"
                      style={{
                        background: isCurrentPlayer ? '#2c3e50' : '#654321',
                      }}
                    />
                    {/* Face */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-10 rounded-[50%] bg-[#ffdbac]">
                      {/* Eyes */}
                      <div className="absolute top-3 left-2 w-2 h-2 rounded-full bg-gray-900"></div>
                      <div className="absolute top-3 right-2 w-2 h-2 rounded-full bg-gray-900"></div>
                    </div>
                  </div>

                  {/* Body/Torso */}
                  <div 
                    className="w-20 h-24 rounded-t-3xl"
                    style={{
                      background: isCurrentPlayer 
                        ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                        : 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Arms */}
                    <div className="absolute top-4 -left-5 w-6 h-20 rounded-l-full bg-gradient-to-b from-[#3b82f6] to-[#2563eb]" 
                      style={{
                        transform: 'rotate(-15deg)',
                        background: isCurrentPlayer 
                          ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                          : 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
                      }}
                    />
                    <div className="absolute top-4 -right-5 w-6 h-20 rounded-r-full"
                      style={{
                        transform: 'rotate(15deg)',
                        background: isCurrentPlayer 
                          ? 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                          : 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
                      }}
                    />
                  </div>

                  {/* Turn Indicator */}
                  {isCurrentTurn && !hasFolded && (
                    <motion.div
                      className="absolute -top-2 left-1/2 -translate-x-1/2"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xl">
                        YOUR TURN
                      </div>
                    </motion.div>
                  )}

                  {/* Cards in Hand */}
                  {player.cards && player.cards.length > 0 && !hasFolded && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1">
                      {player.cards.map((card, i) => (
                        <div
                          key={i}
                          className="w-10 h-14 rounded-lg bg-white shadow-xl flex flex-col items-center justify-center"
                          style={{
                            transform: `rotate(${(i - 1) * 5}deg)`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          }}
                        >
                          {player.hasSeen ? (
                            <>
                              <span className={`text-xl font-bold ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}`}>
                                {card.rank}
                              </span>
                              <span className={`text-2xl ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}`}>
                                {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                              </span>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg">
                              <span className="text-white text-lg">🎴</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Player Info */}
              <div className={`
                mt-4 px-4 py-2 rounded-xl font-bold text-sm shadow-lg
                ${isCurrentPlayer 
                  ? 'bg-blue-500 text-white border-2 border-blue-300' 
                  : 'bg-white text-gray-800 border-2 border-gray-300'}
                ${hasFolded ? 'opacity-50' : ''}
              `}>
                <div className="text-center">
                  {player.name} {isCurrentPlayer && '👑'}
                </div>
                <div className="text-center text-xs mt-1">
                  💰 {player.chips} chips
                </div>
                {player.currentBet > 0 && (
                  <div className="text-center text-xs mt-1 bg-red-500 text-white px-2 py-0.5 rounded">
                    Bet: {player.currentBet}
                  </div>
                )}
                {hasFolded && (
                  <div className="text-center text-xs mt-1 text-red-600 font-bold">
                    ❌ FOLDED
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

