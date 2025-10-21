"use client";

import React from 'react';
import SideBar from '@/components/sideBar/sideBar';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import ItemBar from '@/components/itemBar/ItemBar';
import NoteHeader from '@/components/noteHeader/NoteHeader';
import Icon from '@/ui/Icon';
import { SwipeNavigationWrapper } from '@/components/navigation/SwipeNavigationWrapper';
import { Item } from 'yjs';
import { usePathname } from 'next/navigation';
import FlashNoteWidget from '@/components/flashnote/FlashNoteWidget';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const { isOpen } = useSidebarToggle();
  const pathname = usePathname();

  // Vérifier si on est sur la Flash Note (accessible sans auth)
  const isFlashNotePage = pathname === '/flashnote';



  return (
    <>
      {/* Mobile: comportement actuel avec swipe navigation */}
      <div className="md:hidden">
        {loading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <SwipeNavigationWrapper>
            {children}
          </SwipeNavigationWrapper>
        )}
      </div>

      {/* Desktop: nouvelle architecture */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <SideBar />

        {/* Contenu principal */}
        <div className={`flex-1 flex flex-col w-full`}>
          {/* Breadcrumb en haut */}
          <Breadcrumb />
          <ItemBar />
          

          {/* Zone de contenu */}
          <main className="flex-1 overflow-auto bg-background md:bg-deskbackground">
            {!loading && !isAuthenticated ? (
              // Si non connecté, afficher le FlashNoteWidget
              <FlashNoteWidget />
            ) : (
              // Si connecté, afficher le contenu normal
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