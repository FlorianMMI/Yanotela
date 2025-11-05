import React, { useState, useRef, useEffect } from "react";
import Icons from "@/ui/Icon";
import { NoteShareUI, NoteInfoUI, NoteFolderUI, NoteDeleteConfirm } from "@/ui/note-modal";
import { DeleteNote, GetNoteById } from "@/loader/loader";
import { useRouter } from "next/navigation";

interface NoteMoreProps {
    noteId: string;
    onClose: () => void;
}

type ModalView = "menu" | "share" | "info" | "folder" | "delete";

export default function NoteMore({ noteId, onClose }: NoteMoreProps) {
    const [currentView, setCurrentView] = useState<ModalView>("menu");
    const [isDeleting, setIsDeleting] = useState(false);
    const [noteTitle, setNoteTitle] = useState<string>("");
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Charger les informations de la note
    useEffect(() => {
        const loadNoteInfo = async () => {
            const noteData = await GetNoteById(noteId);
            if (noteData && typeof noteData === 'object' && 'Titre' in noteData) {
                setNoteTitle(noteData.Titre);
            }
        };
        loadNoteInfo();
    }, [noteId]);

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

    const loadFolders = async () => {
        // Cette fonction n'est plus nécessaire car NoteFolderUI gère ses propres données
    };

    const loadCurrentFolder = async () => {
        // Cette fonction n'est plus nécessaire car NoteFolderUI gère ses propres données
    };

    const assignNoteToFolder = async (folderId: string) => {
        // Cette fonction n'est plus nécessaire car NoteFolderUI gère ses propres données
    };

    const removeNoteFromFolder = async () => {
        // Cette fonction n'est plus nécessaire car NoteFolderUI gère ses propres données
    };

    const handleDeleteNote = async () => {
        setIsDeleting(true);
        try {
            const result = await DeleteNote(noteId);
            if (result.success) {
                // Fermer le modal
                onClose();
                // Déclencher un événement pour rafraîchir l'authentification/liste
                window.dispatchEvent(new Event('auth-refresh'));
                // Rediriger vers l'accueil
                router.push('/');
            } else {
                console.error("Erreur lors de la suppression:", result.error);
                alert(result.error || "Erreur lors de la suppression de la note");
            }
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            alert("Une erreur est survenue lors de la suppression");
        } finally {
            setIsDeleting(false);
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
            case "delete":
                return null; // Le modal sera rendu en dehors du contenu
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
                                onClick={() => setCurrentView("info")}
                            >
                                <Icons name="info" size={22} className="text-primary" />
                                Infos de la note
                            </button>

                            <button
                                className="flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 cursor-pointer w-full text-left text-base font-medium border-t border-gray-100 transition-colors rounded-lg mt-2"
                                onClick={() => setCurrentView("delete")}
                            >
                                <Icons name="trash" size={22} className="text-primary" />
                                Supprimer la note
                            </button>

                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            {currentView === "delete" ? (
                <NoteDeleteConfirm
                    noteTitle={noteTitle}
                    onConfirm={handleDeleteNote}
                    onCancel={() => setCurrentView("menu")}
                    isDeleting={isDeleting}
                />
            ) : (
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
            )}
        </>
    );
}
