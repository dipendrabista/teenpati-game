'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface ChipToss {
  id: string;
  amount: number;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  color: string;
}

interface ChipTossAnimationProps {
  chips: ChipToss[];
  onComplete: (id: string) => void;
}

export function ChipTossAnimation({ chips, onComplete }: ChipTossAnimationProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {chips.map((chip) => (
          <FlyingChip key={chip.id} chip={chip} onComplete={onComplete} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FlyingChipProps {
  chip: ChipToss;
  onComplete: (id: string) => void;
}

function FlyingChip({ chip, onComplete }: FlyingChipProps) {
  const [chipCount, setChipCount] = useState(3); // Number of chips to animate

  useEffect(() => {
    // Auto-complete after animation
    const timeout = setTimeout(() => {
      onComplete(chip.id);
    }, 1000); // Match animation duration

    return () => clearTimeout(timeout);
  }, [chip.id, onComplete]);

  // Calculate arc path control point (peak of the arc)
  const controlX = (chip.fromPosition.x + chip.toPosition.x) / 2;
  const controlY = Math.min(chip.fromPosition.y, chip.toPosition.y) - 150; // Arc height

  // Create path for cubic bezier curve
  const createArcPath = (delay: number) => ({
    x: [
      chip.fromPosition.x,
      controlX,
      chip.toPosition.x
    ],
    y: [
      chip.fromPosition.y,
      controlY,
      chip.toPosition.y
    ],
    rotate: [0, 180, 360], // Spinning effect
    scale: [1, 1.2, 0.8], // Size variation during flight
  });

  return (
    <>
      {Array.from({ length: chipCount }).map((_, index) => (
        <motion.div
          key={`${chip.id}-${index}`}
          initial={{ 
            x: chip.fromPosition.x, 
            y: chip.fromPosition.y,
            scale: 1,
            opacity: 1
          }}
          animate={createArcPath(index * 0.1)}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration: 0.8,
            delay: index * 0.05, // Stagger chips
            ease: [0.25, 0.1, 0.25, 1.0], // Smooth easing
          }}
          className="absolute"
          style={{
            width: '40px',
            height: '40px',
            zIndex: 40 + index,
          }}
        >
          {/* Chip Design */}
          <div className="relative w-full h-full">
            {/* Main chip body */}
            <div
              className="absolute inset-0 rounded-full shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${chip.color}, ${adjustBrightness(chip.color, -20)})`,
                border: '3px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  0 4px 12px rgba(0, 0, 0, 0.3),
                  inset 0 2px 4px rgba(255, 255, 255, 0.3),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.2)
                `
              }}
            >
              {/* Center circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner"
                  style={{
                    background: adjustBrightness(chip.color, -40),
                    border: '2px solid rgba(255, 255, 255, 0.4)'
                  }}
                >
                  💎
                </div>
              </div>

              {/* Decorative edge marks */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-3 bg-white/40 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-15px)`,
                  }}
                />
              ))}
            </div>

            {/* Shine effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%)',
              }}
            />

            {/* Amount label (on first chip only) */}
            {index === 0 && chip.amount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <div className="bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  +{chip.amount} 💰
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </>
  );
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  // Simple hex color adjustment
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Helper hook to trigger chip toss from game actions
export function useChipToss() {
  const [activeChips, setActiveChips] = useState<ChipToss[]>([]);

  const tossChip = (from: HTMLElement | null, to: HTMLElement | null, amount: number, playerColor: string = '#FFD700') => {
    if (!from || !to) return;

    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();

    const newChip: ChipToss = {
      id: `chip-${Date.now()}-${Math.random()}`,
      amount,
      fromPosition: {
        x: fromRect.left + fromRect.width / 2,
        y: fromRect.top + fromRect.height / 2,
      },
      toPosition: {
        x: toRect.left + toRect.width / 2,
        y: toRect.top + toRect.height / 2,
      },
      color: playerColor,
    };

    setActiveChips(prev => [...prev, newChip]);
  };

  const handleComplete = (id: string) => {
    setActiveChips(prev => prev.filter(chip => chip.id !== id));
  };

  return {
    activeChips,
    tossChip,
    ChipTossAnimation: () => (
      <ChipTossAnimation chips={activeChips} onComplete={handleComplete} />
    ),
  };
}

