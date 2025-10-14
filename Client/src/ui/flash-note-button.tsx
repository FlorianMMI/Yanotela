import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

interface FlashNoteButtonProps {
  isOpen?: boolean;
  isActive?: boolean;
  onClick?: () => void | Promise<any>;
  className?: string;
  isLoading?: boolean;
}

export default function FlashNoteButton({ isOpen = true, isActive = false, onClick, className = "", isLoading }: FlashNoteButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const effectiveLoading = typeof isLoading === 'boolean' ? isLoading : internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return;
    try {
      setInternalLoading(true);
      const res = onClick();
      if (res && typeof (res as any).then === 'function') {
        await res;
      }
    } catch (err) {
      // ignore - keep UX feedback
      // optionally could expose onError prop
    } finally {
      setInternalLoading(false);
    }
  };
  return (
    <div className={`p-4 ${className}`}>
      <motion.button
        onClick={handleClick}
        className={`group flex items-center justify-center md:justify-normal border-2 rounded-lg py-3 gap-3 ${isOpen ? `w-full px-4` : `w-fit px-2`} ${isActive
          ? 'bg-primary text-white border-primary'
          : 'border-primary text-primary hover:text-white bg-none hover:bg-primary'
          }`}
        title='Flash Note'
      >
        {effectiveLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        ) : (
          <>
            <Icon
              name="flash"
              className={`stroke-[4] transition-colors ${isActive
                ? 'text-white'
                : 'text-primary group-hover:text-white'
                }`}
              size={30}
            />
            <span className={`font-medium ${isOpen ? `flex` : `hidden`}`}>Flash Notes</span>
          </>
        )}
      </motion.button>
    </div>
  );
}