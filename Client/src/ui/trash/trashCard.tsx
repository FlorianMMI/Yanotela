"use client";

import React from 'react';
import { TrashIcon } from '@/libs/Icons';

interface TrashCardProps {
  onClick?: () => void;
  title?: string;
}

export default function TrashCard({ onClick, title = 'Corbeille' }: TrashCardProps) {
  return (
    <button
      className='flex flex-col items-center justify-center p-6 m-1 bg-clrsecondaire rounded-xl shadow-md w-[180px] h-fit border border-clrsecondaire hover:bg-dangerous-100 hover:border-dangerous-500 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-dangerous-500'
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <TrashIcon width={40} height={40} className='text-primary mb-2' />
      <div className='flex items-center justify-center'>
        <span className='text-lg font-semibold text-clrprincipal group-hover:text-primary'>{title}</span>
      </div>
    </button>
  );
}
