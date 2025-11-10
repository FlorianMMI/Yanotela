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
  
  // Pages où on affiche le contenu SANS FlashNote (même si non connecté)
  const contentPages = ['/cgu', '/mentions-legales'];
  const isContentPage = contentPages.some(page => pathname.startsWith(page));
  
  // Pages d'authentification où on affiche UNIQUEMENT la FlashNote (pas le formulaire)
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.some(page => pathname.startsWith(page));

  return (
    <>
      {/* Mobile: comportement actuel avec swipe navigation */}
      <div className="md:hidden">
        {isContentPage ? (
          // Pages de contenu : affichage direct sans swipe navigation
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
        {/* Sidebar - toujours visible */}
        <SideBar />

        {/* Contenu principal */}
        <div className={`flex-1 flex flex-col w-full`}>
          {/* Breadcrumb et ItemBar - toujours visibles */}
          <Breadcrumb />
          <ItemBar />

          {/* Zone de contenu */}
          <main className="flex-1 overflow-auto bg-background md:bg-deskbackground">
            {!loading && !isAuthenticated && !isContentPage ? (
              // Si non connecté ET pas sur une page de contenu (/cgu, /mentions-legales), afficher FlashNote
              <FlashNoteWidget />
            ) : (
              // Sinon (connecté OU page de contenu), afficher le contenu de la page
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
