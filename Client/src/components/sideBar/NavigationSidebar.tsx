"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { AuthState } from '@/hooks/useAuth';
import Icons from '@/ui/Icon';

interface NavigationSidebarProps {
  user: AuthState['user'];
}

export default function NavigationSidebar({ user }: NavigationSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3001/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const navItems = [
    {
      href: '/notes',
      label: 'Mes Notes',
      icon: 'files',
      isActive: pathname === '/notes',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header avec logo et utilisateur */}
      <div className="p-4 border-b border-gray-300">
        <Link className="flex items-center h-24 justify-center" href="/">
          <Icons
          name="logo"
          className="text-clrprincipal stroke-25"
          size={180}
          >
          </Icons>

          
        </Link>
        
        <div className="bg-beige-foncer rounded-lg p-3">
          <p className="text-sm font-medium text-clrprincipal">
            Bonjour, {user?.pseudo}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  item.isActive
                    ? 'bg-primary text-white'
                    : 'text-clrprincipal hover:text-black bg-beige-foncer hover:bg-gray-100'
                }`}
              >
                <Icons
                  name={item.icon}
                  size={20}
                  className={item.isActive ? 'filter brightness-0 invert' : ''}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer avec déconnexion */}
      <div className="p-4 border-t border-gray-300">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-clrprincipal hover:bg-gray-100 rounded-lg transition-colors hover:text-clrsecondaire"
        >
          <Icons
            name="keyhole"
            size={20}
          />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}