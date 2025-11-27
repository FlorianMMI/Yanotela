"use client";
import React, { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "@/type/Folder";
import { Note } from "@/type/Note";
import NoteList from "@/components/noteList/NoteList";
import FolderMore from "@/components/folderMore/FolderMore";
import FolderDetailHeader from "@/components/folderDetailHeader/FolderDetailHeader";
import { GetFolderById, UpdateFolder } from "@/loader/loader";
import { SearchMode } from "@/ui/searchbar";

interface FolderDetailProps {
    params: Promise<{
        id: string;
    }>;
}

export default function FolderDetail({ params }: FolderDetailProps) {
    const router = useRouter();
    const { id } = use(params);

    const [folder, setFolder] = useState<Folder | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFolderMore, setShowFolderMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchMode, setSearchMode] = useState<SearchMode>("all");
    const [sortBy, setSortBy] = useState<"recent">("recent");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [collaborationFilter, setCollaborationFilter] = useState<"all" | "collaborative" | "solo">("all");
    const [tagColorFilter, setTagColorFilter] = useState("");
    const hasFetched = useRef(false);

    const fetchFolderData = useCallback(async () => {
        try {
            setLoading(true);

            // Récupérer les informations du dossier
            const response = await GetFolderById(id);

            if (response && response.folder) {

                setFolder(response.folder);
                setNotes(Array.isArray(response.notes) ? response.notes : []);
            } else {
                console.error("Dossier introuvable");
                setFolder(null);
                setNotes([]);
            }
        } catch (error) {
            console.error("Error loading folder:", error);
            setFolder(null);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchFolderData();

        // Écouter les événements de mise à jour depuis le breadcrumb
        const handleUpdateRequest = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { folderId: eventFolderId, name, description, color } = customEvent.detail;
            if (eventFolderId === id) {
                await handleUpdateFolder(name, description, color);
            }
        };

        // Écouter les événements de suppression depuis le breadcrumb
        const handleDeleteRequest = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { folderId: eventFolderId } = customEvent.detail;
            if (eventFolderId === id) {
                handleDeleteFolder();
            }
        };

        window.addEventListener('folderUpdateRequested', handleUpdateRequest);
        window.addEventListener('folderDeleteRequested', handleDeleteRequest);

        return () => {
            window.removeEventListener('folderUpdateRequested', handleUpdateRequest);
            window.removeEventListener('folderDeleteRequested', handleDeleteRequest);
        };
    }, [id, fetchFolderData]);

    const handleUpdateFolder = async (name: string, description: string, color: string) => {
        const response = await UpdateFolder(id, {
            Nom: name,
            Description: description,
            CouleurTag: color,
        });

        if (response.success && response.folder) {
            setFolder(response.folder);
            // Émettre un événement pour synchroniser avec le Breadcrumb
            window.dispatchEvent(new CustomEvent('folderTitleUpdated', {
                detail: { folderId: id, title: name }
            }));
        } else {
            console.error("Erreur lors de la sauvegarde:", response.error);
            throw new Error(response.error || "Erreur lors de la mise à jour du dossier");
        }
    };

    const handleDeleteFolder = () => {
        // Cette fonction est appelée APRÈS la suppression réussie par FolderMore
        // Rediriger vers la liste des dossiers
        router.push("/dossiers");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!folder) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-element text-lg mb-4">Dossier introuvable</p>
                <button
                    onClick={() => router.push("/dossiers")}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                >
                    Retour aux dossiers
                </button>
            </div>
        );
    }

    // Filtrer et trier les notes
    const filteredNotes = Array.isArray(notes) ? notes
        .filter(note => {
            // Filtre de recherche avec mode
            let matchesSearch = true;
            if (searchTerm) {
                switch (searchMode) {
                    case 'title':
                        matchesSearch = note.Titre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                        break;
                    case 'content':
                        matchesSearch = note.Content?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                        break;
                    case 'all':
                    default:
                        matchesSearch = note.Titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            note.Content?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                        break;
                }
            }

            // Filtre de collaboration
            const matchesCollaboration =
                collaborationFilter === "all" ? true :
                    collaborationFilter === "collaborative" ? (note.collaboratorCount && note.collaboratorCount >= 2) :
                        collaborationFilter === "solo" ? (!note.collaboratorCount || note.collaboratorCount <= 1) :
                            true;

            // Filtre couleur de tag
            const matchesTagColor = !tagColorFilter
                ? true
                : (note.CouleurTag === tagColorFilter || (!note.CouleurTag && tagColorFilter === "var(--primary)"));

            return matchesSearch && matchesCollaboration && matchesTagColor;
        })
        .sort((a, b) => {
            const da = new Date(a.ModifiedAt).getTime();
            const db = new Date(b.ModifiedAt).getTime();
            return sortDir === "desc" ? db - da : da - db;
        }) : [];

    return (
        <div className="h-full w-full flex flex-col p-2.5 relative">
            {/* Header mobile avec filtres */}
            <FolderDetailHeader
                folderName={folder?.Nom || ""}
                folderColor={folder?.CouleurTag || "#882626"}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortDir={sortDir}
                setSortDir={setSortDir}
                collaborationFilter={collaborationFilter}
                setCollaborationFilter={setCollaborationFilter}
                tagColorFilter={tagColorFilter}
                setTagColorFilter={setTagColorFilter}
                onMoreClick={() => setShowFolderMore((prev: boolean) => !prev)}
            />

            {/* Modal FolderMore */}
            {showFolderMore && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute right-4 top-20">
                        <FolderMore
                            folder={folder as any}
                            folderId={id}
                            folderName={folder?.Nom || ""}
                            folderDescription={folder?.Description || ""}
                            folderColor={folder?.CouleurTag || ""}
                            noteCount={filteredNotes.length}
                            onUpdate={handleUpdateFolder}
                            onDelete={handleDeleteFolder}
                            onClose={() => setShowFolderMore(false)}
                        />
                    </div>
                </div>
            )}

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto">
                <NoteList
                    notes={filteredNotes}
                    onNoteCreated={fetchFolderData}
                    isLoading={loading}
                    allowCreateNote={true}
                    folderId={id}
                />
            </div>
        </div>
    );
}
