'use client';

import React from 'react';
import Icon from '../Icon';
import { useRouter } from "next/navigation";

interface TotalNotesProps {
    totalNotes?: number;
}

export default function TotalNotes({ totalNotes }: TotalNotesProps) {

    const router = useRouter();

    const redirectToNotes = () => {
    router.push('/notes');
    };
    const safeTotalNotes = totalNotes ?? 0;

    return (
        <button 
            className='flex flex-col items-center justify-center p-6 m-1 bg-clrsecondaire rounded-xl shadow-md w-fit h-fit border border-clrsecondaire hover:bg-dangerous-100 hover:border-dangerous-500 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-dangerous-500' 
            onClick={redirectToNotes} 
            title='Voir toutes mes notes'
            aria-label='Voir toutes mes notes'
        >
            <Icon name='docs' size={40} className='text-primary mb-2' />
            <div className='flex flex-row items-center justify-center space-x-2'>
                <span className="text-2xl font-semibold text-clrprincipal group-hover:text-primary">{totalNotes !== undefined ? totalNotes : '...'}</span>
                {safeTotalNotes > 1 || safeTotalNotes === 0 ?
                    <span className="text-lg text-clrprincipal group-hover:text-primary">Notes</span>
                    : <span className="text-lg text-clrprincipal group-hover:text-primary">Note</span>}
            </div>
        </button>
    );
}