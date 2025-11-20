import React, { useState, useRef, useEffect } from "react";
import Icons from "@/ui/Icon";
import { NoteShareUI, NoteInfoUI, NoteFolderUI, NoteDeleteConfirm } from "@/ui/note-modal";
import TagNote from "@/ui/note-modal/note-tag";
import { DeleteNote, LeaveNote, GetNoteById, DuplicateNote } from "@/loader/loader";
import { useRouter } from "next/navigation";
import Folder from "@/ui/folder/Folder";
import { ArrowBarIcon, DupplicateIcon, ExitIcon, FolderIcon, InfoIcon, PaletteIcon, PartageIcon, TrashIcon } from "@/libs/Icons";

interface NoteMoreProps {
    noteId: string;
    onClose: () => void;
    onNoteUpdated?: () => void; // Callback pour rafraîchir la liste
}

type ModalView = "menu" | "share" | "info" | "folder" | "tag" | "delete" | "leave";

export default function NoteMore({ noteId, onClose, onNoteUpdated }: NoteMoreProps) {
    const [currentView, setCurrentView] = useState<ModalView>("menu");
    const [isDeleting, setIsDeleting] = useState(false);
    const [noteTitle, setNoteTitle] = useState<string>("");
    const [noteTag, setNoteTag] = useState<string>("");
    const [userRole, setUserRole] = useState<number | undefined>(undefined);
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Charger les informations de la note
    useEffect(() => {
        const loadNoteInfo = async () => {
            const noteData = await GetNoteById(noteId);
            if (noteData && typeof noteData === 'object' && 'Titre' in noteData) {
                setNoteTitle(noteData.Titre);
                setUserRole(noteData.userRole);
                setNoteTag(noteData.tag || '');
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
                // Appeler le callback pour rafraîchir la liste
                if (onNoteUpdated) {
                    onNoteUpdated();
                }
                // Fermer le modal
                onClose();
                // Déclencher un événement pour rafraîchir l'authentification/liste
                window.dispatchEvent(new Event('auth-refresh'));
                // Rediriger vers la liste des notes uniquement si on est sur la page de la note
                if (window.location.pathname.includes(`/notes/${noteId}`)) {
                    router.push('/notes');
                }
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

    const handleLeaveNote = async () => {
        setIsDeleting(true);
        try {
            const result = await LeaveNote(noteId);
            if (result.success) {
                // Appeler le callback pour rafraîchir la liste
                if (onNoteUpdated) {
                    onNoteUpdated();
                }
                // Fermer le modal
                onClose();
                // Déclencher un événement pour rafraîchir l'authentification/liste
                window.dispatchEvent(new Event('auth-refresh'));
                // Rediriger vers la liste des notes uniquement si on est sur la page de la note
                if (window.location.pathname.includes(`/notes/${noteId}`)) {
                    router.push('/notes');
                }
            } else {
                console.error("Erreur lors de la sortie:", result.error);
                alert(result.error || "Erreur lors de la sortie de la note");
            }
        } catch (error) {
            console.error("Erreur lors de la sortie:", error);
            alert("Une erreur est survenue lors de la sortie de la note");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicateNote = async () => {
        try {
            const result = await DuplicateNote(noteId);
            if (result.success) {
                // Appeler le callback pour rafraîchir la liste
                if (onNoteUpdated) {
                    onNoteUpdated();
                }
                // Fermer le modal
                onClose();
                // Déclencher un événement pour rafraîchir l'authentification/liste
                window.dispatchEvent(new Event('auth-refresh'));
                // Rediriger vers la nouvelle note si une URL est fournie
                if (result.redirectUrl) {
                    router.push(result.redirectUrl);
                }
            } else {
                console.error("Erreur lors de la duplication:", result.error);
                alert(result.error || "Erreur lors de la duplication de la note");
            }
        } catch (error) {
            console.error("Erreur lors de la duplication:", error);
            alert("Une erreur est survenue lors de la duplication de la note");
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
            case "tag":
                return "Tag couleur";
            default:
                return "Option de la note";
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case "share":
                return <NoteShareUI noteId={noteId} onShareSuccess={onNoteUpdated} />;
            case "info":
                return <NoteInfoUI noteId={noteId} />;
            case "folder":
                return <NoteFolderUI noteId={noteId} onFolderChange={onNoteUpdated} />;
            case "tag":
                return <TagNote noteId={noteId} currentTag={noteTag} onTagUpdated={onNoteUpdated} />;
            case "delete":
            case "leave":
                return null; // Le modal sera rendu en dehors du contenu
            default:
                return (
                    <div className="flex-1 overflow-y-auto p-3 md:p-4 max-h-[30vh]">
                        <div className="flex flex-col gap-1 py-2">
                            <button
                                className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-sm md:text-base font-medium transition-colors"
                                onClick={() => setCurrentView("folder")}
                            >
                                <FolderIcon width={18} height={18} className="text-primary md:w-[22px] md:h-[22px]" />
                                Dossiers
                            </button>
                            <button
                                className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-sm md:text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={() => setCurrentView("tag")}
                            >
                                <PaletteIcon width={18} height={18} className="text-primary md:w-[22px] md:h-[22px]" />
                                Tag couleur
                            </button>
                            <button
                                className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-sm md:text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={() => setCurrentView("share")}
                            >
                                <PartageIcon width={18} height={18} className="text-primary md:w-[22px] md:h-[22px]" />
                                Partager la note
                            </button>
                            <button
                                className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-sm md:text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={() => setCurrentView("info")}
                            >
                                <InfoIcon width={18} height={18} className="text-primary md:w-[22px] md:h-[22px]" />
                                Infos de la note
                            </button>
                            <button
                                className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-sm md:text-base font-medium border-t border-gray-100 transition-colors"
                                onClick={handleDuplicateNote}
                            >
                                <DupplicateIcon width={18} height={18} className="text-primary md:w-[22px] md:h-[22px]" />
                                Dupliquer la note
                            </button>

                            {/* Afficher "Quitter la note" pour les éditeurs (2) et lecteurs (3), "Supprimer" pour Owner (0) et Admin (1) */}
                            {userRole === 2 || userRole === 3 ? (
                                <button
                                    className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-dangerous-800 hover:bg-red-50 cursor-pointer w-full text-left text-sm md:text-base font-medium border-t border-gray-100 transition-colors rounded-lg mt-2"
                                    onClick={() => setCurrentView("leave")}
                                >
                                    <ExitIcon width={18} height={18} className="text-dangerous-800 rotate-180 md:w-[22px] md:h-[22px]" />
                                    Quitter la note
                                </button>
                            ) : (
                                <button
                                    className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-dangerous-800 hover:bg-red-50 cursor-pointer w-full text-left text-sm md:text-base font-medium border-t border-gray-100 transition-colors rounded-lg mt-2"
                                    onClick={() => setCurrentView("delete")}
                                >
                                    <TrashIcon width={18} height={18} className="text-dangerous-800 md:w-[22px] md:h-[22px]" />
                                    Supprimer la note
                                </button>
                            )}

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
            ) : currentView === "leave" ? (
                <NoteDeleteConfirm
                    noteTitle={noteTitle}
                    onConfirm={handleLeaveNote}
                    onCancel={() => setCurrentView("menu")}
                    isDeleting={isDeleting}
                    isLeaving={true}
                />
            ) : (
                <div 
                    ref={modalRef}
                    className="bg-white rounded-xl w-[240px] md:w-sm shadow-lg overflow-hidden relative h-auto flex flex-col"
                >
                    
                    <div className="p-3 md:p-4 pb-2 border-b border-element flex items-center">
                        {currentView !== "menu" && (
                            <button
                                className="mr-2 p-1 rounded hover:bg-deskbackground transition-colors"
                                onClick={() => setCurrentView("menu")}
                                aria-label="Retour"
                            >
                                <ArrowBarIcon width={18} height={18} className="text-primary md:w-[22px] md:h-[22px]" />
                            </button>
                        )}
                        <h3 className="text-base md:text-lg font-semibold text-foreground">{getModalTitle()}</h3>
                    </div>
                    
                    {renderContent()}
                </div>
            )}
        </>
    );
}
