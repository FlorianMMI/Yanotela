"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloseIcon } from '@/libs/Icons';
import Comment from '@/ui/comment/comment';
import { Send } from '@/libs/Icons';
import { checkAuthResponse } from '@/utils/authFetch';
import { FetchPermission } from '@/loader/loader';
import { useYjsComments } from '@/hooks/useYjsComments';


interface ParamModalProps {
    onClose: () => void;
}

export default function ParamModal({ onClose }: ParamModalProps) {
    const commentsContainerRef = React.useRef<HTMLDivElement>(null);
    const [userRole, setUserRole] = useState<number | undefined>(undefined);
    const { user } = require('@/hooks/useAuth').useAuth();
    const pathname = require('next/navigation').usePathname();

    // Extraire l'id de la note depuis l'URL
    const extractNoteId = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (pathname.startsWith('/notes/') && segments.length > 1) {
            return segments[1];
        }
        return null;
    };
    const noteId = extractNoteId();

    // Hook YJS pour les commentaires (synchronisation temps réel)
    const { comments, addComment, deleteComment, isConnected } = useYjsComments(
        noteId,
        user?.id,
        user?.pseudo
    );

    // Récupérer le rôle de l'utilisateur sur cette note
    useEffect(() => {
        const fetchUserRole = async () => {
            if (!noteId || !user?.id) {
                console.log('[commentModal] Pas de noteId ou user.id:', { noteId, userId: user?.id });
                setUserRole(undefined);
                return;
            }
            
            try {
                console.log('[commentModal] Récupération des permissions pour noteId:', noteId, 'userId:', user.id);
                const response = await FetchPermission(noteId);
                console.log('[commentModal] Réponse FetchPermission:', response);
                
                if (response.success && response.permissions) {
                    console.log('[commentModal] Permissions reçues:', response.permissions);
                    // Trouver la permission de l'utilisateur actuel
                    // Note: le backend retourne 'userId' (camelCase)
                    const userPermission = response.permissions.find(p => p.userId === user.id);
                    console.log('[commentModal] Permission trouvée pour user:', userPermission);
                    
                    if (userPermission) {
                        setUserRole(userPermission.role);
                        console.log('[commentModal] ✅ Rôle utilisateur défini:', userPermission.role);
                    } else {
                        console.warn('[commentModal] ⚠️ Aucune permission trouvée pour userId:', user.id);
                    }
                } else {
                    console.warn('[commentModal] ⚠️ Échec ou pas de permissions:', response);
                }
            } catch (error) {
                console.error('[commentModal] ❌ Erreur lors de la récupération du rôle:', error);
            }
        };

        fetchUserRole();
    }, [noteId, user?.id]);

    

    // Scroll en bas à chaque changement de commentaires
    useEffect(() => {
        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
    }, [comments]);

    const [commentText, setCommentText] = useState("");
    const [posting, setPosting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!commentText.trim() || !noteId) return;
        setPosting(true);
        try {
            const success = addComment(commentText);
            if (success) {
                setCommentText("");
            }
        } finally {
            setPosting(false);
        }
    };

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
                        {!isConnected ? (
                            <div className="text-center text-element">Connexion en cours...</div>
                        ) : (
                            comments.length === 0 ? (
                                <div className="text-center text-element">Aucun commentaire pour cette note.</div>
                            ) : (
                                comments.map((comment) => (
                                    <Comment
                                        key={comment.id}
                                        variant={user && comment.authorId === user.id ? 'user' : 'member'}
                                        text={comment.text}
                                        author={{ pseudo: comment.authorPseudo }}
                                        date={comment.date}
                                        id={comment.id}
                                        authorId={comment.authorId}
                                        userId={user?.id}
                                        userRole={userRole}
                                        onDelete={() => deleteComment(comment.id, userRole)}
                                    />
                                ))
                            )
                        )}
                    </div>
                    <form className='w-full mt-4 border-t border-gray-300 pt-2 flex flex-col gap-2' onSubmit={handleSubmit}>
                        {!user && (
                            <div className="text-xs text-gray-600 italic px-2">
                                💬 Vous commentez en tant qu'<span className="font-semibold">Anonyme</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <textarea
                                name="comment"
                                placeholder={user ? 'Écris ici ...' : 'Écris un commentaire anonyme ...'}
                                rows={2}
                                className='bg-background rounded-xl shadow-sm border w-full p-2 md:p-4 resize-none'
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                disabled={posting}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (!posting && commentText.trim()) {
                                            handleSubmit({
                                                preventDefault: () => {},
                                            } as React.FormEvent<HTMLFormElement>);
                                        }
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                value=""
                                className='bg-background rounded-xl shadow-sm border* p-2 md:p-4 hover:border-deskbackground hover:bg-primary text-primary hover:text-background'
                                disabled={posting || !commentText.trim()}
                            >
                                <Send width={20} height={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}