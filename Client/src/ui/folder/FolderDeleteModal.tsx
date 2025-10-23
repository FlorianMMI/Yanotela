import React from "react";
import Icons from "@/ui/Icon";

interface FolderDeleteModalProps {
    folderName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function FolderDeleteModal({ folderName, onConfirm, onCancel }: FolderDeleteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="flex flex-col bg-white rounded-xl p-6 shadow-lg max-w-md w-full mx-4 justify-center">

                <div className="flex items-center gap-3 mb-4 justify-center w-full">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <Icons name="trash" size={24} className="text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Supprimer le dossier</h2>
                </div>

                <p className="text-sm text-gray-600 mt-2 mb-6 w-full text-center break-words">
                    Êtes-vous sûr de vouloir supprimer le dossier <strong className="text-gray-800">{folderName}</strong> ?
                    <br />
                    <span className="text-red-600 font-medium">Cette action est irréversible.</span>
                </p>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}
