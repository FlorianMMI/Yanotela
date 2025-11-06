import React, { useState, useRef, useEffect } from "react";
import Icons from "@/ui/Icon";
import { FOLDER_COLORS } from "@/hooks/folderColors";
import FolderDeleteConfirm from "@/ui/folder-delete-confirm";
import { DeleteFolder } from "@/loader/loader";

interface FolderMoreProps {
    folder: { ModifiedAt: string; };
    folderId: string;
    folderName: string;
    folderDescription: string;
    folderColor: string;
    noteCount?: number; // Ajout du nombre de notes
    onUpdate: (name: string, description: string, color: string) => Promise<void>;
    onDelete: () => void;
    onClose: () => void;
}

type ModalView = "menu" | "edit" | "info" | "delete";

export default function FolderMore({
    folder,
    folderId,
    folderName,
    folderDescription,
    folderColor,
    noteCount = 0,
    onUpdate,
    onDelete,
    onClose
}: FolderMoreProps) {
    const [currentView, setCurrentView] = useState<ModalView>("menu");
    const [name, setName] = useState(folderName);
    const [description, setDescription] = useState(folderDescription);
    const [color, setColor] = useState(folderColor);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleSave = async () => {
        if (!name.trim()) {
            alert("Le nom du dossier ne peut pas être vide");
            return;
        }

        setIsSaving(true);
        try {
            await onUpdate(name.trim(), description.trim(), color);
            onClose();
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFolder = async () => {
        setIsDeleting(true);
        try {
            const result = await DeleteFolder(folderId);
            if (result.success) {
                onDelete(); // Appeler le callback parent
                onClose();
            } else {
                console.error("Erreur lors de la suppression:", result.error);
                alert(result.error || "Erreur lors de la suppression du dossier");
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
            case "edit":
                return "Modifier le dossier";
            case "info":
                return "Informations du dossier";
            default:
                return "Options du dossier";
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case "edit":
                return (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4">
                            {/* Nom du dossier */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom du dossier
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="Nom du dossier"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                    placeholder="Description du dossier (optionnel)"
                                />
                            </div>

                            {/* Couleur */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Couleur
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {FOLDER_COLORS.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setColor(c.value)}
                                            className={`w-10 h-10 rounded-full transition-all ${color === c.value
                                                ? "ring-4 ring-primary ring-offset-2 scale-110"
                                                : "hover:scale-105"
                                                }`}
                                            style={{ backgroundColor: c.value }}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setCurrentView("menu")}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    disabled={isSaving}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50"
                                >
                                    {isSaving ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "info":
                return (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Nom :</span>
                                <p className="text-gray-600 mt-1">{folderName}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Description :</span>
                                <p className="text-gray-600 mt-1">{folderDescription || "Aucune description"}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Couleur :</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div
                                        className="w-6 h-6 rounded-full border border-gray-300"
                                        style={{ backgroundColor: folderColor }}
                                    />
                                    {
                                        folderColor ===  'var(--primary)' ? <span className="text-gray-600">Couleur par défaut</span> :
                                            <span className="text-gray-600">{folderColor}</span>
                                    }
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <span className="font-medium text-gray-700">Modifié le :</span>
                                <p className="text-gray-600 mt-1">
                                    {new Date(folder.ModifiedAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex-1 overflow-y-auto p-4 z-30">
                        <div className="flex flex-col gap-1 py-2">
                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium transition-colors rounded-lg"
                                onClick={() => setCurrentView("edit")}
                            >
                                <Icons name="modif" size={22} className="text-primary" />
                                Modifier le dossier
                            </button>

                            <button
                                className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-deskbackground cursor-pointer hover:text-primary-hover w-full text-left text-base font-medium transition-colors rounded-lg"
                                onClick={() => setCurrentView("info")}
                            >
                                <Icons name="info" size={22} className="text-primary" />
                                Informations
                            </button>

                            <button
                                className="flex items-center gap-3 px-5 py-3 text-dangerous-800 hover:bg-dangerous-50 cursor-pointer w-full text-left text-base font-medium border-t border-gray-100 transition-colors rounded-lg mt-2"
                                onClick={() => setCurrentView("delete")}
                            >
                                <Icons name="trash" size={22} className="text-dangerous-800" />
                                Supprimer le dossier
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            {currentView === "delete" ? (
                <FolderDeleteConfirm
                    folderName={folderName}
                    noteCount={noteCount}
                    onConfirm={handleDeleteFolder}
                    onCancel={() => setCurrentView("menu")}
                    isDeleting={isDeleting}
                />
            ) : (
                <div
                    ref={modalRef}
                    className="bg-white rounded-xl min-w-2xs md:w-sm w-xs shadow-lg overflow-hidden relative h-auto flex flex-col"
                >
                    {/* Header avec titre et bouton retour */}
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

                    {/* Contenu */}
                    {renderContent()}
                </div>
            )}
        </>
    );
}
