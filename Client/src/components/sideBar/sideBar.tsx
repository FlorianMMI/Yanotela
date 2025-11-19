"use client";

import React, { useEffect } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import AuthSidebar from './AuthSidebar';
import NavigationSidebar from './NavigationSidebar';
import Icon from '@/ui/Icon';
import { ArrowIcon } from '@/libs/Icons';

interface SideBarProps {
    className?: string;
}

export default function SideBar({ className }: SideBarProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const { isOpen, toggle, setOpen } = useSidebarToggle();

  // Ouvrir automatiquement la sidebar quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && user) {
      setOpen(true);
    }
    else{
      setOpen(true);
    }
  }, [isAuthenticated, user, setOpen]);

  // Loading state 

  if (loading) { 
    return (
      <div className={`flex w-full h-full bg-background border-r border-gray-300 ${isOpen ? 'md:w-80' : 'md:w-20'} transition-all duration-300`}>
        <div className="flex items-center justify-center h-full w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

 return (
    <div className={`flex h-full relative bg-background border-r border-gray-300 ${isOpen ? 'md:w-80' : 'md:w-20'} transition-all duration-300 z-40`}>
      {isAuthenticated && user ? (
        <NavigationSidebar user={user} isopen={isOpen} />
      ) : (
        <AuthSidebar />
      )}

      {isAuthenticated && user ? ( 
        <button 
        onClick={toggle}
        className='absolute top-1/2 -right-4 transform -translate-y-1/2 z-1 p-2 bg-background border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition-colors w-[40px] h-[40px] flex items-center justify-center cursor-pointer'
      >
        <ArrowIcon width={20} height={20} className={isOpen ? '' : 'rotate-180'}/>
      </button>
      ) : (
        ""
      )}
    </div>
  );
}
