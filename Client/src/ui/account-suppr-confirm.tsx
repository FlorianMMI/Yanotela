import React from 'react';
import { motion } from 'motion/react';
import Icon from '@/ui/Icon';

interface AccountSupprConfirmProps {
    onClose: () => void;
    onConfirm: () => void;
}

export default function AccountSupprConfirm({ onClose, onConfirm }: AccountSupprConfirmProps) {
    return (
        <>
            {/* Overlay fond noir */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/70 z-[101]"
                onClick={onClose}
            />
            
            {/* Modal de confirmation */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 20
                }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-2xl z-[102] p-6 max-w-md w-full mx-4"
            >
                {/* Close button */}
                <div
                    className="absolute top-4 right-4"
                    onClick={onClose}
                >
                    <Icon
                        name="close"
                        size={24}
                        className="cursor-pointer text-clrprincipal hover:text-color-primary-hover transition-all duration-300"
                    />
                </div>

                {/* Contenu de la modal */}
                <div className="text-center">
                    {/* Icône d'alerte */}
                    <div className="mb-4">
                        <Icon
                            name="alert"
                            size={64}
                            className="mx-auto text-primary"
                        />
                    </div>

                    {/* Titre */}
                    <h2 className="text-2xl text-primary mb-4">
                        Supprimer votre compte
                    </h2>

                    {/* Message d'alerte */}
                    <p className="text-foreground mb-6 leading-relaxed">
                        Êtes-vous sûr de vouloir supprimer définitivement votre compte ? 
                        Cette action est <strong>irréversible</strong> et entraînera la suppression 
                        de toutes vos données, y compris vos notes.
                    </p>

                    {/* Boutons d'action */}
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-element text-white rounded hover:bg-opacity-80 transition-all duration-300 cursor-pointer hover:shadow-md hover:bg-foreground"
                            title='Annuler la suppression de mon compte'
                        >
                            Annuler
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-all duration-300 cursor-pointer hover:shadow-md hover:bg-foreground"
                            title='Supprimer définitivement mon compte'
                        >
                            Supprimer définitivement
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}