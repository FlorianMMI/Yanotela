"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { usePathname } from "next/navigation";
import React from "react";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Pages qui ne nécessitent pas d'authentification
  const publicRoutes = [
    '/login',
    '/register', 
    '/forgot-password',
    '/validate',
    '/'
  ];
  
  // Vérifier si la route actuelle est publique
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/validate') {
      // Pour /validate, on vérifie si ça commence par /validate/
      return pathname.startsWith('/validate/');
    }
    return pathname === route;
  });
  
  // Si c'est une route publique, ne pas vérifier l'authentification
  if (!isPublicRoute) {
    useAuthRedirect(); // Vérifie l'authentification et redirige si nécessaire
  }

  return <>{children}</>;
}