"use client";

import React from 'react';
import SideBar from '@/components/sideBar/sideBar';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import ItemBar from '@/components/itemBar/ItemBar';
import { SwipeNavigationWrapper } from '@/components/navigation/SwipeNavigationWrapper';
import { usePathname } from 'next/navigation';
import FlashNoteWidget from '@/components/flashnote/FlashNoteWidget';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  
  // Pages publiques accessibles sans authentification
  const publicPages = ['/cgu', '/mentions-legales', '/login', '/register', '/forgot-password'];
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));

  return (
    <>
      {/* Mobile: comportement actuel avec swipe navigation */}
      <div className="md:hidden">
        {isPublicPage ? (
          // Pages publiques : affichage direct sans swipe navigation
          <div className="h-screen overflow-auto">
            {children}
          </div>
        ) : (
          // Pages protégées : avec swipe navigation
          <SwipeNavigationWrapper>
            {children}
          </SwipeNavigationWrapper>
        )}
      </div>

      {/* Desktop: nouvelle architecture */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar - cachée sur les pages publiques */}
        {!isPublicPage && <SideBar />}

        {/* Contenu principal */}
        <div className={`flex-1 flex flex-col w-full`}>
          {/* Breadcrumb et ItemBar - cachés sur les pages publiques */}
          {!isPublicPage && (
            <>
              <Breadcrumb />
              <ItemBar />
            </>
          )}

          {/* Zone de contenu */}
          <main className="flex-1 overflow-auto bg-background md:bg-deskbackground">
            {!loading && !isAuthenticated && !isPublicPage ? (
              // Si non connecté ET que ce n'est pas une page publique, afficher le FlashNoteWidget
              <FlashNoteWidget />
            ) : (
              // Si connecté OU page publique, afficher le contenu
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
