import React, { useState, useRef, useEffect } from "react";
import { NoteShareUI, NoteInfoUI, NoteFolderUI, NoteDeleteConfirm } from "@/ui/note-modal";
import TagNote from "@/ui/note-modal/note-tag";
import TagManagementModal from "@/ui/note-modal/tag-management-modal";
import { DeleteNote, LeaveNote, GetNoteById, DuplicateNote } from "@/loader/loader";
import { useRouter } from "next/navigation";
import { ArrowBarIcon, DupplicateIcon, ExitIcon, FolderIcon, InfoIcon, PaletteIcon, PartageIcon, TrashIcon } from "@/libs/Icons";

interface NoteMoreProps {
    noteId: string;
    onClose: () => void;
    onNoteUpdated?: (updatedNote?: any) => void; // Callback pour rafraîchir la liste (peut recevoir la note mise à jour)
}

type ModalView = "menu" | "share" | "info" | "folder" | "tag" | "delete" | "leave";

export default function NoteMore({ noteId, onClose, onNoteUpdated }: NoteMoreProps) {
    const [currentView, setCurrentView] = useState<ModalView>("menu");
    const [isDeleting, setIsDeleting] = useState(false);
    const [noteTitle, setNoteTitle] = useState<string>("");
    const [noteTagId, setNoteTagId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<number | undefined>(undefined);
    const [showTagManagement, setShowTagManagement] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Charger les informations de la note
    useEffect(() => {
        const loadNoteInfo = async () => {
            const noteData = await GetNoteById(noteId);
            if (noteData && typeof noteData === 'object' && 'Titre' in noteData) {
                setNoteTitle(noteData.Titre);
                setUserRole(noteData.userRole);
                setNoteTagId(noteData.tagId || null);
            }
        };
        loadNoteInfo();
    }, [noteId]);

    // Gérer les clics en dehors du modal
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Ne pas fermer si on clique dans le TagManagementModal
            if (showTagManagement) {
                return;
            }
            
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, showTagManagement]);

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
                    return (
                        <NoteFolderUI
                            noteId={noteId}
                            onFolderChange={async () => {
                                // After folder change, fetch the updated note and pass it to parent
                                try {
                                    if (onNoteUpdated) {
                                        const updated = await GetNoteById(noteId);
                                        onNoteUpdated(updated);
                                    }
                                } catch (err) {
                                    // If fetching fails, still notify parent with no payload
                                    if (onNoteUpdated) onNoteUpdated();
                                }
                            }}
                        />
                    );
            case "tag":
                return <TagNote noteId={noteId} currentTagId={noteTagId} onTagUpdated={onNoteUpdated} />;
            case "delete":
            case "leave":
                return null; // Le modal sera rendu en dehors du contenu
            default:
                return (
                    <div className="w-52 md:w-64">
                        <div className="flex flex-col gap-1 p-2">
                            <NoteButton Icon={FolderIcon} Title="Dossiers" modal="folder" setCurrentView={setCurrentView} borderTop={false} />
                            <NoteButton 
                                Icon={PaletteIcon} 
                                Title="Tag couleur" 
                                modal="tag" 
                                setCurrentView={setCurrentView}
                                showEditIcon={true}
                                onEditClick={() => setShowTagManagement(true)}
                            />
                            <NoteButton Icon={PartageIcon} Title="Partager la note" modal="share" setCurrentView={setCurrentView} />
                            <NoteButton Icon={InfoIcon} Title="Infos de la note" modal="info" setCurrentView={setCurrentView} />
                            <NoteButton Icon={DuplicateIcon} Title="Dupliquer la note" onClick={handleDuplicateNote} />
                            {/*  "Supprimer" pour Owner uniquement (0) / Quitter pour les autres */}
                            {userRole !== 0 ? (
                            <NoteButton Icon={ExitIcon} delete Title="Quitter la note" modal="leave" setCurrentView={setCurrentView} />
                            ) : (
                            <NoteButton Icon={TrashIcon} delete Title="Supprimer la note" modal="delete" setCurrentView={setCurrentView} />
                            )}

                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            {/* Modal de gestion des tags */}
            <TagManagementModal 
                isOpen={showTagManagement}
                onClose={() => setShowTagManagement(false)}
                onTagsUpdated={onNoteUpdated}
            />

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
                    className="bg-white rounded-xl w-52 md:w-64 shadow-lg overflow-hidden relative h-auto flex flex-col"
                >

                    <div className="p-3 md:p-4 pb-2 border-b border-element flex items-center">
                        {currentView !== "menu" && (
                            <button
                                className="rounded hover:bg-deskbackground transition-colors"
                                onClick={() => setCurrentView("menu")}
                                aria-label="Retour"
                            >
                                <ArrowBarIcon width={18} height={18} className="text-primary rotate-180" />
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
