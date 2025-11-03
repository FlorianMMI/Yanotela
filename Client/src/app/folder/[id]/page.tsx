"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Folder } from "@/type/Folder";
import { Note } from "@/type/Note";
import NoteList from "@/components/noteList/NoteList";
import { GetFolderById, UpdateFolder, DeleteFolder, CreateNote } from "@/loader/loader";
import FolderDeleteModal from "@/ui/folder/FolderDeleteModal";

interface FolderDetailProps {
    params: Promise<{
        id: string;
    }>;
}

export default function FolderDetail({ params }: FolderDetailProps) {
    const { isAuthenticated, loading: authLoading } = useAuthRedirect();
    const router = useRouter();
    const { id } = use(params);

    const [folder, setFolder] = useState<Folder | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [totalNotes, setTotalNotes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
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
    }, [id]);

    const fetchFolderData = async () => {
        try {
            setLoading(true);

            // Récupérer les informations du dossier
            const response = await GetFolderById(id);

            if (response && response.folder) {
                setFolder(response.folder);
                setNotes(response.notes || []);
            } else {
                console.error("Dossier introuvable");
                setFolder(null);
            }
        } catch (error) {
            console.error("Error loading folder:", error);
        } finally {
            setLoading(false);
        }
    };

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
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteFolder = async () => {
        const response = await DeleteFolder(id);

        if (response.success) {
            router.push("/folder");
        } else {
            alert(response.error || "Erreur lors de la suppression du dossier");
        }
    };

    const handleCreateNote = async () => {
        try {
            const result = await CreateNote();
            if (result.note && result.redirectUrl) {
                // Rediriger vers la note créée avec un paramètre pour l'associer au dossier
                router.push(`${result.redirectUrl}?folderId=${id}`);
            }
        } catch (error) {
            console.error('Erreur lors de la création de la note:', error);
        }
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
                    onClick={() => router.push("/folder")}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                >
                    Retour aux dossiers
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col relative">
            {/* Modale de confirmation de suppression */}
            {isDeleteModalOpen && (
                <FolderDeleteModal
                    folderName={folder?.Nom || "ce dossier"}
                    onConfirm={confirmDeleteFolder}
                    onCancel={() => setIsDeleteModalOpen(false)}
                />
            )}

            {/* Liste des notes dans le dossier - Plein écran */}
            <div className="flex-1 overflow-y-auto">
                <NoteList
                    notes={notes}
                    onNoteCreated={fetchFolderData}
                    isLoading={loading}
                    allowCreateNote={true}
                    folderId={id}
                />
            </div>
        </div>
    );
}
