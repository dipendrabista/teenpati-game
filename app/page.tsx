'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Play, Gamepad2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { playSound } from '@/lib/sounds';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import UserMenu from '@/components/auth/UserMenu';

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      alert(t('errors.nameRequired'));
      return;
    }
    playSound('buttonClick');
    const newGameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    router.push(`/game/${newGameId}?name=${encodeURIComponent(playerName)}`);
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert(t('errors.nameRequired'));
      return;
    }
    if (!gameId.trim()) {
      alert(t('errors.gameIdRequired'));
      return;
    }
    playSound('buttonClick');
    router.push(`/game/${gameId}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-0 sm:p-4 relative">
      {/* Top Header (responsive) */}
      <div className="sticky top-0 z-40 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
            <Gamepad2 className="h-5 w-5 text-primary" />
            <span className="hidden xs:inline">Teen Patti</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl px-3 sm:px-0"
      >
        <Card className="shadow-2xl border-4 border-primary/20 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10">
          <CardHeader className="text-center space-y-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-primary/5 to-transparent blur-2xl" />
            
            <motion.div 
              className="flex items-center justify-center gap-3 relative z-10"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Gamepad2 className="h-14 w-14 text-primary drop-shadow-lg" />
              </motion.div>
              <CardTitle className="text-5xl font-black bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                {t('app.name')}
              </CardTitle>
            </motion.div>
            <CardDescription className="text-lg font-semibold text-muted-foreground relative z-10">
              🃏 {t('app.tagline')} 🎮
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('home.enterName')}</label>
              <Input
                type="text"
                placeholder={t('home.namePlaceholder')}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleCreateGame();
                  }
                }}
                className="h-12 text-lg"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('home.or')}</span>
              </div>
            </div>

            {/* Join Game */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {t('home.gameId')}
                </label>
                <Input
                  type="text"
                  placeholder={t('home.gameIdPlaceholder')}
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && playerName.trim() && gameId.trim()) {
                      handleJoinGame();
                    }
                  }}
                  className="h-12 text-base font-mono"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleJoinGame}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-2 hover:bg-primary/5 hover:border-primary transition-all shadow-md hover:shadow-lg"
                  disabled={!playerName.trim() || !gameId.trim()}
                >
                  <Users className="mr-2 h-5 w-5" />
                  {t('home.joinGame')}
                </Button>
              </motion.div>
            </div>

            {/* Create Game Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCreateGame}
                className="w-full h-14 text-lg font-black bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 shadow-xl hover:shadow-2xl transition-all"
                disabled={!playerName.trim()}
              >
                <Play className="mr-2 h-6 w-6" />
                {t('home.createGame')} 🎮
              </Button>
            </motion.div>

            {/* Info */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>• Create a game and share the Game ID with friends (2-3 players)</p>
              <p>• Wait for at least 2 players to join and be ready</p>
              <p>• Each player starts with 1000 chips and gets 3 cards</p>
              <p>• Play blind or seen, bet, raise, fold, or show to win the pot!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

