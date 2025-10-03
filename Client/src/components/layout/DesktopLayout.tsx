"use client";

import React from 'react';
import SideBar from '@/components/sideBar/sideBar';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import NoteHeader from '@/components/noteHeader/NoteHeader';
import Icon from '@/ui/Icon';
import { SwipeNavigationWrapper } from '@/components/navigation/SwipeNavigationWrapper';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const { isOpen } = useSidebarToggle();



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
          

          {/* Zone de contenu */}
          <main className="flex-1 overflow-auto bg-background md:bg-deskbackground">
            {/* Si déconnecté, zone vide avec message */}
            {!loading && !isAuthenticated ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-beige-foncer rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 text-element">
                      <Icon name="files" size={48} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-clrprincipal mb-2">
                      Bienvenue sur Yanotela
                    </h2>
                    <p className="text-element">
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