'use client';
import React, { useState, useEffect } from 'react';
import InfoProfil from '@/components/infoprofil/page'
import Image from 'next/image'
import { GetNotes, InfoUser } from '@/loader/loader'
import Logout from '@/ui/logout';
import TotalNotes from '@/ui/note/totalNotes';
import Icons from '@/ui/Icon';
import ParamModal from '@/components/infoprofil/paramModal';
import { AnimatePresence } from 'motion/react';

interface UserInfo {
    id: number;
    pseudo: string;
    prenom?: string;
    nom?: string;
    email: string;
    noteCount?: number;
}

export default function Profil() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalNotes, setTotalNotes] = useState<number | undefined>(undefined);
    const [isParamModalOpen, setIsParamModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await InfoUser();

                if (response.success && response.user) {
                    setUserInfo(response.user);
                } else {
                    setError(response.error || 'Erreur lors de la récupération des informations');
                }
            } catch (err) {
                setError('Erreur de connexion');
                console.error('Erreur:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    useEffect(() => {
        async function fetchTotalNotes() {
            try {
                const { totalNotes } = await GetNotes();
                setTotalNotes(totalNotes);
            } catch (error) {
                console.error('Error fetching total notes in Home page:', error);
                setTotalNotes(0);
            }
        }

        fetchTotalNotes();
    }, []);

    const openParamModal = () => {
        setIsParamModalOpen(true);
    };

    const closeParamModal = () => {
        setIsParamModalOpen(false);
    };

    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-screen bg-fondpage'>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Chargement des informations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex justify-center items-center min-h-screen bg-fondpage'>
                <div className="text-center text-red-600">
                    <p>Erreur: {error}</p>
                </div>
            </div>
        );
    }

    const displayName = userInfo?.prenom && userInfo?.nom
        ? `${userInfo.prenom} ${userInfo.nom}`
        : userInfo?.pseudo || 'Utilisateur';

    return (
        <>
            <div className='py-4 flex flex-col items-center justify-start h-full bg-fondpage'>

                {/* Boutons settings et déconnexion alignés en haut */}
                <div className="flex flex-row justify-between items-center w-full px-8">

                    <div
                        className="items-center" title='Paramètres du compte'
                        onClick={openParamModal}
                    >
                        <Icons
                            name="settings"
                            size={35}
                            className='cursor-pointer rounded-lg p-2 hover:bg-primary hover:text-white hover:shadow-md transition-all duration-300'
                        />
                    </div>

                    <div className=" items-center hidden md:flex" title='Me déconnecter'>
                        <Logout />
                    </div>

                </div>

                {/* Contenu centré et réparti */}
                <div className="flex-1 flex flex-col justify-start items-center text-center gap-20 w-full h-full">
                    {userInfo && (
                        <InfoProfil
                            name={displayName}
                            pseudo={userInfo.pseudo}
                            email={userInfo.email}
                        />
                    )}
                    <TotalNotes totalNotes={totalNotes} />

                    {/* Bouton déconnexion mobile en bas */}
                    <div
                        className="flex items-center md:hidden w-full px-8 "
                        title='Me déconnecter'
                    >
                        <Logout />
                    </div>
                </div>

            </div>

            {/* Modal */}
            <AnimatePresence>
                {isParamModalOpen && (
                    <ParamModal onClose={closeParamModal} />
                )}
            </AnimatePresence>
        </>
    );
}