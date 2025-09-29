'use client';

import InfoProfil from '@/components/infoprofil/page'
import Image from 'next/image'
import { InfoUser} from '@/loader/loader'
import { useEffect, useState } from 'react'
import Logout from '@/ui/logout';

interface UserInfo {
    id: number;
    pseudo: string;
    prenom?: string;
    nom?: string;
    email: string;
}

export default function Profil() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className='flex justify-start flex-col min-h-screen bg-fondpage pt-12'>
                {/* Bouton settings aligné à gauche */}
                <div className="px-8 mb-4">
                    <Image src="/settings.svg" alt="Logo" width={24} height={24} className='flex justify-start'/>
                </div>
                
                {/* Contenu centré */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    {userInfo && (
                        <InfoProfil 
                            name={displayName}
                            pseudo={userInfo.pseudo} 
                            email={userInfo.email} 
                        />
                    )}
                </div>

                {/* Bouton logout en bas */}
                <div className="pb-12 px-8">
                    <Logout />
                </div>
                
            </div>
        </>
    )
}