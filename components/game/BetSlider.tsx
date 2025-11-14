'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, Zap } from 'lucide-react';

interface BetSliderProps {
  minBet: number;
  maxBet: number;
  currentBet: number;
  onBetChange: (amount: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BetSlider({ 
  minBet, 
  maxBet, 
  currentBet, 
  onBetChange, 
  onConfirm,
  onCancel 
}: BetSliderProps) {
  const [sliderValue, setSliderValue] = useState(currentBet);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setSliderValue(currentBet);
  }, [currentBet]);

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setSliderValue(newValue);
    onBetChange(newValue);
  };

  // Get percentage of slider
  const percentage = ((sliderValue - minBet) / (maxBet - minBet)) * 100;

  // Get color based on bet amount
  const getSliderColor = () => {
    if (percentage >= 75) return 'from-red-500 to-orange-500';
    if (percentage >= 50) return 'from-orange-500 to-yellow-500';
    if (percentage >= 25) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-blue-500';
  };

  // Quick bet presets
  const presets = [
    { label: '25%', value: Math.floor(minBet + (maxBet - minBet) * 0.25) },
    { label: '50%', value: Math.floor(minBet + (maxBet - minBet) * 0.5) },
    { label: '75%', value: Math.floor(minBet + (maxBet - minBet) * 0.75) },
    { label: 'MAX', value: maxBet },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed inset-x-4 bottom-24 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 z-50"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-primary/20 p-4 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-primary">Set Your Bet</h3>
          </div>
          <motion.div
            animate={{ rotate: isDragging ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <TrendingUp className="h-5 w-5 text-primary" />
          </motion.div>
        </div>

        {/* Current Amount Display */}
        <div className="text-center mb-4">
          <motion.div
            key={sliderValue}
            initial={{ scale: 1.2, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`text-4xl font-black bg-gradient-to-r ${getSliderColor()} bg-clip-text text-transparent`}
          >
            💰 {sliderValue}
          </motion.div>
          <p className="text-xs text-muted-foreground mt-1">
            {percentage.toFixed(0)}% of max bet
          </p>
        </div>

        {/* Slider */}
        <div className="mb-4 px-2">
          <Slider
            value={[sliderValue]}
            min={minBet}
            max={maxBet}
            step={10}
            onValueChange={handleSliderChange}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => setIsDragging(false)}
            className="relative"
          />
          
          {/* Min/Max labels */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Min: {minBet}</span>
            <span>Max: {maxBet}</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => {
                setSliderValue(preset.value);
                onBetChange(preset.value);
              }}
              className="h-8 text-xs font-bold"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            <Zap className="h-4 w-4 mr-1" />
            Confirm
          </Button>
        </div>

        {/* Visual feedback bar */}
        <motion.div
          className="mt-3 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className={`h-full bg-gradient-to-r ${getSliderColor()}`}
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Compact inline slider for quick adjustments
export function InlineBetSlider({
  minBet,
  maxBet,
  currentBet,
  onBetChange,
}: Omit<BetSliderProps, 'onConfirm' | 'onCancel'>) {
  const [value, setValue] = useState(currentBet);

  const handleChange = (newValue: number[]) => {
    setValue(newValue[0]);
    onBetChange(newValue[0]);
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
        {minBet}
      </span>
      <Slider
        value={[value]}
        min={minBet}
        max={maxBet}
        step={10}
        onValueChange={handleChange}
        className="flex-1"
      />
      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
        {maxBet}
      </span>
      <motion.div
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="min-w-[60px] text-sm font-bold text-primary text-right"
      >
        💰 {value}
      </motion.div>
    </div>
  );
}

