"use client";

import React from 'react';
import SideBar from '@/components/sideBar/sideBar';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import ItemBar from '@/components/itemBar/ItemBar';
import { SwipeNavigationWrapper } from '@/components/navigation/SwipeNavigationWrapper';
import { usePathname } from 'next/navigation';
import FlashNoteWidget from '@/components/flashnote/FlashNoteWidget';
import ParamModal from '@/components/commentaire/commentModal';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const [isCommentModalOpen, setCommentModalOpen] = React.useState(false);
  const openCommentModal = () => setCommentModalOpen(true);
  const closeCommentModal = () => setCommentModalOpen(false);
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  
  // Pages où on affiche le contenu SANS FlashNote (même si non connecté)
  const contentPages = ['/cgu', '/mentions-legales'];
  const isContentPage = contentPages.some(page => pathname.startsWith(page));
  
  // Notes publiques individuelles : afficher le contenu (login à gauche) SANS FlashNote
  const isPublicNote = pathname?.startsWith('/notes/') && pathname !== '/notes';

  return (
    <>
      {/* Mobile: comportement avec hauteur fixe et scroll contenu */}
      <div className="md:hidden h-dvh flex flex-col">
        {isContentPage ? (
          // Pages de contenu : affichage direct sans swipe navigation
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        ) : (
          // Pages protégées : avec swipe navigation et scroll interne
          <SwipeNavigationWrapper>
            {children}
          </SwipeNavigationWrapper>
        )}
      </div>

      {/* Desktop: nouvelle architecture */}
      <div className="hidden md:flex h-screen">
        {/* Modal commentaire globale */}
        {isCommentModalOpen && <ParamModal onClose={closeCommentModal} />}
        {/* Sidebar - toujours visible */}
        <SideBar />

        {/* Contenu principal */}
        <div className={`flex-1 flex flex-col w-full`}>
          {/* Breadcrumb et ItemBar - toujours visibles */}
          <Breadcrumb openCommentModal={openCommentModal} />
          <ItemBar />

          {/* Zone de contenu */}
          <main className="flex-1 overflow-auto bg-background md:bg-deskbackground">
            {!loading && !isAuthenticated && !isContentPage && !isPublicNote ? (
              // Si non connecté ET pas sur une page de contenu (/cgu, /mentions-legales) ET pas sur une note publique, afficher FlashNote
              <FlashNoteWidget />
            ) : (
              // Sinon (connecté OU page de contenu OU note publique), afficher le contenu de la page
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
