"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable dropdown menu container
 * Handles animation and positioning
 */
export function DropdownMenu({
  isOpen,

  children,
  className = '',
}: DropdownMenuProps) {
  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${className}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable dropdown menu item
 */
export function DropdownItem({
  onClick,
  isActive,
  children,
  className = '',
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-2 py-1 rounded transition-colors ${
        isActive ? 'bg-primary text-white font-medium' : 'hover:bg-gray-100'
      } ${className}`}
    >
      {children}
    </button>
  );
}
