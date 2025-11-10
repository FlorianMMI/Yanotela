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
    router.push('/folder');
};
    const safeTotalFolders = totalFolders ?? 0;

    return (
        <div className='flex flex-col items-center justify-center p-6 m-1 bg-clrsecondaire rounded-xl shadow-md w-fit h-fit border border-clrsecondaire hover:bg-amber-100 hover:border-amber-500 transition-all cursor-pointer group' onClick={redirectToFolders} title='Voir tous mes dossiers'>
            <Icon name='folder' size={40} className='text-primary mb-2' />
            <div className='flex flex-row items-center justify-center space-x-2'>
                <p className="text-2xl font-semibold text-clrprincipal group-hover:text-primary">{totalFolders !== undefined ? totalFolders : '...'}</p>
                {safeTotalFolders > 1 || safeTotalFolders === 0 ?
                    <p className="text-lg text-clrprincipal group-hover:text-primary">Dossiers</p>
                    : <p className="text-lg text-clrprincipal group-hover:text-primary">Dossier</p>}
            </div>
        </div>
    );
}
