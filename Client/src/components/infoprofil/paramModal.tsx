"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon';
import AccountSupprConfirm from '@/ui/account-suppr-confirm';
import { DeleteAccount } from '@/loader/loader';
import AccountSupprSuccess from '@/ui/account-suppr-success';
import ThemeSelector from '../theme/themeSelector';

interface ParamModalProps {
    onClose: () => void;
}

export default function ParamModal({ onClose }: ParamModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isWebappInstalled, setIsWebappInstalled] = useState<boolean>(() => {
        try {
            return !!localStorage.getItem('webappInstalled');
        } catch (e) {
            return false;
        }
    });

    const handleDeleteAccount = () => {
        setShowDeleteConfirm(true);
    };

    const router = useRouter();

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        
        try {
            const response = await DeleteAccount('Suppression demandée par l\'utilisateur');
            
            if (response.success) {
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

    // PWA install prompt handling
    useEffect(() => {
        const beforeInstallHandler = (e: Event) => {
            // @ts-ignore - non standard event
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const appInstalledHandler = () => {
            try {
                localStorage.setItem('webappInstalled', '1');
            } catch (err) {
                // ignore
            }
            setIsWebappInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', beforeInstallHandler as EventListener);
        window.addEventListener('appinstalled', appInstalledHandler as EventListener);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallHandler as EventListener);
            window.removeEventListener('appinstalled', appInstalledHandler as EventListener);
        };
    }, []);

    const handleDownloadClick = async () => {
        // If already installed, show label (button text is handled in render)
        if (isWebappInstalled) return;

        // If we have the PWA install prompt available, use it
        if (deferredPrompt) {
            try {
                // @ts-ignore
                await deferredPrompt.prompt();
                // @ts-ignore
                const choiceResult = await deferredPrompt.userChoice;
                if (choiceResult && choiceResult.outcome === 'accepted') {
                    try { localStorage.setItem('webappInstalled', '1'); } catch (err) {}
                    setIsWebappInstalled(true);
                }
            } catch (err) {
                console.error('Erreur lors de l`installation PWA:', err);
            }
            setDeferredPrompt(null);
            return;
        }

        // Fallback: trigger a file download (ensure /webapp.zip exists on server or change the URL)
        const fallbackUrl = '/webapp.zip';
        const a = document.createElement('a');
        a.href = fallbackUrl;
        a.download = 'webapp.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
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
                    {/* Selectionner un theme  */}
                    <ThemeSelector />



                        {/* Bouton Télécharger / Installer la webapp */}
                        <button
                            className={
                                `mt-4 px-4 py-2 font-bold rounded transition-all duration-300 ${isWebappInstalled ? 'bg-gray-400 text-white cursor-default' : 'bg-primary text-white hover:bg-primary-hover hover:shadow-lg cursor-pointer'}`
                            }
                            onClick={handleDownloadClick}
                            title={isWebappInstalled ? 'Vous avez déjà la webapp' : 'Télécharger / installer la webapp'}
                            disabled={isWebappInstalled}
                        >
                            {isWebappInstalled ? 'Vous avez déjà la webapp' : (deferredPrompt ? 'Installer la webapp' : 'Télécharger la webapp')}
                        </button>

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