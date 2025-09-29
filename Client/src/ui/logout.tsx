import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logout as LogoutAPI } from '@/loader/loader';

export default function Logout(){
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const response = await LogoutAPI();
            
            if (response.success) {
                router.push('/');
            } else {
                console.error('Erreur de déconnexion:', response.error);
            }
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
        }
    };

    return (
        <>
            <div className="p-2 rounded bg-primary border-gray-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-white hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Image
                        src="/keyhole.svg"
                        alt=""
                        width={20}
                        height={20}
                    />
                    <span className="font-medium">Déconnexion</span>
                </button>
            </div>
        </>
    );
}


