"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthSidebar from './AuthSidebar';
import NavigationSidebar from './NavigationSidebar';

interface SideBarProps {
    state?: string; // 'open' ou 'closed'
    className?: string;
}

export default function SideBar({ state, className }: SideBarProps) {
  const { isAuthenticated, loading, user } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className={`${className} fixed top-0 left-0 h-full bg-white border-r border-gray-200 ${state === 'open' ? 'md:w-80' : 'md:w-20'} transition-all duration-300`}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} fixed top-0 left-0 h-full bg-white border-r border-gray-200 ${state === 'open' ? 'md:w-80' : 'md:w-20'} transition-all duration-300 z-40`}>
      {isAuthenticated && user ? (
        <NavigationSidebar user={user} />
      ) : (
        <AuthSidebar />
      )}
    </div>
  );
}
