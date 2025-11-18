import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GetNoteById, GetFolderById } from '@/loader/loader';

export default function ItemBar() {
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [onNotePage, setOnNotePage] = useState(false);
    const [onFolderPage, setOnFolderPage] = useState(false);
    const [itemColor, setItemColor] = useState<string>('var(--primary)'); // Couleur du tag/dossier
    const pathname = usePathname();

    useEffect(() => {
        const notesIdRegex = /^\/notes\/[\w-]+$/;
        const foldersIdRegex = /^\/dossiers\/[\w-]+$/;
        
        if (notesIdRegex.test(pathname)) {
            // Page de note
            setOnNotePage(true);
            setOnFolderPage(false);
            (async () => {
                const note = await GetNoteById(pathname.split('/').pop()!);
                if (note && !('error' in note) && typeof note === 'object') {
                    // Récupérer le tag de la note
                    if ('tag' in note) {
                        setItemColor(note.tag || 'var(--primary)');
                    }
                    
                    // Vérifier le rôle pour le mode lecture seule
                    if ('userRole' in note && note.userRole === 3) {
                        setIsReadOnly(true);
                    } else {
                        setIsReadOnly(false);
                    }
                } else {
                    setIsReadOnly(false);
                    setItemColor('var(--primary)'); // Couleur par défaut en cas d'erreur
                }
            })();
        } else if (foldersIdRegex.test(pathname)) {
            // Page de dossier
            setOnFolderPage(true);
            setOnNotePage(false);
            setIsReadOnly(false);
            (async () => {
                const folderData = await GetFolderById(pathname.split('/').pop()!);
                if (folderData && folderData.folder && !folderData.error) {
                    // Récupérer la couleur du dossier
                    const folderColor = folderData.folder.CouleurTag || 'var(--primary)';
                    setItemColor(folderColor);
                } else {
                    setItemColor('var(--primary)'); // Couleur par défaut en cas d'erreur
                }
            })();
        } else {
            // Autres pages
            setOnNotePage(false);
            setOnFolderPage(false);
            setIsReadOnly(false);
            setItemColor('var(--primary)'); // Reset à la couleur par défaut
        }
    }, [pathname]);

    // Écouter les mises à jour de tag/couleur
    useEffect(() => {
        const handleUpdate = () => {
            const notesIdRegex = /^\/notes\/[\w-]+$/;
            const foldersIdRegex = /^\/dossiers\/[\w-]+$/;
            
            if (notesIdRegex.test(pathname)) {
                // Re-charger les données de la note pour récupérer le nouveau tag
                (async () => {
                    const note = await GetNoteById(pathname.split('/').pop()!);
                    if (note && !('error' in note) && typeof note === 'object' && 'tag' in note) {
                        setItemColor(note.tag || 'var(--primary)');
                    }
                })();
            } else if (foldersIdRegex.test(pathname)) {
                // Re-charger les données du dossier pour récupérer la nouvelle couleur
                (async () => {
                    const folderData = await GetFolderById(pathname.split('/').pop()!);
                    if (folderData && folderData.folder && !folderData.error) {
                        setItemColor(folderData.folder.CouleurTag || 'var(--primary)');
                    }
                })();
            }
        };

        // Listener pour les changements de dossier spécifique
        const handleFolderUpdate = (event: CustomEvent) => {
            const foldersIdRegex = /^\/dossiers\/[\w-]+$/;
            if (foldersIdRegex.test(pathname)) {
                const currentFolderId = pathname.split('/').pop();
                // Vérifier si c'est le dossier actuel qui a été modifié
                if (event.detail && event.detail.folderId === currentFolderId) {
                    // Utiliser directement la nouvelle couleur de l'événement
                    if (event.detail.color) {
                        setItemColor(event.detail.color);
                    } else {
                        // Sinon, recharger depuis l'API
                        (async () => {
                            const folderData = await GetFolderById(currentFolderId!);
                            if (folderData && folderData.folder && !folderData.error) {
                                setItemColor(folderData.folder.CouleurTag || 'var(--primary)');
                            }
                        })();
                    }
                }
            }
        };

        window.addEventListener('auth-refresh', handleUpdate);
        window.addEventListener('folderUpdateRequested', handleFolderUpdate as EventListener);
        
        return () => {
            window.removeEventListener('auth-refresh', handleUpdate);
            window.removeEventListener('folderUpdateRequested', handleFolderUpdate as EventListener);
        };
    }, [pathname]);

    if (!onNotePage && !onFolderPage) return (
        <div 
            className='h-8 text-white flex items-center text-sm'
            style={{ backgroundColor: itemColor }}
        ></div>
    );

    return (
        <div 
            className='h-8 text-white flex items-center text-sm'
            style={{ backgroundColor: itemColor }}
        >
            <p className='ml-2'>
                {isReadOnly ? "📖 Mode lecture seule - Vous ne pouvez pas modifier cette note" : ""}
            </p>
            {/* Conteneur pour la toolbar desktop (portail) */}
            <div id="desktop-toolbar-container" className="flex-1 flex justify-start items-center pr-2"></div>
        </div>
    );
}