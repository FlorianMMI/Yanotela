'use client';

import React from 'react';
import Link from 'next/link';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

interface SwipeNavigationWrapperProps {
  children: ReactNode;
}

export const SwipeNavigationWrapper = ({ children }: SwipeNavigationWrapperProps) => {
  const pathname = usePathname();
  const router = useRouter();
  
  // Configuration des routes pour le swipe
  const getSwipeConfig = () => {
    switch (pathname) {
      case '/notes':
        return {
          routes: {
            current: '/notes',
            left: '/profil',    // Swipe droite va vers profil
            right: '/dossiers'    // Swipe gauche va vers profil
          }
        };
      case '/profil':
        return {
          routes: {
            current: '/profil',
            left: '/dossiers',     // Swipe droite va vers notes
            right: '/notes'     // Swipe gauche va vers notes
          }
        };
      case '/dossiers':
        return {
          routes: {
            current: '/dossiers',
            left: '/notes',     // Swipe droite va vers notes
            right: '/profil'     // Swipe gauche va vers notes
          }
        };
      default:
        return null;
    }
  };

  const swipeConfig = getSwipeConfig();
  
  const { isMobile, swipeHandlers } = useSwipeNavigation({
    routes: swipeConfig?.routes || { current: pathname, left: '', right: '' },
    enableMouse: true, // Activer la souris
    minSwipeDistance: 50,
    maxVerticalDistance: 100
  });

  // Si pas de configuration de swipe, renvoie juste les children
  if (!swipeConfig) {
    return <>{children}</>;
  }

  return (
    <div
      className="h-full w-full touch-pan-y flex flex-col"
      {...swipeHandlers}
      style={{
        // Prévenir le zoom sur mobile lors du double tap
        touchAction: 'pan-y',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        // Curseur sur desktop pour indiquer l'interactivité
        cursor: isMobile ? 'default' : 'grab'
      }}
      onMouseDown={(e) => {
        if (!isMobile) {
          e.currentTarget.style.cursor = 'grabbing';
        }
        swipeHandlers.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (!isMobile) {
          e.currentTarget.style.cursor = 'grab';
        }
        swipeHandlers.onMouseUp?.();
      }}
    >
      {/* Contenu principal avec scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
      
      {/* Indicateur visuel pour le swipe (seulement sur mobile) */}
      {isMobile && (
        <>
          <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-3">
              {/* Indicateur Profil */}
              <motion.div 
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
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
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/profil')}
              >
              </motion.div>
              
              {/* Indicateur Notes */}
              <motion.div 
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
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
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/notes')}
              >
              </motion.div>

              {/* Indicateur Folder */}
              <motion.div 
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  pathname === '/dossiers' 
                    ? 'bg-primary text-white' 
                    : 'bg-primary/30 text-primary'
                }`}
                initial={{ scale: 0.9 }}
                animate={{ 
                  scale: pathname === '/dossiers' ? 1.1 : 0.9,
                  opacity: pathname === '/dossiers' ? 1 : 0.7
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/dossiers')}
              >
              </motion.div>
            </div>
          </div>

          {/* Liens légaux pour mobile - sous les indicateurs */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
            <div className="flex gap-2 text-xs text-element">
              <Link 
                href="/cgu" 
                className="hover:text-primary transition-colors hover:underline"
              >
                CGU
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/mentions-legales" 
                className="hover:text-primary transition-colors hover:underline"
              >
                Mentions Légales
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
