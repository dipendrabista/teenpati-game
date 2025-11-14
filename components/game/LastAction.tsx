'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LastActionProps {
  action: string | null;
}

export function LastAction({ action }: LastActionProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (action) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [action]);

  return (
    <AnimatePresence>
      {show && action && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="fixed bottom-20 left-4 z-40 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl border-2 border-white dark:border-gray-800"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-xl"
            >
              💬
            </motion.div>
            <p className="text-sm font-bold" dangerouslySetInnerHTML={{ __html: action }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


