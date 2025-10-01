"use client";

import { useState, useEffect } from 'react';

/**
 * Hook pour gérer l'état de la sidebar (pliée/dépliée)
 * Avec persistance dans localStorage
 */
export function useSidebarToggle() {
  const [isOpen, setIsOpen] = useState(true);

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open');
    if (saved !== null) {
      setIsOpen(saved === 'true');
    }
  }, []);

  // Sauvegarder l'état dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('sidebar-open', String(isOpen));
  }, [isOpen]);

  const toggle = () => setIsOpen(prev => !prev);

  return { isOpen, toggle, setOpen: setIsOpen };
}
