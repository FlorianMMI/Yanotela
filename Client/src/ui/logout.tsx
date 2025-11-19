import React, { useState } from 'react';
import Image from 'next/image';
import { ExitIcon } from '@/libs/Icons';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { Logout as LogoutAPI } from '@/loader/loader';
import LogoutConfirm from './logout-confirm';

export default function Logout(){

    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowConfirm(true);
    };

    const handleConfirmLogout = async () => {
        try {
            router.push('/');
            const response = await LogoutAPI();
            
            if (response.success) {
                setShowConfirm(false);
                router.push('/');
                router.refresh();
                window.location.reload();
            } else {
                console.error('Erreur de déconnexion:', response.error);
                setShowConfirm(false);
            }
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            setShowConfirm(false);
        }
    };

    const handleCancelLogout = () => {
        setShowConfirm(false);
    };

    return (
        <>
            <div className="w-full md:w-fit h-full" title='Me déconnecter'>                
                <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center justify-center cursor-pointer group gap-2"
                >
                    <span className="font-normal text-md hidden md:block">Déconnexion</span>
                    <ExitIcon width={24} height={24} className="text-primary" />
                </button>
            </div>

            <AnimatePresence>
                {showConfirm && (
                    <LogoutConfirm 
                        onConfirm={handleConfirmLogout}
                        onCancel={handleCancelLogout}
                    />
                )}
            </AnimatePresence>
        </>
    );
}