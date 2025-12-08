"use client";

import React from 'react';
import { motion } from 'motion/react';

interface FilterButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
  className?: string;
}

/**
 * Reusable filter button component
 * Used for collaboration filters, color filters, etc.
 */
export function FilterButton({
  onClick,
  isActive,
  icon,
  label,
  count,
  className = '',
}: FilterButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex flex-row items-center cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full ${
        isActive
          ? 'bg-primary text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
      } ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 1 }}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </motion.button>
  );
}
