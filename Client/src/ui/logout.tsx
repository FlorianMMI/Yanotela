import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Logout as LogoutAPI } from '@/loader/loader';
import LogoutConfirm from './logout-confirm';
import Icon from './Icon';


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
            <div className="w-full" title='Me déconnecter'>                
                <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center justify-center space-x-3 p-4 bg-primary text-gray-700 border border-gray-200 rounded-xl shadow-md hover:bg-red-50 hover:border-red-300 hover:text-red-700 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                    <Icon
                        name="exit"
                        size={22}
                        className="group-hover:filter group-hover:brightness-0 group-hover:sepia group-hover:hue-rotate-[340deg] group-hover:saturate-[2] transition-all duration-300 text-white"
                    />
                    <span className="font-normal text-lg text-white">Déconnexion</span>
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


