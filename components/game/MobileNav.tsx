'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Trophy, HelpCircle, Volume2, VolumeX, User, Eye, ArrowRight, Plus, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toggleSound, isSoundEnabled } from '@/lib/sounds';
import { ThemeToggle } from '@/components/theme-toggle';
import { useI18n } from '@/lib/i18n';

interface MobileNavProps {
  gameId: string;
  onLeaveGame?: () => void;
}

export function MobileNav({ gameId, onLeaveGame }: MobileNavProps) {
  const { t, locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
  };

  const menuItems = [
    { icon: User, label: t('menu.profileStats'), action: () => window.location.href = '/profile', color: 'text-purple-600' },
    { icon: Home, label: t('menu.home'), action: () => window.location.href = '/', color: 'text-blue-600' },
    { icon: Trophy, label: t('menu.leaderboard'), action: () => window.location.href = '/profile', color: 'text-yellow-600' },
    { icon: HelpCircle, label: t('menu.howToPlay'), action: () => setShowHelp(true), color: 'text-orange-600' },
  ];

  const handRankings = [
    { rank: '1', name: t('hand.trail'), desc: 'Three of a kind (A-A-A)', emoji: '🏆' },
    { rank: '2', name: t('hand.pureSequence'), desc: 'Straight flush (A-K-Q ♥)', emoji: '🎴' },
    { rank: '3', name: t('hand.sequence'), desc: 'Straight (A-K-Q)', emoji: '📈' },
    { rank: '4', name: t('hand.color'), desc: 'All same suit (Q-7-3 ♠)', emoji: '🌈' },
    { rank: '5', name: t('hand.pair'), desc: 'Two same rank (K-K-5)', emoji: '👥' },
    { rank: '6', name: t('hand.highCard'), desc: 'No combination', emoji: '🃏' },
  ];

  const actions = [
    { icon: Eye, name: t('action.seeCards'), desc: t('desc.seeCards'), color: 'text-blue-600' },
    { icon: ArrowRight, name: t('action.call'), desc: t('desc.call'), color: 'text-green-600' },
    { icon: Plus, name: t('action.raise'), desc: t('desc.raise'), color: 'text-orange-600' },
    { icon: XCircle, name: t('action.fold'), desc: t('desc.fold'), color: 'text-red-600' },
    { icon: Trophy, name: t('action.show'), desc: t('desc.show'), color: 'text-yellow-600' },
  ];

  return (
    <>
      {/* Floating Menu Button - Now visible on all screens */}
      <motion.div
        className="fixed top-4 right-4 z-50"
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-600 hover:shadow-2xl shadow-xl border-2 border-white dark:border-gray-800 transition-all"
        >
          {isOpen ? <X className="h-6 w-6 sm:h-7 sm:w-7" /> : <Menu className="h-6 w-6 sm:h-7 sm:w-7" />}
        </Button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-[86vw] sm:w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              {showHelp ? (
                /* Help Content */
                <div className="p-4 space-y-4">
                  {/* Help Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-primary to-purple-600 text-white p-4 rounded-xl flex items-center justify-between -mt-4 -mx-4 mb-4 z-10">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold">🎮 {t('help.title')}</h2>
                      <p className="text-white/90 text-[11px] sm:text-xs mt-0.5">{t('help.subtitle')}</p>
                    </div>
                    <Button
                      onClick={() => setShowHelp(false)}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-8 w-8"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Game Rules */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold mb-2 flex items-center gap-2">
                      📖 {t('help.gameRules')}
                    </h3>
                    <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <ul className="space-y-1.5 text-[11px] sm:text-xs">
                        <li>• {t('help.rules.2to3')}</li>
                        <li>• {t('help.rules.startingChips')}</li>
                        <li>• {t('help.rules.boot')}</li>
                        <li>• {t('help.rules.3cards')}</li>
                        <li>• {t('help.rules.blind')}</li>
                        <li>• {t('help.rules.seen')}</li>
                      </ul>
                    </Card>
                  </div>

                  {/* Hand Rankings */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold mb-2">🏆 {t('help.handRankings')}</h3>
                    <div className="space-y-1.5">
                      {handRankings.map((hand) => (
                        <div
                          key={hand.rank}
                          className="flex items-center gap-2 p-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border text-[11px] sm:text-xs"
                        >
                          <div className="text-base sm:text-lg">{hand.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[11px] sm:text-xs truncate">{hand.rank}. {hand.name}</div>
                            <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{hand.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold mb-2">⚡ {t('help.actions')}</h3>
                    <div className="space-y-1.5">
                      {actions.map((action) => (
                        <div
                          key={action.name}
                          className="flex items-center gap-2 p-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border text-[11px] sm:text-xs"
                        >
                          <action.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[11px] sm:text-xs truncate">{action.name}</div>
                            <div className="text-[11px] sm:text-xs text-muted-foreground">{action.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="text-sm font-bold mb-2">💡 {t('help.proTips')}</h3>
                    <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                      <ul className="space-y-1.5 text-xs">
                        <li>• {t('tips.blindSave')}</li>
                        <li>• {t('tips.seeWhenPotLarge')}</li>
                        <li>• {t('tips.foldBad')}</li>
                        <li>• {t('tips.raiseStrong')}</li>
                        <li>• {t('tips.useShow')}</li>
                      </ul>
                    </Card>
                  </div>

                  {/* Back Button */}
                  <Button
                    onClick={() => setShowHelp(false)}
                    size="sm"
                    className="w-full bg-gradient-to-r from-primary to-purple-600"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.back')}
                  </Button>
                </div>
              ) : (
                /* Main Menu */
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {t('menu.title')}
                    </h2>
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="ghost"
                      size="icon"
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </div>

                

                  {/* Menu Items */}
                  <div className="space-y-2">
                    {menuItems.map((item, index) => (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Sound Toggle */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: menuItems.length * 0.05 }}
                    onClick={handleToggleSound}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${
                      soundEnabled 
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' 
                        : 'bg-gray-50 dark:bg-gray-800'
                    } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    ) : (
                      <VolumeX className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    )}
                    <span className="font-medium text-sm">
                      {t('menu.sound')} {soundEnabled ? t('menu.soundOn') : t('menu.soundOff')}
                    </span>
                  </motion.button>

                  {/* Theme Toggle */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (menuItems.length + 1) * 0.05 }}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="font-medium text-sm">{t('menu.theme')}</span>
                    <ThemeToggle />
                  </motion.div>

                  {/* Language Switch */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (menuItems.length + 2) * 0.05 }}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="font-medium text-sm">{t('menu.language')}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={locale === 'en' ? 'default' : 'outline'} className="h-7" onClick={() => setLocale && setLocale('en')}>EN</Button>
                      <Button size="sm" variant={locale === 'ne' ? 'default' : 'outline'} className="h-7" onClick={() => setLocale && setLocale('ne')}>NE</Button>
                    </div>
                  </motion.div>

                  {/* Left-handed Mode */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (menuItems.length + 3) * 0.05 }}
                    onClick={() => {
                      try {
                        const cur = localStorage.getItem('left_handed') === '1';
                        localStorage.setItem('left_handed', cur ? '0' : '1');
                      } catch {}
                    }}
                    className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="font-medium text-sm">{t('menu.leftHanded')}</span>
                    <span className="text-xs opacity-70">Toggle</span>
                  </motion.button>

                  {/* Reduce Motion */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (menuItems.length + 4) * 0.05 }}
                    onClick={() => {
                      try {
                        const cur = localStorage.getItem('reduce_motion') === '1';
                        const next = !cur;
                        localStorage.setItem('reduce_motion', next ? '1' : '0');
                        if (next) {
                          document.documentElement.classList.add('reduce-motion');
                        } else {
                          document.documentElement.classList.remove('reduce-motion');
                        }
                      } catch {}
                    }}
                    className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="font-medium text-sm">{t('menu.reduceMotion')}</span>
                    <span className="text-xs opacity-70">Toggle</span>
                  </motion.button>

                  {/* Leave Game */}
                  {onLeaveGame && (
                    <Button
                      onClick={() => setShowConfirmLeave(true)}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      {t('menu.leaveGame')}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Confirm Leave Dialog */}
      <AnimatePresence>
        {showConfirmLeave && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowConfirmLeave(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 240 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-900 border shadow-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold">{t('confirm.leave.title')}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {t('confirm.leave.body')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setShowConfirmLeave(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setShowConfirmLeave(false);
                      onLeaveGame && onLeaveGame();
                    }}
                  >
                    {t('common.leave')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

