"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { CloseIcon, TrashIcon} from '@/libs/Icons';
import Comment from '@/ui/comment/comment';
import { Send } from '@/libs/Icons';

interface ParamModalProps {
    onClose: () => void;
}

export default function ParamModal({ onClose }: ParamModalProps) {
    const commentsContainerRef = React.useRef<HTMLDivElement>(null);

    // Scroll en bas à l'ouverture
    useEffect(() => {
        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
    }, []);

    const router = useRouter();

    return (
        <AnimatePresence>
            {/* Overlay fond noir */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/70 bg-opacity-50 z-99"
                onClick={onClose}
                key={"overlay"}
            />
            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, x: '200%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '200%' }}
                key={"modal"}
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
                    
                    <div
                        ref={commentsContainerRef}
                        className='flex flex-col justify-start h-full w-fill p-2 relative mt-2 gap-2 overflow-y-auto custom-scrollbar-comment'
                    >
                        <Comment variant='user' />
                        <Comment variant='member' />
                        <Comment variant='user'/>
                        <Comment variant='member' />
                        <Comment variant='user'/>
                    </div>
                    <form className='w-full mt-4  border-t border-gray-300 '>
                        <input type="text" name="comment" placeholder='ecrit ici ...' className='bg-background rounded-xl shadow-sm border w-full p-2 md:p-4' />
                        <button type="submit" value="" className='bg-background rounded-xl shadow-sm border w-20 p-2 md:p-4'>
                            <Send width={20} height={20} />
                        </button>
                    </form>
                </div>
                
            </motion.div>
        </AnimatePresence>
    );
}