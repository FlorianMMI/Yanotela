"use client";

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { DropdownMenu } from './dropdown-menu';
import { FOLDER_COLORS } from '@/hooks/folderColors';

interface ColorFilterDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

/**
 * Color filter dropdown component
 * Displays color swatches for filtering by tag color
 */
export function ColorFilterDropdown({
  isOpen,
  onToggle,
  selectedColor,
  onColorSelect,
}: ColorFilterDropdownProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => isOpen && onToggle(), isOpen);

  const handleColorSelect = (color: string) => {
    onColorSelect(color);
    onToggle();
  };

  return (
    <div ref={menuRef} className="relative">
      <motion.button
        onClick={onToggle}
        className={`flex flex-row items-center cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full ${
          selectedColor
            ? 'border-2 border-primary ring-2 ring-primary'
            : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
        }`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 1 }}
        aria-label="Filtrer par couleur de tag"
      >
        <span
          className="w-5 h-5 rounded-full border border-gray-300"
          style={{ backgroundColor: selectedColor || 'var(--primary)' }}
        />
        Tags
      </motion.button>

      <DropdownMenu isOpen={isOpen} onClose={onToggle} className="w-64">
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-gray-700 mb-2">Couleur du tag</p>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => handleColorSelect(color.value)}
                className={`w-7 h-7 rounded-full border-2 transition-colors ${
                  selectedColor === color.value
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-gray-300 hover:border-primary'
                }`}
                style={{ backgroundColor: color.value }}
                aria-label={color.label}
              />
            ))}
            <button
              onClick={() => handleColorSelect('')}
              className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs bg-white"
              aria-label="Toutes les couleurs"
            >
              ✕
            </button>
          </div>
        </div>
      </DropdownMenu>
    </div>
  );
}
