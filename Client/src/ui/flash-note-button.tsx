import React from 'react';
import Icon from './Icon';

interface FlashNoteButtonProps {
  isOpen?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function FlashNoteButton({ isOpen = true, onClick, className = "" }: FlashNoteButtonProps) {
  return (
    <div className={`p-4 ${className}`}>
      <button
        onClick={onClick}
        className={`group flex items-center border-2 border-primary text-primary hover:text-white bg-none hover:bg-primary rounded-lg transition-all py-3 gap-3 ${isOpen ? `w-full px-4` : `w-fit px-2`}`}
        title='Flash Note'
      >
        <Icon
          name="flash"
          className="text-primary group-hover:text-white stroke-[4] transition-colors"
          size={30}
        />
        <span className={`font-medium ${isOpen ? `flex` : `hidden`}`}>Flash Note</span>
      </button>
    </div>
  );
}