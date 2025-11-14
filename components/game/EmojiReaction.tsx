'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

export interface Reaction {
  id: string;
  emoji: string;
  playerId: string;
  playerName: string;
  timestamp: number;
}

interface EmojiReactionProps {
  onSendReaction: (emoji: string) => void;
}

const EMOJI_OPTIONS = [
  // Core reactions
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '👎', label: 'Thumbs Down' },
  { emoji: '😀', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😱', label: 'Shocked' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '💯', label: 'Perfect' },
  { emoji: '👏', label: 'Clap' },
  // Card-play specific
  { emoji: '🃏', label: 'Joker' },
  { emoji: '💰', label: 'Money' },
  { emoji: '👀', label: 'Eyes On You' },
  { emoji: '🤫', label: 'Shh (Silent)' },
  { emoji: '🤯', label: 'Mind Blown' },
  { emoji: '😤', label: 'Try Me' },
  { emoji: '🤝', label: 'Deal' },
  { emoji: '🍀', label: 'Good Luck' },
  { emoji: '📈', label: 'Going Up' },
  { emoji: '📉', label: 'Going Down' },
  { emoji: '☠️', label: 'Dead Hand' },
  { emoji: '👑', label: 'King Move' },
  { emoji: '💣', label: 'Bomb' },
  { emoji: '🧠', label: 'Big Brain' },
  { emoji: '🫠', label: 'Melted' },
  { emoji: '🥶', label: 'Cold' },
  { emoji: '🥵', label: 'Hot' },
  { emoji: '🐢', label: 'Too Slow' },
  { emoji: '🏃‍♂️', label: 'Hurry Up' },
  { emoji: '🤡', label: 'Clown Move' },
  // Teen Pati specific cues
  { emoji: '🙈', label: 'Blind' },
  { emoji: '👁️', label: 'Seen' },
  { emoji: '✋', label: 'Fold' },
  { emoji: '☝️', label: 'Call' },
  { emoji: '📢', label: 'Raise' },
  { emoji: '💸', label: 'All-In' },
  { emoji: '🤞', label: 'Fingers Crossed' },
  { emoji: '🫢', label: 'Bluff' },
  { emoji: '😬', label: 'Tense' },
  { emoji: '😮‍💨', label: 'Relief' },
  { emoji: '🤩', label: 'Great Hand' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '🧿', label: 'Nazar' },
  { emoji: '🎴', label: 'Cards' },
  { emoji: '🕒', label: 'Waiting' },
  { emoji: '⏱️', label: 'Timer' },
  { emoji: '🧮', label: 'Calculating' },
  { emoji: '🎯', label: 'Bullseye' },
  { emoji: '🥇', label: 'Winner' },
  { emoji: '🪙', label: 'Ante' },
];

export function EmojiReaction({ onSendReaction }: EmojiReactionProps) {
  const [showEmojis, setShowEmojis] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onSendReaction(emoji);
    setShowEmojis(false);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        onClick={() => setShowEmojis(!showEmojis)}
        variant="outline"
        size="sm"
        className="h-8 px-3 gap-1.5 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-300 dark:border-pink-700 hover:border-pink-400 dark:hover:border-pink-600"
        title="Send quick reaction"
      >
        <Smile className="h-4 w-4 text-pink-600 dark:text-pink-400" />
        <span className="text-xs font-bold text-pink-700 dark:text-pink-300">React</span>
      </Button>

      {/* Emoji Picker Popup */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-pink-300 dark:border-pink-700 p-2 w-80 sm:w-96 max-h-none overflow-y-visible no-scrollbar">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {EMOJI_OPTIONS.map((option) => (
                  <motion.button
                    key={option.emoji}
                    onClick={() => handleEmojiClick(option.emoji)}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-xl sm:text-2xl p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
                    title={option.label}
                  >
                    {option.emoji}
                  </motion.button>
                ))}
              </div>
              
              {/* Close hint */}
              <div className="text-[10px] text-center text-muted-foreground mt-1 pt-1 border-t">
                Click outside to close
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showEmojis && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojis(false)}
        />
      )}
    </div>
  );
}

// Floating emoji animation component
interface FloatingEmojiProps {
  emoji: string;
  playerName: string;
  onComplete: () => void;
}

export function FloatingEmoji({ emoji, playerName, onComplete }: FloatingEmojiProps) {
  return (
    <motion.div
      initial={{ 
        y: 0, 
        opacity: 1, 
        scale: 0.5,
        rotate: -20
      }}
      animate={{ 
        y: 120, 
        opacity: 0,
        scale: 2,
        rotate: 20
      }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 2,
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none z-50"
    >
      <div className="flex flex-col items-center gap-1">
        {/* Emoji */}
        <motion.div
          animate={{ 
            rotate: [-10, 10, -10],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 0.5,
            repeat: 3
          }}
          className="text-5xl"
        >
          {emoji}
        </motion.div>
        
        {/* Player name badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-xs font-bold shadow-lg"
        >
          {playerName}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Container for multiple reactions
interface ReactionContainerProps {
  reactions: Reaction[];
  onComplete: (id: string) => void;
}

export function ReactionContainer({ reactions, onComplete }: ReactionContainerProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-md">
        <AnimatePresence>
          {reactions.map((reaction, index) => (
            <div
              key={reaction.id}
              className="absolute top-0 left-1/2 transform -translate-x-1/2"
              style={{
                left: `${50 + (index - reactions.length / 2) * 15}%`
              }}
            >
              <FloatingEmoji
                emoji={reaction.emoji}
                playerName={reaction.playerName}
                onComplete={() => onComplete(reaction.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

