'use client';

import React from 'react';
import Icon from '../Icon';
import { useRouter } from 'next/dist/client/components/navigation';

interface TotalFoldersProps {
    totalFolders?: number;
}

export default function TotalFolders({ totalFolders }: TotalFoldersProps) {
    const router = useRouter();
    const redirectToFolders = () => {
    router.push('/dossiers');
};
    const safeTotalFolders = totalFolders ?? 0;

    return (
        <button 
            className='flex flex-col items-center justify-center p-6 m-1 bg-clrsecondaire rounded-xl shadow-md w-fit h-fit border border-clrsecondaire hover:bg-amber-100 hover:border-amber-500 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500' 
            onClick={redirectToFolders} 
            title='Voir tous mes dossiers'
            aria-label='Voir tous mes dossiers'
        >
            <Icon name='folder' size={40} className='text-primary mb-2' />
            <div className='flex flex-row items-center justify-center space-x-2'>
                <span className="text-2xl font-semibold text-clrprincipal group-hover:text-primary">{totalFolders !== undefined ? totalFolders : '...'}</span>
                {safeTotalFolders > 1 || safeTotalFolders === 0 ?
                    <span className="text-lg text-clrprincipal group-hover:text-primary">Dossiers</span>
                    : <span className="text-lg text-clrprincipal group-hover:text-primary">Dossier</span>}
            </div>
        </button>
    );
}
