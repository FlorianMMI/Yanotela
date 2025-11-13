'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Icons from '@/ui/Icon';

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error';

interface SyncButtonProps {
  status: SyncStatus;
  onSync: () => void;
}

export default function SyncButton({ status, onSync }: SyncButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (status === 'pending' || status === 'error') {
      onSync();
    }
  };

  const getConfig = () => {
    switch (status) {
      case 'synced':
        return {
          
          icon: <Icons name="check" size={18} className="text-primary" />,
          tooltip: 'Tout est bien synchronisé',
          disabled: true,
          pulse: false
        };
      case 'syncing':
        return {
         
          icon: (
            <svg className="w-4 h-4 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          tooltip: 'Synchronisation...',
          disabled: true,
          pulse: false
        };
      case 'pending':
        return {
          
          icon: <Icons name="save" size={18} className="text-primary" />,
          tooltip: 'Cliquez pour sauvegarder',
          disabled: false,
          pulse: true
        };
      case 'error':
        return {
          bgColor: 'bg-red-500',
          icon: <Icons name="alert" size={18} className="text-red" />,
          tooltip: 'Erreur - Réessayer',
          disabled: false,
          pulse: true
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 px-3 py-1.5  text-primary text-xs rounded-md  "
          >
            {config.tooltip}
            <div className="absolute bottom-0 right-3 transform translate-y-1/2 rotate-45 w-1.5 h-1.5 " />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        disabled={config.disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${config.bgColor} p-3 rounded-full transition-all duration-200 ${
          config.disabled ? 'cursor-default opacity-90' : 'cursor-pointer'
        }`}
        whileHover={!config.disabled ? { scale: 1.05 } : {}}
        whileTap={!config.disabled ? { scale: 0.95 } : {}}
        animate={config.pulse ? {
          scale: [1, 1.08, 1],
        } : {}}
        transition={config.pulse ? {
          scale: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        } : {}}
        aria-label={config.tooltip}
      >
        {config.icon}
      </motion.button>
    </div>
  );
}
