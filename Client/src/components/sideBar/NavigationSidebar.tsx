"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AuthState } from '@/hooks/useAuth';
import NotificationList from '../notificationList/page';
import Icon from '@/ui/Icon';

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
      href: '/notes',
      label: 'Mes Notes',
      icon: 'docs',
      isActive: pathname.includes('/notes'),
    },
    {
      href: '/dossiers',
      label: 'Mes Dossiers',
      icon: 'folder',
      isActive: pathname.includes('/dossiers'),
    },
  ];

  return (
    <div className="h-full w-full flex flex-col relative text-nowrap">

      <div className="relative flex flex-row items-center p-4 gap-2">

        <Link href="/profil"
          className={`flex items-center ${isopen ? `flex-1 px-4  ` : `w-fit px-2  `} py-3 gap-3 rounded-lg transition-all text-gray-700 ${isProfile ? 'bg-primary text-white' : ' hover:bg-gray-100 hover:shadow-sm'}`}
          title='Accéder à mon profil'>

          <Icon
            name="profile"
            className={isProfile ? "text-white" : "text-primary"}
            size={30}
          />

          {isopen ? <div className="flex flex-col flex-1 min-w-0">
            <p className={`text-sm font-medium text-clrprincipal group-hover:text-primary transition-colors duration-300 ${isProfile ? 'text-white' : ''}`}>
              Bonjour, <span className={`text-primary capitalize ${isProfile ? 'text-white' : ''}`}>{user?.pseudo}</span>
            </p>
            <p className={`text-xs text-element truncate group-hover:text-gray-600 transition-colors duration-300 ${isProfile ? 'text-white' : ''}`}>
              {user?.email}
            </p>
          </div> : ""}

        </Link>

        <NotificationList isOpenSideBar={isopen} />
      </div>

      <hr className="border-t border-element mx-8" />

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}

                className={`flex items-center rounded-lg transition-all py-3 gap-3 ${isopen ? `w-full px-4  ` : `w-fit px-2 `} ${item.isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                title={`Accéder à ${item.label}`}
              >
                <Icon
                  name={item.icon}
                  className={item.isActive ? "text-white" : "text-primary"}
                  size={30}
                  strokeWidth={12}

                />
                <span className={`font-medium ${isopen ? `flex` : `hidden`}`}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link className='h-fit flex m-4 justify-center items-center overflow-hidden '
        href="/"
        title='retour à l`accueil'
      >
        <Icon
          name={isopen ? `logo` : `logoIcon`}
          className="text-primary stroke-25"
          width={isopen ? 150 : 25}
          height={isopen ? 50 : 25}
        />
      </Link>

      {/* Liens légaux */}
      {isopen && (
        <div className="px-4 pb-4 space-y-2 text-xs text-element">
          <div className="flex gap-3 justify-center">
            <Link 
              href="/cgu" 
              className="hover:text-primary transition-colors hover:underline"
              title="Conditions Générales d'Utilisation"
            >
              CGU
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/mentions-legales" 
              className="hover:text-primary transition-colors hover:underline"
              title="Mentions Légales"
            >
              Mentions Légales
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
