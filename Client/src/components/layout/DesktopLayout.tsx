"use client";

import React from 'react';
import SideBar from '@/components/sideBar/sideBar';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import { SwipeNavigationWrapper } from '@/components/navigation/SwipeNavigationWrapper';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isAuthenticated, loading } = useAuth();

  return (
    <>
      {/* Mobile: comportement actuel avec swipe navigation */}
      <div className="md:hidden">
        <SwipeNavigationWrapper>
          {children}
        </SwipeNavigationWrapper>
      </div>

      {/* Desktop: nouvelle architecture */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <SideBar state="open" />

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col ml-80">
          {/* Breadcrumb en haut */}
          <Breadcrumb />

          {/* Zone de contenu */}
          <main className="flex-1 overflow-auto bg-background">
            {/* Si déconnecté, zone vide avec message */}
            {!loading && !isAuthenticated ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21Z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Bienvenue sur Yanotela
                    </h2>
                    <p className="text-gray-600">
                      Connectez-vous pour accéder à vos notes
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Si connecté, afficher le contenu
              <div className="h-full">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}