'use client';

import React from 'react';
import Icon from '../Icon';

interface TotalNotesProps {
    totalNotes?: number;
}

export default function TotalNotes({ totalNotes }: TotalNotesProps) {
    return (
        <div className='flex flex-col items-center justify-center p-6 m-1 bg-white rounded-xl shadow-md w-fit h-fit border border-gray-200 hover:bg-red-100 hover:border-red-500 transition-all cursor-pointer group'>
            <Icon name='docs' size={40} className='text-primary mb-2' />
            <div className='flex flex-row items-center justify-center space-x-2'>
                <p className="text-2xl font-semibold text-gray-800 group-hover:text-primary">{totalNotes !== undefined ? totalNotes : '...'}</p>
                <p className="text-lg text-gray-500 group-hover:text-primary">Notes</p>
            </div>
        </div>
    );
}