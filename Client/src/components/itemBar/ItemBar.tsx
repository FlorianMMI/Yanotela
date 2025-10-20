import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GetNoteById } from '@/loader/loader';

export default function ItemBar() {
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [onNotePage, setOnNotePage] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Détection uniquement sur la route /notes/[id]
        const notesIdRegex = /^\/notes\/[\w-]+$/;
        if (notesIdRegex.test(pathname)) {
            setOnNotePage(true);
            (async () => {
                const note = await GetNoteById(pathname.split('/').pop()!);
                if (
                    note &&
                    !('error' in note) &&
                    typeof note === 'object' &&
                    'userRole' in note &&
                    note.userRole === 3
                ) {
                    setIsReadOnly(true);
                } else {
                    setIsReadOnly(false);
                }
            })();
        } else {
            setOnNotePage(false);
            setIsReadOnly(false);
        }
    }, [pathname]);

    if (!onNotePage) return  <div className='h-8 bg-primary text-white flex items-center text-sm'></div>;

    return (
        <div className='h-8 bg-primary text-white flex items-center text-sm'>
            <p className='ml-2'>
                {isReadOnly ? "📖 Mode lecture seule - Vous ne pouvez pas modifier cette note" : ""}
            </p>
            {/* Conteneur pour la toolbar desktop (portail) */}
            <div id="desktop-toolbar-container" className="flex-1 flex justify-end items-center pr-2"></div>
        </div>
    );
}