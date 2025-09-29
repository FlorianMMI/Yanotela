"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    
    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
      return [{ label: 'Accueil', isActive: true }];
    }

    if (pathname === '/notes') {
      return [
        { label: 'Mes Notes', isActive: true },
      ];
    }

    if (pathname.startsWith('/notes/') && segments.length > 1) {
      const noteId = segments[1];
      return [
        { label: 'Mes Notes', href: '/notes' },
        { label: `Note #${noteId}`, isActive: true },
      ];
    }

    if (pathname === '/forgot-password') {
      return [
        { label: 'Mot de passe oublié', isActive: true },
      ];
    }

    if (pathname.startsWith('/forgot-password/') && segments.length > 1) {
      return [
        { label: 'Mot de passe oublié', href: '/forgot-password' },
        { label: 'Réinitialisation', isActive: true },
      ];
    }

    // Fallback pour les autres routes
    return [
      { label: 'Accueil', href: '/' },
      { label: 'Page courante', isActive: true },
    ];
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Image
                src="/arrow-barre.svg"
                alt=">"
                width={12}
                height={12}
                className="text-gray-400"
              />
            )}
            
            {item.href && !item.isActive ? (
              <Link
                href={item.href}
                className="text-primary hover:text-rouge-hover transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`${
                  item.isActive 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}