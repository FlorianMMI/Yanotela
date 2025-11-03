"use client";
import React, { useState, useEffect } from "react";
import { GetFolders, AssignNoteToFolder, RemoveNoteFromFolder, GetNoteFolder } from "@/loader/loader";
import { Folder } from "@/type/Folder";
import Icon from "@/ui/Icon";

interface NoteFolderUIProps {
    noteId: string;
    onFolderChange?: () => void; // Callback pour rafraîchir les données
}

export default function NoteFolderUI({ noteId, onFolderChange }: NoteFolderUIProps) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [noteId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Récupérer tous les dossiers de l'utilisateur
            const foldersResponse = await GetFolders();
            if (foldersResponse.folders) {
                setFolders(foldersResponse.folders);
            }

            // Récupérer le dossier actuel de la note
            const currentFolderResponse = await GetNoteFolder(noteId);
            if (currentFolderResponse.success && currentFolderResponse.folder) {
                setCurrentFolder(currentFolderResponse.folder);
            } else {
                setCurrentFolder(null);
            }
        } catch (err) {
            console.error("Error fetching folder data:", err);
            setError("Erreur lors du chargement des dossiers");
        } finally {
            setLoading(false);
        }
    };

    const handleFolderSelect = async (folderId: string) => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await AssignNoteToFolder(noteId, folderId);
            
            if (response.success) {
                setSuccess(response.message || "Note ajoutée au dossier");
                // Mettre à jour le dossier actuel
                const selectedFolder = folders.find(f => f.id === folderId);
                if (selectedFolder) {
                    setCurrentFolder(selectedFolder);
                }
                // Appeler le callback si fourni
                if (onFolderChange) {
                    onFolderChange();
                }
            } else {
                setError(response.error || "Erreur lors de l'assignation");
            }
        } catch (err) {
            console.error("Error assigning note to folder:", err);
            setError("Erreur de connexion au serveur");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveFromFolder = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await RemoveNoteFromFolder(noteId);
            
            if (response.success) {
                setSuccess("Note retirée du dossier");
                setCurrentFolder(null);
                // Appeler le callback si fourni
                if (onFolderChange) {
                    onFolderChange();
                }
            } else {
                setError(response.error || "Erreur lors du retrait");
            }
        } catch (err) {
            console.error("Error removing note from folder:", err);
            setError("Erreur de connexion au serveur");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4">
            {/* Messages de succès/erreur */}
            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Dossier actuel */}
            {currentFolder && (
                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Dossier actuel :</p>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-primary">
                        <div className="flex items-center gap-3">
                            <div 
                                className="flex-shrink-0"
                                style={{ color: currentFolder.CouleurTag || '#D4AF37' }}
                            >
                                <Icon 
                                    name="folder" 
                                    size={24}
                                />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{currentFolder.Nom}</p>
                                {currentFolder.Description && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {currentFolder.Description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveFromFolder}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Retirer du dossier"
                        >
                            <Icon name="trash" size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Liste des dossiers */}
            <div>
                <p className="text-sm text-gray-600 mb-3">
                    {currentFolder ? "Changer de dossier :" : "Ajouter à un dossier :"}
                </p>

                {folders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Icon name="folder" size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun dossier disponible</p>
                        <p className="text-xs mt-1">Créez un dossier depuis la page Dossiers</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {folders.map((folder) => {
                            const isCurrentFolder = currentFolder?.id === folder.id;
                            
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => !isCurrentFolder && handleFolderSelect(folder.id)}
                                    disabled={saving || isCurrentFolder}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                        isCurrentFolder
                                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                                            : 'bg-white border-gray-200 hover:border-primary hover:bg-gray-50 active:scale-98'
                                    }`}
                                >
                                    <div 
                                        className="flex-shrink-0"
                                        style={{ color: folder.CouleurTag || '#D4AF37' }}
                                    >
                                        <Icon 
                                            name="folder" 
                                            size={24}
                                        />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-800">{folder.Nom}</p>
                                        {folder.Description && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {folder.Description}
                                            </p>
                                        )}
                                    </div>
                                    {isCurrentFolder && (
                                        <Icon name="check" size={20} className="text-primary" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Note informative */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                    <strong>Note :</strong> Une note ne peut être que dans un seul dossier à la fois.
                </p>
            </div>
        </div>
    );
}
