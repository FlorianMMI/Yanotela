"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { AuthState } from '@/hooks/useAuth';
import Icon from '@/ui/Icon';

interface NavigationSidebarProps {
  user: AuthState['user'];
}

export default function NavigationSidebar({ user }: NavigationSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      href: '/notes',
      label: 'Mes Notes',
      icon: '/icons.svg',
      isActive: pathname === '/notes' || pathname.startsWith('/notes/'),
    },
  ];

  return (
    <div className="h-full flex flex-col">

      {/* Header avec logo et utilisateur */}
      <div className="p-6 border-b border-gray-200">

        <Link href="/profil">
          <div className="bg-background rounded-lg p-3 cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all duration-300 group border border-transparent hover:border-gray-200" title='Accéder à mon profil'>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-clrprincipal group-hover:text-primary transition-colors duration-300">
                  Bonjour, {user?.pseudo}
                </p>
                <p className="text-xs text-gray-500 truncate group-hover:text-gray-600 transition-colors duration-300">
                  {user?.email}
                </p>
              </div>
              <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Icon
                  name="arrow-barre"
                  size={40}
                  className="text-black"
                />
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${item.isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                title='Accéder à mes notes'
              >
                <Icon
                  name="docs"
                  className={item.isActive ? "text-white" : "text-gray-400"}
                  size={30}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center justify-center space-x-3 mb-4">
        <Image
          src="/logo.svg"
          alt="Yanotela"
          width={180}
          height={80}
          className="flex-shrink-0 cursor-pointer"
          title='Retour à l`accueil'
        />
      </div>

    </div>
  );
}