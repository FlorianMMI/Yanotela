import React, { useState, useRef, useEffect } from "react";
import Icons from "@/ui/Icon";
import { NoteShareUI, NoteInfoUI, NoteFolderUI } from "@/ui/note-modal";

interface NoteMoreProps {
    noteId: string;
    onClose: () => void;
}

type ModalView = "menu" | "share" | "info" | "folder";

export default function NoteMore({ noteId, onClose }: NoteMoreProps) {
    const [currentView, setCurrentView] = useState<ModalView>("menu");
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [loading, setLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Gérer les clics en dehors du modal
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Charger les dossiers et le dossier actuel de la note
    useEffect(() => {
        if (currentView === "folders") {
            loadFolders();
            loadCurrentFolder();
        }
    }, [currentView, noteId]);

    const loadFolders = async () => {
        try {
            const response = await fetch('http://localhost:3001/folder/get', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setFolders(data.folders || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des dossiers:', error);
        }
    };

    const loadCurrentFolder = async () => {
        try {
            const response = await fetch(`http://localhost:3001/folder/note-folder/${noteId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setCurrentFolder(data.folder);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du dossier actuel:', error);
        }
    };

    const assignNoteToFolder = async (folderId: string) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/folder/add-note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    noteId: noteId,
                    dossierId: folderId
                })
            });

            if (response.ok) {
                await loadCurrentFolder(); // Recharger le dossier actuel
                // Optionnel: message de succès
            } else {
                console.error('Erreur lors de l\'assignation de la note');
            }
        } catch (error) {
            console.error('Erreur lors de l\'assignation:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeNoteFromFolder = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/folder/remove-note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    noteId: noteId
                })
            });

            if (response.ok) {
                setCurrentFolder(null);
                // Optionnel: message de succès
            } else {
                console.error('Erreur lors de la suppression de l\'assignation');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        } finally {
            setLoading(false);
        }
    };

    const getModalTitle = () => {
        switch (currentView) {
            case "share":
                return "Partager la note";
            case "info":
                return "Infos de la note";
            case "folder":
                return "Dossiers";
            default:
                return "Option de la note";
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case "share":
                return <NoteShareUI noteId={noteId} />;
            case "info":
                return <NoteInfoUI noteId={noteId} />;
            case "folder":
                return <NoteFolderUI noteId={noteId} />;
            default:
                return (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-col gap-1 py-2">
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium transition-colors"
                                onClick={() => setCurrentView("folder")}
                            >
                                <Icons name="folder" size={22} className="text-primary" />
                                Dossiers
                            </button>
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={() => setCurrentView("share")}
                            >
                                <Icons name="partage" size={22} className="text-primary" />
                                Partager la note
                            </button>
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={() => setCurrentView("folders")}
                            >
                                <Icons name="folder" size={22} className="text-primary" />
                                Dossiers
                            </button>
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={() => setCurrentView("info")}
                            >
                                <Icons name="info" size={22} className="text-primary" />
                                Infos de la note
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div 
            ref={modalRef}
            className="bg-white rounded-xl min-w-2xs md:w-sm w-xs shadow-lg overflow-hidden relative h-auto flex flex-col"
        >
            
            <div className="p-4 pb-2 border-b border-element flex items-center">
                {currentView !== "menu" && (
                    <button
                        className="mr-2 p-1 rounded hover:bg-deskbackground transition-colors"
                        onClick={() => setCurrentView("menu")}
                        aria-label="Retour"
                    >
                        <Icons name="arrow-ss-barre" size={22} className="text-primary" />
                    </button>
                )}
                <h3 className="text-lg font-semibold text-foreground">{getModalTitle()}</h3>
            </div>
            
            {renderContent()}
        </div>
    );
}