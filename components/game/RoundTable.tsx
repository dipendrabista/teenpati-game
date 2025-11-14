'use client';

import { motion } from 'framer-motion';
import { Trophy, Coins, User } from 'lucide-react';
import { GameState } from '@/types/game';
import { Card } from '@/components/ui/card';

interface RoundTableProps {
  gameState: GameState;
  currentPlayerId: string;
}

// Chair Component - 3D Design
function Chair({ isCurrentPlayer }: { isCurrentPlayer: boolean }) {
  return (
    <div 
      className="relative w-14 h-16"
      style={{ 
        transformStyle: 'preserve-3d',
        transform: 'rotateX(10deg)'
      }}
    >
      {/* Chair Back - 3D */}
      <div className={`
        absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-14 rounded-t-lg
        ${isCurrentPlayer 
          ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 border-blue-400' 
          : 'bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 border-amber-600'}
        border-2
      `}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: `
          0 8px 16px rgba(0, 0, 0, 0.4),
          inset 0 2px 8px rgba(255, 255, 255, 0.1),
          inset 0 -2px 8px rgba(0, 0, 0, 0.3)
        `
      }}
      >
        {/* Chair padding/cushion */}
        <div className="absolute inset-1.5 rounded-t-md bg-gradient-to-b from-white/20 to-transparent"></div>
        {/* Vertical support bars - 3D */}
        <div 
          className="absolute top-1.5 left-2 w-1 h-10 bg-black/30 rounded-full"
          style={{ transform: 'translateZ(4px)' }}
        ></div>
        <div 
          className="absolute top-1.5 right-2 w-1 h-10 bg-black/30 rounded-full"
          style={{ transform: 'translateZ(4px)' }}
        ></div>
      </div>
      
      {/* Chair Seat - 3D */}
      <div className={`
        absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-4 rounded-md
        ${isCurrentPlayer 
          ? 'bg-gradient-to-b from-blue-600 to-blue-800 border-blue-500' 
          : 'bg-gradient-to-b from-amber-700 to-amber-900 border-amber-700'}
        border-2
      `}
      style={{
        transformStyle: 'preserve-3d',
        transform: 'rotateX(-5deg)',
        boxShadow: `
          0 6px 12px rgba(0, 0, 0, 0.4),
          inset 0 2px 4px rgba(255, 255, 255, 0.15)
        `
      }}
      >
        {/* Seat cushion texture */}
        <div className="absolute inset-0.5 rounded-sm bg-gradient-to-b from-white/15 to-transparent"></div>
      </div>
      
      {/* Chair Legs - 3D with depth */}
      <div 
        className="absolute bottom-0 left-1.5 w-1.5 h-3 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b"
        style={{
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          transform: 'translateZ(-2px)'
        }}
      ></div>
      <div 
        className="absolute bottom-0 right-1.5 w-1.5 h-3 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b"
        style={{
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          transform: 'translateZ(-2px)'
        }}
      ></div>
      <div 
        className="absolute bottom-0 left-4 w-1.5 h-2.5 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b"
        style={{
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
        }}
      ></div>
      <div 
        className="absolute bottom-0 right-4 w-1.5 h-2.5 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b"
        style={{
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
        }}
      ></div>
    </div>
  );
}

