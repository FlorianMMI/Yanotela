'use client';

import React from 'react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface SwipeNavigationWrapperProps {
  children: ReactNode;
}

export const SwipeNavigationWrapper = ({ children }: SwipeNavigationWrapperProps) => {
  const pathname = usePathname();
  
  // Configuration des routes pour le swipe
  const getSwipeConfig = () => {
    switch (pathname) {
      case '/notes':
        return {
          routes: {
            current: '/notes',
            left: '/profil',    // Swipe droite va vers profil
            right: '/profil'    // Swipe gauche va vers profil
          }
        };
      case '/profil':
        return {
          routes: {
            current: '/profil',
            left: '/notes',     // Swipe droite va vers notes
            right: '/notes'     // Swipe gauche va vers notes
          }
        };
      default:
        return null;
    }
  };

  const swipeConfig = getSwipeConfig();
  
  const { isMobile, swipeHandlers } = useSwipeNavigation(
    swipeConfig || { 
      routes: { current: pathname, left: '', right: '' }
    }
  );

  // Si pas de configuration de swipe ou pas sur mobile, renvoie juste les children
  if (!swipeConfig || !isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen w-full touch-pan-y"
      {...swipeHandlers}
      style={{
        // Prévenir le zoom sur mobile lors du double tap
        touchAction: 'pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {children}
      
      {/* Indicateur visuel pour le swipe (seulement sur mobile) */}
      {isMobile && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-3">
            {/* Indicateur Profil */}
            <motion.div 
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                pathname === '/profil' 
                  ? 'bg-primary text-white' 
                  : 'bg-primary/30 text-primary'
              }`}
              initial={{ scale: 0.9 }}
              animate={{ 
                scale: pathname === '/profil' ? 1.1 : 0.9,
                opacity: pathname === '/profil' ? 1 : 0.7
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
            </motion.div>
            
            {/* Indicateur Notes */}
            <motion.div 
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                pathname === '/notes' 
                  ? 'bg-primary text-white' 
                  : 'bg-primary/30 text-primary'
              }`}
              initial={{ scale: 0.9 }}
              animate={{ 
                scale: pathname === '/notes' ? 1.1 : 0.9,
                opacity: pathname === '/notes' ? 1 : 0.7
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};