"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Folder } from "@/type/Folder";
import { Note } from "@/type/Note";
import Icon from "@/ui/Icon";
import NoteList from "@/components/noteList/NoteList";
import { motion } from "framer-motion";
import { GetFolderById, UpdateFolder, DeleteFolder } from "@/loader/loader";

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
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [folderDescription, setFolderDescription] = useState("");

    useEffect(() => {
        fetchFolderData();
    }, [id]);

    const fetchFolderData = async () => {
        try {
            setLoading(true);

            const response = await GetFolderById(id);
            
            if (response && response.folder) {
                setFolder(response.folder);
                setFolderName(response.folder.Nom);
                setFolderDescription(response.folder.Description || "");
                // Les notes seront récupérées séparément plus tard via une relation
                setNotes([]);
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

    const handleSaveFolder = async () => {
        const response = await UpdateFolder(id, {
            Nom: folderName,
            Description: folderDescription,
        });

        if (response.success && response.folder) {
            setFolder(response.folder);
            setIsEditing(false);
        } else {
            console.error("Erreur lors de la sauvegarde:", response.error);
            alert(response.error || "Erreur lors de la mise à jour du dossier");
        }
    };

    const handleDeleteFolder = async () => {
        const confirmed = confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?");
        if (!confirmed) return;

        const response = await DeleteFolder(id);
        
        if (response.success) {
            router.push("/folder");
        } else {
            alert(response.error || "Erreur lors de la suppression du dossier");
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
        <div className="h-full w-full flex flex-col">
            {/* Header du dossier */}
            <div className="border-b border-gray-200 bg-background">
                <div className="p-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-element">
                        <button
                            onClick={() => router.push("/folder")}
                            className="hover:text-primary transition-colors"
                        >
                            Mes Dossiers
                        </button>
                        <Icon name="arrow-ss-barre" size={16} className="-rotate-90" />
                        <span className="text-primary font-medium">{folder.Nom}</span>
                    </div>

                    {/* Informations du dossier */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={folderName}
                                        onChange={(e) => setFolderName(e.target.value)}
                                        className="text-3xl font-bold text-primary bg-white border-2 border-primary rounded-lg px-3 py-2 w-full max-w-2xl"
                                        placeholder="Nom du dossier"
                                    />
                                    <textarea
                                        value={folderDescription}
                                        onChange={(e) => setFolderDescription(e.target.value)}
                                        className="text-base text-element bg-white border border-gray-300 rounded-lg px-3 py-2 w-full max-w-2xl resize-none"
                                        placeholder="Description du dossier"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSaveFolder}
                                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                                        >
                                            Enregistrer
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFolderName(folder.Nom);
                                                setFolderDescription(folder.Description || "");
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Annuler
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: folder.CouleurTag }}
                                        />
                                        <h1 className="text-3xl font-bold text-primary">{folder.Nom}</h1>
                                    </div>
                                    {folder.Description && (
                                        <p className="text-element mt-2">{folder.Description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-3 text-sm text-element">
                                        <span>{folder.noteCount || notes.length} note(s)</span>
                                        <span>•</span>
                                        <span>
                                            Modifié le {new Date(folder.ModifiedAt).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {!isEditing && (
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Modifier le dossier"
                                >
                                    <Icon name="docs" size={24} className="text-primary" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDeleteFolder}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer le dossier"
                                >
                                    <Icon name="close" size={24} className="text-red-500" />
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Liste des notes dans le dossier */}
            <div className="flex-1 overflow-y-auto">
                <NoteList
                    notes={notes}
                    onNoteCreated={fetchFolderData}
                    isLoading={loading}
                />
            </div>
        </div>
    );
}
