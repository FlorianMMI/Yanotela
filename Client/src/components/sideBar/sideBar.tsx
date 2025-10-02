"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import AuthSidebar from './AuthSidebar';
import NavigationSidebar from './NavigationSidebar';

interface SideBarProps {
    className?: string;
}

export default function SideBar({ className }: SideBarProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const { isOpen } = useSidebarToggle();

  // Loading state
  if (loading) {
    return (
      <div className={`${className} fixed top-0 left-0 h-full bg-background border-r border-gray-300 ${isOpen ? 'md:w-64' : 'md:w-16'} transition-all duration-300`}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} fixed top-0 left-0 h-full bg-background border-r border-gray-300 ${isOpen ? 'md:w-64' : 'md:w-16'} transition-all duration-300 z-40`}>
      {isAuthenticated && user ? (
        <NavigationSidebar user={user} />
      ) : (
        <AuthSidebar />
      )}
    </div>
  );
}
