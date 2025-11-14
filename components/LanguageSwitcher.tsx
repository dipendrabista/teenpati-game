'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ne' : 'en';
    setLanguage(newLang);
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Change Language"
    >
      <Globe className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
        {language === 'en' ? '🇬🇧 English' : '🇳🇵 नेपाली'}
      </span>
    </motion.button>
  );
}

