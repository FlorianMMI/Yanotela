"use client";
import React, { useState, useEffect, useRef } from "react";
import { GetFolders, AssignNoteToFolder, RemoveNoteFromFolder, GetNoteFolder } from "@/loader/loader";
import { Folder } from "@/type/Folder";
import { FolderIcon, TrashIcon, ChevronIcon, SearchIcon, XIcon, CheckIcon } from '@/libs/Icons';

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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        fetchData();
    }, [noteId]);

    // Calculer la position du dropdown et fermer quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        const updatePosition = () => {
            if (buttonRef.current && isDropdownOpen) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 8,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        };

        if (isDropdownOpen) {
            updatePosition();
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", updatePosition, true);
            window.addEventListener("resize", updatePosition);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isDropdownOpen]);

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
            
            setError("Erreur lors du chargement des dossiers");
        } finally {
            setLoading(false);
        }
    };

    const handleFolderSelect = async (folderId: string) => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        setIsDropdownOpen(false);

        try {
            const response = await AssignNoteToFolder(noteId, folderId);
            
            if (response.success) {
                setSuccess(response.message || "Note ajoutée au dossier");
                // Mettre à jour le dossier actuel
                const selectedFolder = folders.find((f: Folder) => f.id === folderId);
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
            
            setError("Erreur de connexion au serveur");
        } finally {
            setSaving(false);
        }
    };

    // Filtrer les dossiers en fonction de la recherche
    const filteredFolders = folders.filter((folder: Folder) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            folder.Nom.toLowerCase().includes(searchLower) ||
            (folder.Description && folder.Description.toLowerCase().includes(searchLower))
        );
    });

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
            
            setError("Erreur de connexion au serveur");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-3 md:p-4">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
            {/* Messages de succès/erreur */}
            {success && (
                <div className="mb-4 p-3 bg-success-100 text-success-700 rounded-lg text-sm">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-dangerous-100 text-dangerous-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Dossier actuel */}
            {currentFolder && (
                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Dossier actuel :</p>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border-2 border-primary">
                        <div className="flex items-center gap-2">
                                <div 
                                className="shrink-0"
                                style={{ color: currentFolder.CouleurTag }}
                            >
                                <FolderIcon width={24} height={24} />
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
                                className="text-dangerous-600 hover:text-dangerous-700 disabled:opacity-50"
                                title="Retirer du dossier"
                            >
                            <TrashIcon width={16} height={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Sélecteur de dossier avec menu déroulant */}
            <div>
                <p className="text-sm text-gray-600 mb-3">
                    {currentFolder ? "Changer de dossier :" : "Ajouter à un dossier :"}
                </p>

                {folders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FolderIcon width={48} height={48} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun dossier disponible</p>
                        <p className="text-xs mt-1">Créez un dossier depuis la page Dossiers</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Bouton pour ouvrir le menu déroulant */}
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={saving}
                            className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-gray-700">
                                {currentFolder ? "Sélectionner un autre dossier..." : "Sélectionner un dossier..."}
                            </span>
                            {!isDropdownOpen ? <ChevronIcon width={20} height={20} className="text-gray-500 rotate-180"  /> : <ChevronIcon width={20} height={20} className="text-gray-500" />}
                        </button>

                        {/* Menu déroulant avec position fixed */}
                        {isDropdownOpen && (
                            <div 
                                ref={dropdownRef}
                                className="fixed bg-white border-2 border-gray-200 rounded-lg shadow-2xl max-h-[30vh] overflow-hidden"
                                style={{
                                    top: dropdownPosition.top + 'px',
                                    left: dropdownPosition.left + 'px',
                                    width: dropdownPosition.width + 'px'
                                }}
                            >
                                {/* Barre de recherche */}
                                <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                                    <div className="relative">
                                                        <SearchIcon width={20} height={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                            placeholder="Rechercher un dossier..."
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
                                            autoFocus
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <XIcon width={20} height={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Liste des dossiers filtrés */}
                                <div className="max-h-[20vh] overflow-y-auto">
                                    {filteredFolders.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            Aucun dossier trouvé
                                        </div>
                                    ) : (
                                        filteredFolders.map((folder: Folder) => {
                                            const isCurrentFolder = currentFolder?.id === folder.id;
                                            
                                            return (
                                                <button
                                                    key={folder.id}
                                                    onClick={() => !isCurrentFolder && handleFolderSelect(folder.id)}
                                                    disabled={saving || isCurrentFolder}
                                                    className={`w-full flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                                                        isCurrentFolder
                                                            ? 'bg-gray-100 cursor-not-allowed opacity-60'
                                                            : 'hover:bg-gray-50 active:bg-gray-100'
                                                    }`}
                                                >
                                                    <div 
                                                        className="shrink-0"
                                                        style={{ color: folder.CouleurTag || 'var(--primary)' }}
                                                    >
                                                        <FolderIcon width={24} height={24} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-medium text-gray-800">{folder.Nom}</p>
                                                        {folder.Description && (
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                                {folder.Description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {isCurrentFolder && (
                                                        <CheckIcon width={24} height={24} className="text-primary" />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Note informative */}
            <div className="mt-6 p-3 bg-info-50 rounded-lg">
                <p className="text-xs text-info-800">
                    <strong>Note :</strong> Une note ne peut être que dans un seul dossier à la fois.
                </p>
            </div>
        </div>
    );
}
