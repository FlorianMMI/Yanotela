import React, { useState } from 'react';
import Image from 'next/image';
import Icon from './Icon';
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
                    className="w-full flex items-center justify-center space-x-3 p-4 bg-primary text-white border border-dangerous-700 rounded-xl shadow-md hover:bg-dangerous-700 hover:border-dangerous-800 hover:text-white hover:shadow-lg transition-all cursor-pointer group"
                >
                    <Icon name="exit" size={25} className="text-primary" />
                    <span className="font-normal text-md hidden md:block">Déconnexion</span>
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
