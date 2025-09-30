'use client';

import React from 'react';
import Icon from '../Icon';

interface TotalNotesProps {
    totalNotes?: number;
}

const redirectToNotes = () => {
    window.location.href = '/notes';
}

export default function TotalNotes({ totalNotes }: TotalNotesProps) {

    return (
        <div className='flex flex-col items-center justify-center p-6 m-1 bg-clrsecondaire rounded-xl shadow-md w-fit h-fit border border-clrsecondaire hover:bg-red-100 hover:border-red-500 transition-all cursor-pointer group' onClick={redirectToNotes} title='Voir toutes mes notes'>
            <Icon name='docs' size={40} className='text-primary mb-2' />
            <div className='flex flex-row items-center justify-center space-x-2'>
                <p className="text-2xl font-semibold text-clrprincipal group-hover:text-primary">{totalNotes !== undefined ? totalNotes : '...'}</p>
                <p className="text-lg text-clrprincipal group-hover:text-primary">Notes</p>
            </div>
        </div>
    );
}