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
      icon: '/icons.svg',
      isActive: pathname === '/notes' || pathname.startsWith('/notes/'),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header avec logo et utilisateur */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Image
            src="/logo.svg"
            alt="Yanotela"
            width={180}
            height={80}
            className="flex-shrink-0"
          />
        </div>

        <div className="bg-background rounded-lg p-3">
          <p className="text-sm font-medium text-gray-900">
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${item.isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  }`}
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

      {/* Footer avec déconnexion */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-200 hover:shadow-md hover:text-gray-900 rounded-lg transition-all duration-200 cursor-pointer"
        >
          <Image
        src="/keyhole.svg"
        alt=""
        width={20}
        height={20}
          />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>

    </div>
  );
}