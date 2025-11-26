"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { CloseIcon, TrashIcon} from '@/libs/Icons';
import Comment from '@/ui/comment/comment';
import { Send } from '@/libs/Icons';
import { FetchComments, CreateComment, Commentaire, FetchPermission } from '@/loader/loader';


interface ParamModalProps {
    onClose: () => void;
}

export default function ParamModal({ onClose }: ParamModalProps) {
    const commentsContainerRef = React.useRef<HTMLDivElement>(null);
    const [comments, setComments] = useState<Commentaire[]>([]);
    const [userRole, setUserRole] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const { user } = require('@/hooks/useAuth').useAuth();
    const router = useRouter();
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

    // Charger les commentaire liés à la note
    // Utilise la fonction du loader pour charger les commentaires
    const fetchComments = async () => {
        setLoading(true);
        try {
            const result = await FetchComments(noteId);
            setComments(result);
        } catch {
            setComments([]);
        } finally {
            setLoading(false);
            if (commentsContainerRef.current) {
                commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
            }
        }
    };
    useEffect(() => {
        if (noteId) {
            fetchComments();
            // Récupérer le rôle de l'utilisateur pour la note
            FetchPermission(noteId).then(res => {
                let foundRole: number | undefined = undefined;
                if (res.success && res.permissions) {
                    // Cherche la permission correspondant à l'utilisateur courant
                    const perm = res.permissions.find(p => p.id_user === user?.id);
                    foundRole = perm?.role;
                }
                if (foundRole === undefined && user?.id) {
                    import('@/loader/loader').then(loader => {
                        loader.GetNoteById(noteId).then(note => {
                            // Debug
                            if (typeof window !== 'undefined') {
                                console.log('DEBUG GetNoteById:', note);
                            }
                            if (note && typeof note === 'object' && 'authorId' in note && note.authorId === user.id) {
                                setUserRole(0); // Propriétaire
                            } else {
                                setUserRole(foundRole);
                            }
                        });
                    });
                } else {
                    setUserRole(foundRole);
                }
            });
        }
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
        if (!commentText.trim() || !user || !noteId) return;
        setPosting(true);
        try {
            const now = new Date().toISOString();
            const payload = {
                text: commentText,
                authorId: user.id,
                date: now,
                idnote: noteId
            };
            const success = await CreateComment(payload);
            if (success) {
                setCommentText("");
                await fetchComments();
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
                        {loading ? (
                            <div className="text-center text-element">Chargement des commentaire...</div>
                        ) : (
                            comments.length === 0 ? (
                                <div className="text-center text-element">Aucun commentaire pour cette note.</div>
                            ) : (
                                comments.map((comment) => (
                                    <Comment
                                        key={comment.id}
                                        variant={user && comment.authorId === user.id ? 'user' : 'member'}
                                        {...comment}
                                        text={comment.text}
                                        author={comment.author}
                                        date={comment.date}
                                        id={comment.id}
                                        authorId={comment.authorId}
                                        userId={user?.id}
                                        userRole={userRole}
                                        onDelete={async () => { await fetchComments(); }}
                                    />
                                ))
                            )
                        )}
                    </div>
                    <form className='w-full mt-4  border-t border-gray-300 pt-2 flex gap-2' onSubmit={handleSubmit}>
                        <textarea
                            name="comment"
                            placeholder='Écris ici ...'
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
                    </form>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}