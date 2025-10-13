import React from 'react';
import Icon from './Icon';

interface FlashNoteButtonProps {
  isOpen?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function FlashNoteButton({ isOpen = true, isActive = false, onClick, className = "" }: FlashNoteButtonProps) {
  return (
    <div className={`p-4 ${className}`}>
      <button
        onClick={onClick}
        className={`group flex items-center border-2 rounded-lg transition-all py-3 gap-3 ${isOpen ? `w-full px-4` : `w-fit px-2`} ${
          isActive 
            ? 'bg-primary text-white border-primary' 
            : 'border-primary text-primary hover:text-white bg-none hover:bg-primary'
        }`}
        title='Flash Note'
      >
        <Icon
          name="flash"
          className={`stroke-[4] transition-colors ${
            isActive 
              ? 'text-white' 
              : 'text-primary group-hover:text-white'
          }`}
          size={30}
        />
        <span className={`font-medium ${isOpen ? `flex` : `hidden`}`}>Flash Note</span>
      </button>
    </div>
  );
}