export function RoundTable({ gameState, currentPlayerId }: RoundTableProps) {
  const players = gameState.players;
  
  // Get player position and rotation based on index (3 players max)
  const getPlayerStyle = (index: number, total: number) => {
    if (total === 3) {
      // Top, Bottom-Left, Bottom-Right
      const positions = [
        { position: 'top-0 left-1/2 -translate-x-1/2', rotation: 'rotate-0' },         // Top (facing down)
        { position: 'bottom-[5%] left-[15%] -translate-x-1/2', rotation: 'rotate-0' }, // Bottom-Left (facing up)
        { position: 'bottom-[5%] right-[15%] translate-x-1/2', rotation: 'rotate-0' }, // Bottom-Right (facing up)
      ];
      return positions[index];
    } else if (total === 2) {
      // Left and Right
      const positions = [
        { position: 'top-1/2 left-[5%] -translate-y-1/2', rotation: 'rotate-90' },   // Left (facing right)
        { position: 'top-1/2 right-[5%] -translate-y-1/2', rotation: '-rotate-90' }, // Right (facing left)
      ];
      return positions[index];
    }
    return { position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', rotation: 'rotate-0' };
  };

  return (
    <div 
      className="relative w-full max-w-5xl mx-auto" 
      style={{ 
        height: '600px',
        perspective: '1200px',
        perspectiveOrigin: 'center center'
      }}
    >
      {/* Green Dining Table in Center - 3D */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]">
        <motion.div
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', duration: 0.8, bounce: 0.3 }}
          className="relative w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: 'rotateX(15deg)',
          }}
        >
          {/* Table Surface - 3D with depth */}
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-green-700 via-green-600 to-green-800 shadow-2xl border-8 border-amber-900"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.5),
                0 30px 80px rgba(0, 0, 0, 0.3),
                inset 0 -10px 40px rgba(0, 0, 0, 0.3),
                inset 0 10px 40px rgba(255, 255, 255, 0.1)
              `
            }}
          >
            {/* Table 3D Edge/Side */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-900 to-amber-950"
              style={{
                transform: 'translateZ(-20px)',
                filter: 'brightness(0.6)'
              }}
            ></div>
            
            {/* Table Pattern */}
            <div className="absolute inset-0 rounded-full opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full border-4 border-dashed border-white/50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full border-4 border-dashed border-white/30"></div>
            </div>

            {/* Pot in Center - 3D */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ 
                transformStyle: 'preserve-3d',
                transform: 'translateZ(30px)'
              }}
            >
              <div 
                className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full p-5 border-4 border-yellow-300"
                style={{
                  boxShadow: `
                    0 20px 40px rgba(0, 0, 0, 0.4),
                    0 10px 20px rgba(0, 0, 0, 0.3),
                    inset 0 -4px 12px rgba(0, 0, 0, 0.2),
                    inset 0 4px 12px rgba(255, 255, 255, 0.3)
                  `
                }}
              >
                <div className="text-center">
                  <Trophy className="h-7 w-7 text-white mx-auto mb-1 drop-shadow-lg" />
                  <p className="text-xs font-bold text-white/90">POT</p>
                  <p className="text-3xl font-black text-white drop-shadow-md">{gameState.pot}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Coins className="h-4 w-4 text-white/90" />
                    <span className="text-xs text-white/90 font-semibold">chips</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Current Bet Indicator */}
            {gameState.currentBet > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-[15%] left-1/2 -translate-x-1/2"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full px-4 py-1.5 shadow-xl border-2 border-white">
                  <p className="text-xs font-bold text-white">Bet: {gameState.currentBet}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Players Around the Table */}
      {players.map((player, index) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isCurrentTurn = gameState.currentTurn === player.id;
        const hasFolded = player.hasFolded;
        const playerStyle = getPlayerStyle(index, players.length);
        
        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.2, type: 'spring' }}
            className={`absolute ${playerStyle.position} z-20 ${playerStyle.rotation}`}
          >
            <div className="flex flex-col items-center gap-2">
              {/* Chair */}
              <Chair isCurrentPlayer={isCurrentPlayer} />
              
              {/* Realistic Human Sitting on Chair - 3D */}
              <div 
                className="absolute top-4 left-1/2 -translate-x-1/2"
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)'
                }}
              >
                <motion.div
                  animate={isCurrentTurn && !hasFolded ? {
                    scale: [1, 1.05, 1],
                    y: [0, -2, 0],
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="relative"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Human Figure */}
                  <div className="relative flex flex-col items-center">
                    
                    {/* Head/Avatar - 3D */}
                    <div 
                      className={`
                        relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-white border-3 z-20
                        ${isCurrentPlayer 
                          ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 border-blue-300' 
                          : 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900 border-gray-400'}
                        ${hasFolded ? 'opacity-40 grayscale' : ''}
                        ${isCurrentTurn && !hasFolded ? 'ring-4 ring-green-400 ring-offset-2 ring-offset-amber-100' : ''}
                      `}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: 'translateZ(15px)',
                        boxShadow: `
                          0 15px 30px rgba(0, 0, 0, 0.4),
                          0 5px 15px rgba(0, 0, 0, 0.3),
                          inset 0 -3px 8px rgba(0, 0, 0, 0.3),
                          inset 0 3px 8px rgba(255, 255, 255, 0.2)
                        `
                      }}
                    >
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <div className="text-xl">👤</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Turn Indicator Badge */}
                      {isCurrentTurn && !hasFolded && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          className="absolute -top-1.5 -right-1.5 z-30"
                        >
                          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1 border-2 border-white shadow-xl">
                            <Trophy className="h-3 w-3 text-white drop-shadow-md" />
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Folded Indicator */}
                      {hasFolded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-30">
                          <span className="text-lg">❌</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Neck */}
                    <div className={`
                      w-4 h-2 rounded-b-sm z-10
                      ${isCurrentPlayer 
                        ? 'bg-gradient-to-b from-blue-400 to-blue-500' 
                        : 'bg-gradient-to-b from-gray-500 to-gray-600'}
                      ${hasFolded ? 'opacity-40' : ''}
                    `}></div>
                    
                    {/* Upper Body/Torso - 3D */}
                    <div 
                      className={`
                        relative w-16 h-10 rounded-t-lg z-10
                        ${isCurrentPlayer 
                          ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 border-blue-400' 
                          : 'bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 border-gray-500'}
                        border-2
                        ${hasFolded ? 'opacity-40' : ''}
                      `}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: 'translateZ(10px)',
                        boxShadow: `
                          0 8px 16px rgba(0, 0, 0, 0.3),
                          inset 0 2px 6px rgba(255, 255, 255, 0.1),
                          inset 0 -2px 6px rgba(0, 0, 0, 0.2)
                        `
                      }}
                    >
                      {/* Shirt details */}
                      <div className="absolute inset-1.5 bg-white/10 rounded-t-md"></div>
                      {/* Collar */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-black/20 rounded-t-sm"></div>
                    </div>
                    
                    {/* Arms */}
                    <div className="absolute top-14 left-0 right-0 flex justify-between z-0">
                      {/* Left Arm */}
                      <div className={`
                        w-4 h-12 rounded-l-full rounded-r-sm
                        ${isCurrentPlayer 
                          ? 'bg-gradient-to-b from-blue-500 to-blue-700' 
                          : 'bg-gradient-to-b from-gray-600 to-gray-800'}
                        shadow-md transform -rotate-12
                        ${hasFolded ? 'opacity-40' : ''}
                      `}>
                        {/* Left Hand */}
                        {!hasFolded && (
                          <div className={`
                            absolute -bottom-1 -left-1 w-5 h-5 rounded-full
                            ${isCurrentPlayer 
                              ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                              : 'bg-gradient-to-br from-gray-500 to-gray-700'}
                            border-2 border-amber-800 shadow-xl
                          `}>
                            {/* Fingers on table */}
                            <div className="absolute -bottom-1.5 left-0 w-4 h-2 bg-amber-800/30 rounded-b-full blur-[1px]"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Right Arm */}
                      <div className={`
                        w-4 h-12 rounded-r-full rounded-l-sm
                        ${isCurrentPlayer 
                          ? 'bg-gradient-to-b from-blue-500 to-blue-700' 
                          : 'bg-gradient-to-b from-gray-600 to-gray-800'}
                        shadow-md transform rotate-12
                        ${hasFolded ? 'opacity-40' : ''}
                      `}>
                        {/* Right Hand */}
                        {!hasFolded && (
                          <div className={`
                            absolute -bottom-1 -right-1 w-5 h-5 rounded-full
                            ${isCurrentPlayer 
                              ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                              : 'bg-gradient-to-br from-gray-500 to-gray-700'}
                            border-2 border-amber-800 shadow-xl
                          `}>
                            {/* Fingers on table */}
                            <div className="absolute -bottom-1.5 right-0 w-4 h-2 bg-amber-800/30 rounded-b-full blur-[1px]"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Lower Body (sitting, partially visible) */}
                    <div className={`
                      w-20 h-5 rounded-b-lg mt-0 z-0
                      ${isCurrentPlayer 
                        ? 'bg-gradient-to-b from-blue-700 to-blue-900' 
                        : 'bg-gradient-to-b from-gray-700 to-gray-900'}
                      ${hasFolded ? 'opacity-40' : ''}
                    `}></div>
                  </div>
                </motion.div>
              </div>
              
              {/* Player Info Card */}
              <div className="mt-24">
                <motion.div whileHover={{ scale: 1.05, y: -2 }}>
                  <Card className={`
                    w-36 shadow-2xl transition-all duration-300
                    ${isCurrentPlayer 
                      ? 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/60 dark:via-purple-900/60 dark:to-pink-900/60 border-4 border-blue-500 shadow-blue-500/50' 
                      : 'bg-white/95 dark:bg-gray-800/95 border-2 border-gray-300 dark:border-gray-600'}
                    ${hasFolded ? 'opacity-50 grayscale' : ''}
                    backdrop-blur-sm
                  `}>
                    <div className="p-2.5 space-y-2">
                      {/* Name */}
                      <div className="text-center">
                        <p className={`text-sm font-black truncate ${isCurrentPlayer ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                          {player.name}
                          {isCurrentPlayer && ' 👑'}
                        </p>
                        {hasFolded && (
                          <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-0.5">❌ FOLDED</p>
                        )}
                      </div>

                      {/* Chips */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-yellow-100 via-orange-50 to-yellow-100 dark:from-yellow-900/40 dark:via-orange-900/40 dark:to-yellow-900/40 rounded-lg px-3 py-1.5 shadow-inner">
                        <div className="flex items-center gap-1.5">
                          <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">Chips</span>
                        </div>
                        <span className="text-base font-black text-yellow-800 dark:text-yellow-200">{player.chips}</span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 justify-center flex-wrap">
                        {player.hasSeen ? (
                          <span className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold shadow-md">👁️ SEEN</span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-bold shadow-md">🙈 BLIND</span>
                        )}
                        {isCurrentTurn && !hasFolded && (
                          <span className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold shadow-md animate-pulse">⚡ TURN</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
              
              {/* Cards on Table - In front of player - 3D */}
              {!hasFolded && player.cards && player.cards.length > 0 && (
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: index * 0.3 + 0.5, type: 'spring' }}
                  className="absolute top-[90px] left-1/2 -translate-x-1/2 z-30"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(5px)'
                  }}
                >
                  <div className="flex gap-1">
                    {player.cards.map((card, cardIndex) => (
                      <motion.div
                        key={cardIndex}
                        initial={{ rotateY: 180 }}
                        animate={{ rotateY: player.hasSeen ? 0 : 180 }}
                        transition={{ delay: cardIndex * 0.1 }}
                        className={`
                          w-8 h-12 rounded border-2
                          ${player.hasSeen 
                            ? 'bg-white border-gray-300' 
                            : 'bg-gradient-to-br from-blue-600 to-purple-700 border-blue-400'}
                        `}
                        style={{ 
                          transformStyle: 'preserve-3d',
                          transform: `rotate(${(cardIndex - 1) * 5}deg) translateZ(${cardIndex * 2}px)`,
                          boxShadow: `
                            0 8px 16px rgba(0, 0, 0, 0.3),
                            0 4px 8px rgba(0, 0, 0, 0.2),
                            inset 0 1px 3px rgba(255, 255, 255, 0.2)
                          `
                        }}
                      >
                        {player.hasSeen && (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-bold">
                            <span className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}>
                              {card.rank}
                            </span>
                            <span className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}>
                              {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                            </span>
                          </div>
                        )}
                        {!player.hasSeen && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-white text-lg">🎴</div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Bet Chips on Table - Near Player */}
              {player.currentBet > 0 && !hasFolded && (
                <motion.div
                  initial={{ scale: 0, y: -20, rotate: -180 }}
                  animate={{ scale: 1, y: 0, rotate: 0 }}
                  className="absolute top-[130px] left-1/2 -translate-x-1/2 z-30"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -4, 0],
                      rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {/* Chip Stack */}
                    <div className="relative">
                      {/* Shadow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-500 rounded-full blur-md opacity-60"></div>
                      
                      {/* Chip Layers */}
                      <div className="relative">
                        <div className="absolute top-1 left-0 w-full h-full bg-gradient-to-br from-red-600 to-pink-700 rounded-full opacity-80"></div>
                        <div className="absolute top-0.5 left-0 w-full h-full bg-gradient-to-br from-red-500 to-pink-600 rounded-full opacity-90"></div>
                        
                        {/* Main Chip */}
                        <div className="relative bg-gradient-to-br from-red-500 via-pink-500 to-red-600 rounded-full px-4 py-2 shadow-2xl border-3 border-white">
                          <p className="text-sm font-black text-white drop-shadow-lg">{player.currentBet}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
