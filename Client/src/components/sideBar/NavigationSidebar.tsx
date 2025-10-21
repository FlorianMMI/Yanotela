"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { AuthState } from '@/hooks/useAuth';
import NotificationList from '../notificationList/page';
import Icon from '@/ui/Icon';
import FlashNoteButton from '@/ui/flash-note-button';
import path from 'path';

interface NavigationSidebarProps {
  user: AuthState['user'];
  isopen?: boolean;
}

export default function NavigationSidebar({ user, isopen }: NavigationSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isProfile = pathname.includes('/profil');
  const navItems = [
        {
      href: '/flashnote',
      label: 'Flash Note',
      icon: 'flash',
      isActive: pathname.includes('/flashnote'),
    },
    {
      href: '/flashnote',
      label: 'Flash Note',
      icon: 'flash',
      isActive: pathname === '/flashnote',
    },
    {
      href: '/notes',
      label: 'Mes Notes',
      icon: 'docs',
      isActive: pathname.includes('/notes'),
    }

  ];

  return (
    <div className="h-full w-full flex flex-col">

      {/* Profile Section */}
      <div className="p-6 border-b border-gray-200 flex flex-row items-center gap-4 align-middle justify-center">
        <Link 
          href="/profil"
          className={`flex items-center ${isopen ? 'w-full px-4' : 'w-fit px-3'} py-3 gap-3 rounded-xl transition-all duration-200 ${
            isProfile 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-gray-700 hover:bg-gray-50 hover:shadow-md'
          }`}
          title='Accéder à mon profil'
        >
          <Icon
            name="profile"
            className={isProfile ? "text-white" : "text-element"}
            size={28}
          />

          {isopen && (
            <div className="flex flex-col flex-1 min-w-0">
              <p className={`text-sm font-semibold transition-colors duration-200 ${
                isProfile ? 'text-white' : 'text-clrprincipal'
              }`}>
                Bonjour, <span className={`capitalize ${isProfile ? 'text-white' : 'text-primary'}`}>
                  {user?.pseudo}
                </span>
              </p>
              <p className={`text-xs truncate transition-colors duration-200 ${
                isProfile ? 'text-gray-100' : 'text-element'
              }`}>
                {user?.email}
              </p>
            </div>
          )}
        </Link>

        <div className="mt-4">
          <NotificationList isOpenSideBar={isopen} />
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-6">
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center rounded-xl transition-all duration-200 py-3 gap-3 ${
                  isopen ? 'w-full px-4' : 'w-fit px-3'
                } ${
                  item.isActive
                    ? 'bg-primary text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:scale-[1.01]'
                }`}
                title={`Accéder à ${item.label}`}
              >
                <Icon
                  name={item.icon}
                  className={item.isActive ? "text-white stroke-2" : "text-element stroke-2"}
                  size={isopen ? 32 : 28} // Ajustement de la taille pour les icônes de navigation
                />
                {isopen && (
                  <span className="font-semibold text-sm">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logo Section */}
      <div className="p-6 border-t border-gray-200">
        <Link 
          className="flex justify-center items-center py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
          href="/"
          title="Retour à l'accueil"
        >
          <Icon
            name={isopen ? 'logo' : 'logoIcon'}
            className="text-clrprincipal stroke-2" // Ajout d'une épaisseur de trait pour le logo
            width={isopen ? 160 : 32} // Ajustement de la taille du logo
            height={isopen ? 60 : 32}
          />
        </Link>
      </div>
    </div>
  );
}