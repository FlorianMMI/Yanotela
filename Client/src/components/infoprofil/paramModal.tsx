"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon';
import AccountSupprConfirm from '@/ui/account-suppr-confirm';
import { DeleteAccount } from '@/loader/loader';
import AccountSupprSuccess from '@/ui/account-suppr-success';

interface ParamModalProps {
    onClose: () => void;
}

export default function ParamModal({ onClose }: ParamModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleDeleteAccount = () => {
        setShowDeleteConfirm(true);
    };

    const router = useRouter();

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        
        try {
            const response = await DeleteAccount('Suppression demandée par l\'utilisateur');
            
            if (response.success) {
                console.log('Compte marqué pour suppression:', response.message);

                // Fermer les modals de confirmation
                setShowDeleteConfirm(false);
                onClose();
                
                // Afficher le modal de succès (il gère sa propre redirection)
                setShowSuccessModal(true);
                
            } else {
                console.error('Erreur lors de la suppression:', response.error);
                alert('Erreur lors de la suppression du compte: ' + response.error);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du compte:', error);
            alert('Une erreur est survenue lors de la suppression du compte.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };
    
    return (
        <>
            {/* Overlay fond noir */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/70 bg-opacity-50 z-99"
                onClick={onClose}
            />
            
            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, x: '-100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '-100%' }}
                transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    duration: 0.5
                }}
                className="fixed top-0 left-0 w-full md:w-[35%] h-full bg-background shadow-lg z-100"
            >
                <div className='flex flex-col h-full w-full p-2 relative'>

                    {/* Close button */}
                    <div
                        className="p-6"
                        onClick={onClose}
                    >
                        <Icon
                            name="close"
                            size={35}
                            className="absolute top-4 right-4 cursor-pointer text-clrprincipal hover:text-color-primary-hover transition-all duration-300"
                        />
                    </div>

                    {/* Contenu du modal */}
                    <div className='flex flex-col justify-end h-full w-fill p-2 relative mt-10'>

                        {/* Boutton suppression compte */}
                        <button
                            className="mt-4 px-4 py-2 bg-primary text-white font-bold rounded hover:bg-primary-hover hover:shadow-lg transition-all duration-300 cursor-pointer"
                            onClick={handleDeleteAccount}
                            title='Supprimer mon compte de façon définitive'
                        >
                            Supprimer mon compte
                        </button>

                    {/* Autres paramètres peuvent être ajoutés ici */}
                    </div>

                </div>
            </motion.div>

            {/* Modal de confirmation de suppression */}
            {showDeleteConfirm && (
                <AccountSupprConfirm
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    isLoading={isDeleting}
                />
            )}

            {/* Modal de succès */}
            {showSuccessModal && (
                <AccountSupprSuccess />
            )}
        </>
    );
}