"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { CloseIcon, TrashIcon} from '@/libs/Icons';
import AccountSupprConfirm from '@/ui/account-suppr-confirm';
import { DeleteAccount } from '@/loader/loader';
import AccountSupprSuccess from '@/ui/account-suppr-success';
import ThemeSelector from '../theme/ThemeSelector';
import PWAInstallButton from '@/ui/PWAInstallbutton';

interface ParamModalProps {
    onClose: () => void;
}

export default function ParamModal({ onClose }: ParamModalProps) {

    const router = useRouter();

    

   

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
                initial={{ opacity: 0, x: '200%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '200%' }}
                transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    duration: 0.5
                }}
                className="fixed top-0 right-0 w-full md:w-[35%] h-full bg-primary shadow-lg z-100"
            >
                <div className='flex flex-col h-full w-full p-2 relative'>

                    {/* Close button */}
                    <div
                        className="p-6"
                        onClick={onClose}
                    >
                        <CloseIcon width={35} height={35} className="absolute top-4 right-4 cursor-pointer text-clrprincipal hover:text-color-primary-hover transition-all duration-300" />
                    </div>
                    {/* Contenu du modal */}
                    <div className='flex flex-col justify-end h-full w-fill p-2 relative mt-10'>
                    



                    </div>

                </div>
            </motion.div>

           
        </>
    );
}