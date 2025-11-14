'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Eye, ArrowRight, Plus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const handRankings = [
    { rank: '1', name: 'Trail', desc: 'Three of a kind (A-A-A)', emoji: '🏆' },
    { rank: '2', name: 'Pure Sequence', desc: 'Straight flush (A-K-Q ♥)', emoji: '🎴' },
    { rank: '3', name: 'Sequence', desc: 'Straight (A-K-Q)', emoji: '📈' },
    { rank: '4', name: 'Color', desc: 'All same suit (Q-7-3 ♠)', emoji: '🌈' },
    { rank: '5', name: 'Pair', desc: 'Two same rank (K-K-5)', emoji: '👥' },
    { rank: '6', name: 'High Card', desc: 'No combination', emoji: '🃏' },
  ];

  const actions = [
    { icon: Eye, name: 'See Cards', desc: 'Reveal your cards (become Seen player)', color: 'text-blue-600' },
    { icon: ArrowRight, name: 'Call', desc: 'Match the current bet', color: 'text-green-600' },
    { icon: Plus, name: 'Raise', desc: 'Increase the bet (2x or 4x)', color: 'text-orange-600' },
    { icon: XCircle, name: 'Fold', desc: 'Give up this round', color: 'text-red-600' },
    { icon: Trophy, name: 'Show', desc: 'Compare cards (2 players only)', color: 'text-yellow-600' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">🎮 How to Play</h2>
                  <p className="text-white/90 mt-1">Teen Pati Guide</p>
                </div>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Game Rules */}
                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    📖 Game Rules
                  </h3>
                  <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <ul className="space-y-2 text-sm">
                      <li>• <strong>2-3 Players:</strong> Game starts with minimum 2 players</li>
                      <li>• <strong>Starting Chips:</strong> Each player gets 1000 chips</li>
                      <li>• <strong>Boot:</strong> 10 chips per player to start the pot</li>
                      <li>• <strong>3 Cards:</strong> Each player receives 3 cards</li>
                      <li>• <strong>Blind Bets Half:</strong> Blind players pay 50% of bet</li>
                      <li>• <strong>Seen Bets Full:</strong> Seen players pay 100% of bet</li>
                    </ul>
                  </Card>
                </div>

                {/* Hand Rankings */}
                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    🏆 Hand Rankings
                  </h3>
                  <div className="space-y-2">
                    {handRankings.map((hand) => (
                      <motion.div
                        key={hand.rank}
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border"
                      >
                        <div className="text-2xl">{hand.emoji}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{hand.rank}. {hand.name}</div>
                          <div className="text-xs text-muted-foreground">{hand.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    ⚡ Actions
                  </h3>
                  <div className="space-y-2">
                    {actions.map((action) => (
                      <motion.div
                        key={action.name}
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border"
                      >
                        <action.icon className={`h-6 w-6 ${action.color}`} />
                        <div className="flex-1">
                          <div className="font-bold text-sm">{action.name}</div>
                          <div className="text-xs text-muted-foreground">{action.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    💡 Pro Tips
                  </h3>
                  <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <ul className="space-y-2 text-sm">
                      <li>• Play <strong>blind</strong> to save chips early game</li>
                      <li>• <strong>See cards</strong> when pot is large and you're confident</li>
                      <li>• <strong>Fold</strong> bad hands early to minimize losses</li>
                      <li>• <strong>Raise</strong> aggressively with strong hands</li>
                      <li>• Use <strong>Show</strong> when confident against last opponent</li>
                    </ul>
                  </Card>
                </div>

                {/* Close Button */}
                <Button
                  onClick={onClose}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-purple-600 text-lg"
                >
                  Got it! Let's Play 🎮
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

