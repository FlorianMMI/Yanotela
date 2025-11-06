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
        <div className='flex flex-col items-center justify-center p-6 m-1 bg-clrsecondaire rounded-xl shadow-md w-fit h-fit border border-clrsecondaire hover:bg-dangerous-100 hover:border-dangerous-500 transition-all cursor-pointer group' onClick={redirectToNotes} title='Voir toutes mes notes'>
            <Icon name='docs' size={40} className='text-primary mb-2' />
            <div className='flex flex-row items-center justify-center space-x-2'>
                <p className="text-2xl font-semibold text-clrprincipal group-hover:text-primary">{totalNotes !== undefined ? totalNotes : '...'}</p>
                {safeTotalNotes > 1 || safeTotalNotes === 0 ?
                    <p className="text-lg text-clrprincipal group-hover:text-primary">Notes</p>
                    : <p className="text-lg text-clrprincipal group-hover:text-primary">Note</p>}
            </div>
        </div>
    );
}