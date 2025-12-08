"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmRemoveUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
}

const ConfirmRemoveUserModal: React.FC<ConfirmRemoveUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    userName,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Retirer l&apos;utilisateur
                                </h3>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-4">
                                <p className="text-gray-700">
                                    Êtes-vous sûr de vouloir retirer{" "}
                                    <span className="font-semibold text-primary">{userName}</span>{" "}
                                    de cette note ?
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Cette action supprimera tous ses accès à la note.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors"
                                >
                                    Retirer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmRemoveUserModal;
