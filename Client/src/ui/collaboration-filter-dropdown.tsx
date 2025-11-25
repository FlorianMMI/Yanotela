"use client";

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { FiltreIcon } from '@/libs/Icons';
import { useClickOutside } from '@/hooks/useClickOutside';
import { DropdownMenu, DropdownItem } from './dropdown-menu';

interface CollaborationFilterDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  currentFilter: 'all' | 'collaborative' | 'solo';
  onFilterChange: (filter: 'all' | 'collaborative' | 'solo') => void;
}

/**
 * Collaboration filter dropdown component
 * Allows filtering by all notes, collaborative, or solo
 */
export function CollaborationFilterDropdown({
  isOpen,
  onToggle,
  currentFilter,
  onFilterChange,
}: CollaborationFilterDropdownProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => isOpen && onToggle(), isOpen);

  const handleFilterSelect = (filter: 'all' | 'collaborative' | 'solo') => {
    onFilterChange(filter);
    onToggle();
  };

  const getLabel = () => {
    switch (currentFilter) {
      case 'all':
        return 'Toutes';
      case 'solo':
        return 'Personnelles';
      case 'collaborative':
        return 'Collaboratives';
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <motion.button
        onClick={onToggle}
        className={`flex flex-row items-center cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full ${
          currentFilter !== 'all'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 1 }}
      >
        <FiltreIcon
          width={20}
          height={20}
          className={currentFilter !== 'all' ? 'text-white' : 'text-gray-700'}
        />
        {getLabel()}
      </motion.button>

      <DropdownMenu isOpen={isOpen} onClose={onToggle} className="w-48">
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-gray-700 mb-2">Type de note</p>
          <div className="flex flex-col gap-1 mb-2">
            <DropdownItem
              onClick={() => handleFilterSelect('all')}
              isActive={currentFilter === 'all'}
            >
              Toutes
            </DropdownItem>
            <DropdownItem
              onClick={() => handleFilterSelect('solo')}
              isActive={currentFilter === 'solo'}
            >
              Personnelles
            </DropdownItem>
            <DropdownItem
              onClick={() => handleFilterSelect('collaborative')}
              isActive={currentFilter === 'collaborative'}
            >
              Collaboratives
            </DropdownItem>
          </div>
        </div>
      </DropdownMenu>
    </div>
  );
}
