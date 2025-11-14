'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Users,
  Clock,
  Coins,
  Trophy,
  Zap,
  Crown,
  Star,
  CheckCircle,
  Info,
  GamepadIcon
} from 'lucide-react';
import {
  GAME_VARIANTS,
  GameVariant,
  DEFAULT_VARIANT,
  getVariantById
} from '@/lib/gameVariants';

interface GameVariantSelectorProps {
  selectedVariant?: string;
  onVariantChange: (variantId: string) => void;
  disabled?: boolean;
  showAsModal?: boolean;
  onClose?: () => void;
}

export function GameVariantSelector({
  selectedVariant = DEFAULT_VARIANT.id,
  onVariantChange,
  disabled = false,
  showAsModal = false,
  onClose
}: GameVariantSelectorProps) {
  const [currentVariant, setCurrentVariant] = useState(selectedVariant);
  const selectedVariantData = getVariantById(currentVariant);

  const handleVariantChange = (variantId: string) => {
    setCurrentVariant(variantId);
    onVariantChange(variantId);
  };

  const VariantCard = ({ variant }: { variant: GameVariant }) => {
    const isSelected = variant.id === currentVariant;

    return (
      <motion.div
        whileHover={{ scale: isSelected ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className={`cursor-pointer transition-all duration-200 ${
            isSelected
              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-300'
              : 'hover:shadow-md border-gray-200 dark:border-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && handleVariantChange(variant.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getVariantIcon(variant.id)}
                {variant.name}
                {isSelected && <CheckCircle className="h-5 w-5 text-blue-500" />}
              </CardTitle>
              {variant.id === 'highroller' && (
                <Crown className="h-5 w-5 text-yellow-500" />
              )}
              {variant.id === 'muflis' && (
                <Star className="h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {variant.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Key Rules */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span>Up to {variant.rules.maxPlayers} players</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-gray-500" />
                <span>Min bet: {variant.rules.minBet}</span>
              </div>
              {variant.rules.timeLimit && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{variant.rules.timeLimit}s turns</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4 text-gray-500" />
                <span>{variant.rules.sideShowAllowed ? 'Side Show' : 'No Side Show'}</span>
              </div>
            </div>

            {/* Special Rules */}
            {variant.rules.specialRules && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Special Rules:</h4>
                <ul className="space-y-1">
                  {variant.rules.specialRules.map((rule, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Features */}
            <div className="flex flex-wrap gap-1">
              {variant.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const getVariantIcon = (variantId: string) => {
    switch (variantId) {
      case 'classic': return <Trophy className="h-5 w-5 text-blue-500" />;
      case 'ak47': return <Zap className="h-5 w-5 text-orange-500" />;
      case 'muflis': return <Star className="h-5 w-5 text-green-500" />;
      case 'highroller': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'turbo': return <Zap className="h-5 w-5 text-red-500" />;
      case 'joker': return <GamepadIcon className="h-5 w-5 text-purple-500" />;
      default: return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Game Variant
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select your preferred rules and gameplay style
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(GAME_VARIANTS).map((variant) => (
          <VariantCard key={variant.id} variant={variant} />
        ))}
      </div>

      {/* Selected Variant Details */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Selected: {selectedVariantData.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Game Rules:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Maximum {selectedVariantData.rules.maxPlayers} players</li>
                <li>• Minimum bet: {selectedVariantData.rules.minBet}</li>
                {selectedVariantData.rules.maxBet && (
                  <li>• Maximum bet: {selectedVariantData.rules.maxBet}</li>
                )}
                {selectedVariantData.rules.timeLimit && (
                  <li>• {selectedVariantData.rules.timeLimit} second turn limit</li>
                )}
                <li>• {selectedVariantData.rules.sideShowAllowed ? 'Side shows allowed' : 'No side shows'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Hand Rankings:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Trail: {selectedVariantData.scoring.trail}</li>
                <li>• Pure Sequence: {selectedVariantData.scoring.pureSequence}</li>
                <li>• Sequence: {selectedVariantData.scoring.sequence}</li>
                <li>• Color: {selectedVariantData.scoring.color}</li>
                <li>• Pair: {selectedVariantData.scoring.pair}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {showAsModal && (
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={onClose}>
            Confirm Selection
          </Button>
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {content}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {content}
    </div>
  );
}

// Quick variant selector for game creation/joining
export function QuickVariantSelector({
  selectedVariant = DEFAULT_VARIANT.id,
  onVariantChange,
  disabled = false
}: Omit<GameVariantSelectorProps, 'showAsModal' | 'onClose'>) {
  const selectedVariantData = getVariantById(selectedVariant);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-gray-500" />
        <span className="font-medium">Game Variant</span>
      </div>

      <div className="grid gap-3">
        {Object.values(GAME_VARIANTS).map((variant) => (
          <div
            key={variant.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              variant.id === selectedVariant
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onVariantChange(variant.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getVariantIcon(variant.id)}
                <div>
                  <div className="font-medium">{variant.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {variant.description}
                  </div>
                </div>
              </div>
              {variant.id === selectedVariant && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Selected: {selectedVariantData.name}
      </div>
    </div>
  );
}

function getVariantIcon(variantId: string) {
  switch (variantId) {
    case 'classic': return <Trophy className="h-4 w-4 text-blue-500" />;
    case 'ak47': return <Zap className="h-4 w-4 text-orange-500" />;
    case 'muflis': return <Star className="h-4 w-4 text-green-500" />;
    case 'highroller': return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'turbo': return <Zap className="h-4 w-4 text-red-500" />;
    case 'joker': return <GamepadIcon className="h-4 w-4 text-purple-500" />;
    default: return <Settings className="h-4 w-4 text-gray-500" />;
  }
}
