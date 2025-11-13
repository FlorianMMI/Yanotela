import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GetNoteById } from '@/loader/loader';

export default function ItemBar() {
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [onNotePage, setOnNotePage] = useState(false);
    const [noteTag, setNoteTag] = useState<string>('var(--primary)'); // Couleur du tag de la note
    const pathname = usePathname();

    useEffect(() => {
        // Détection uniquement sur la route /notes/[id]
        const notesIdRegex = /^\/notes\/[\w-]+$/;
        if (notesIdRegex.test(pathname)) {
            setOnNotePage(true);
            (async () => {
                const note = await GetNoteById(pathname.split('/').pop()!);
                if (note && !('error' in note) && typeof note === 'object') {
                    // Récupérer le tag de la note
                    if ('tag' in note) {
                        setNoteTag(note.tag || 'var(--primary)');
                    }
                    
                    // Vérifier le rôle pour le mode lecture seule
                    if ('userRole' in note && note.userRole === 3) {
                        setIsReadOnly(true);
                    } else {
                        setIsReadOnly(false);
                    }
                } else {
                    setIsReadOnly(false);
                    setNoteTag('var(--primary)'); // Couleur par défaut en cas d'erreur
                }
            })();
        } else {
            setOnNotePage(false);
            setIsReadOnly(false);
            setNoteTag('var(--primary)'); // Reset à la couleur par défaut
        }
    }, [pathname]);

    // Écouter les mises à jour de tag
    useEffect(() => {
        const handleTagUpdate = () => {
            const notesIdRegex = /^\/notes\/[\w-]+$/;
            if (notesIdRegex.test(pathname)) {
                // Re-charger les données de la note pour récupérer le nouveau tag
                (async () => {
                    const note = await GetNoteById(pathname.split('/').pop()!);
                    if (note && !('error' in note) && typeof note === 'object' && 'tag' in note) {
                        setNoteTag(note.tag || 'var(--primary)');
                    }
                })();
            }
        };

        window.addEventListener('auth-refresh', handleTagUpdate);
        return () => {
            window.removeEventListener('auth-refresh', handleTagUpdate);
        };
    }, [pathname]);

    if (!onNotePage) return (
        <div 
            className='h-8 text-white flex items-center text-sm'
            style={{ backgroundColor: noteTag }}
        ></div>
    );

    return (
        <div 
            className='h-8 text-white flex items-center text-sm'
            style={{ backgroundColor: noteTag }}
        >
            <p className='ml-2'>
                {isReadOnly ? "📖 Mode lecture seule - Vous ne pouvez pas modifier cette note" : ""}
            </p>
            {/* Conteneur pour la toolbar desktop (portail) */}
            <div id="desktop-toolbar-container" className="flex-1 flex justify-start items-center pr-2"></div>
        </div>
    );
}