import React from "react";
import { motion } from "motion/react";
import { TrashIcon } from '@/libs/Icons';

interface FolderDeleteConfirmProps {
    folderName: string;
    noteCount: number;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

export default function FolderDeleteConfirm({ 
    folderName, 
    noteCount,
    onConfirm, 
    onCancel,
    isDeleting = false 
}: FolderDeleteConfirmProps) {
    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
        >
            <motion.div
                className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-md mx-4"
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    duration: 0.3
                }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrashIcon width={32} height={32} className="text-red-600"  />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Supprimer le dossier</h2>
                    <p className="text-gray-600 mb-3">
                        Êtes-vous sûr de vouloir supprimer définitivement le dossier <span className="font-semibold">&quot;{folderName}&quot;</span> ?
                    </p>
                    {noteCount > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                            <p className="text-sm text-blue-800">
                                <strong>Important :</strong> Ce dossier contient {noteCount} note{noteCount > 1 ? 's' : ''}.<br />
                                Les notes ne seront PAS supprimées, elles seront simplement retirées de ce dossier.
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-red-600 font-medium">
                        Cette action est définitive et irréversible !
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Annuler la suppression"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-6 py-3 flex flex-row items-center justify-center gap-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Confirmer la suppression"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Suppression...
                            </>
                        ) : (
                                <>
                                <TrashIcon width={20} height={20} className="text-white" />
                                Supprimer définitivement
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
