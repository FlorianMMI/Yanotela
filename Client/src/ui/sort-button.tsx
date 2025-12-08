"use client";

import React from 'react';
import { motion } from 'motion/react';
import { RecentIcon } from '@/libs/Icons';

interface SortButtonProps {
  onClick: () => void;
  label: string;
  isActive?: boolean;
  sortDir?: 'asc' | 'desc';
  showDirectionIndicator?: boolean;
  className?: string;
}

/**
 * Reusable sort button component
 * Displays sort direction indicator when active
 */
export function SortButton({
  onClick,
  label,
  isActive = false,
  sortDir = 'desc',
  showDirectionIndicator = true,
  className = '',
}: SortButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex flex-row items-center grow cursor-pointer p-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full min-w-max ${
        isActive
          ? 'bg-primary text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
      } ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 1 }}
    >
      <RecentIcon
        width={20}
        height={20}
        className={isActive ? 'text-white' : 'text-gray-700'}
      />
      {label}
      {showDirectionIndicator && (isActive || sortDir) && ` ${sortDir === 'desc' ? '▼' : '▲'}`}
    </motion.button>
  );
}
