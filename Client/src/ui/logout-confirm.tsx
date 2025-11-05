import React from "react";
import { motion } from "motion/react";
import Icon from "./Icon";

interface LogoutConfirmProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function LogoutConfirm({ onConfirm, onCancel }: LogoutConfirmProps) {
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
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="exit" size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmer la déconnexion</h2>
                    <p className="text-gray-600">Êtes-vous sûr de vouloir vous déconnecter de votre compte ?</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300 cursor-pointer shadow-md hover:shadow-lg "
                        title="Annuler la déconnexion"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-3 flex flex-row justify-center items-center gap-1 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer shadow-md hover:shadow-lg "
                        title="Se déconnecter"
                    >
                        <Icon name="exit" size={25} className="text-white" />
                        Déconnexion
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
