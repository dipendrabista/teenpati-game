'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  TrendingUp, 
  X, 
  Eye, 
  Sparkles,
  Trophy,
  Flame
} from 'lucide-react';

export type ActionType = 'CALL' | 'RAISE' | 'FOLD' | 'SEE' | 'SHOW' | 'WIN';

interface ActionFeedbackProps {
  action: ActionType;
  amount?: number;
  show: boolean;
  onComplete: () => void;
}

const actionConfig: Record<ActionType, {
  icon: React.ReactNode;
  color: string;
  label: string;
  emoji: string;
}> = {
  CALL: {
    icon: <Check className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500',
    label: 'Called',
    emoji: '✅'
  },
  RAISE: {
    icon: <TrendingUp className="w-8 h-8" />,
    color: 'from-orange-500 to-red-500',
    label: 'Raised',
    emoji: '🔥'
  },
  FOLD: {
    icon: <X className="w-8 h-8" />,
    color: 'from-gray-500 to-slate-600',
    label: 'Folded',
    emoji: '😓'
  },
  SEE: {
    icon: <Eye className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500',
    label: 'Saw Cards',
    emoji: '👁️'
  },
  SHOW: {
    icon: <Sparkles className="w-8 h-8" />,
    color: 'from-purple-500 to-pink-500',
    label: 'Show',
    emoji: '🎴'
  },
  WIN: {
    icon: <Trophy className="w-8 h-8" />,
    color: 'from-yellow-400 to-orange-400',
    label: 'Winner',
    emoji: '🏆'
  }
};

export function ActionFeedback({ action, amount, show, onComplete }: ActionFeedbackProps) {
  const config = actionConfig[action];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ 
            y: 0, 
            opacity: 1, 
            scale: 0.5,
            rotate: -10
          }}
          animate={{ 
            y: -100, 
            opacity: 0,
            scale: 1.5,
            rotate: 0
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 1.5,
            ease: "easeOut"
          }}
          onAnimationComplete={onComplete}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className={`flex flex-col items-center gap-1`}>
            {/* Icon with gradient background */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: 2
              }}
              className={`
                flex items-center justify-center
                w-16 h-16 rounded-full
                bg-gradient-to-br ${config.color}
                shadow-2xl
                text-white
              `}
            >
              {config.icon}
            </motion.div>

            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`
                px-4 py-1.5 rounded-full
                bg-gradient-to-r ${config.color}
                text-white font-bold text-sm
                shadow-lg
                backdrop-blur-sm
                border-2 border-white/30
              `}
            >
              <div className="flex items-center gap-1.5">
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                {amount && <span className="ml-1">₹{amount}</span>}
              </div>
            </motion.div>

            {/* Sparkle particles for special actions */}
            {(action === 'RAISE' || action === 'WIN' || action === 'SHOW') && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 1,
                      scale: 1
                    }}
                    animate={{ 
                      x: Math.cos(i * 60 * Math.PI / 180) * 40,
                      y: Math.sin(i * 60 * Math.PI / 180) * 40,
                      opacity: 0,
                      scale: 0
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: 0.2,
                      ease: "easeOut"
                    }}
                    className="absolute top-8 left-8"
                  >
                    <div className={`
                      w-2 h-2 rounded-full
                      bg-gradient-to-r ${config.color}
                      shadow-lg
                    `} />
                  </motion.div>
                ))}
              </>
            )}

            {/* Fire effect for RAISE */}
            {action === 'RAISE' && (
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="absolute -bottom-4"
              >
                <Flame className="w-6 h-6 text-orange-500" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Multiple action feedbacks component for different positions
interface MultiActionFeedbackProps {
  actions: Array<{
    id: string;
    action: ActionType;
    amount?: number;
    position?: 'top' | 'center' | 'bottom';
  }>;
  onComplete: (id: string) => void;
}

export function MultiActionFeedback({ actions, onComplete }: MultiActionFeedbackProps) {
  const getPositionClass = (position?: 'top' | 'center' | 'bottom') => {
    switch (position) {
      case 'top': return 'top-4';
      case 'bottom': return 'bottom-4';
      default: return 'top-1/2 -translate-y-1/2';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {actions.map((item) => (
        <div 
          key={item.id}
          className={`absolute left-1/2 -translate-x-1/2 ${getPositionClass(item.position)}`}
        >
          <ActionFeedback
            action={item.action}
            amount={item.amount}
            show={true}
            onComplete={() => onComplete(item.id)}
          />
        </div>
      ))}
    </div>
  );
}

