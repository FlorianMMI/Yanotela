"use client";

import React, { useEffect, useState, useRef } from "react";
import { NotificationsIcon } from "@/libs/Icons";
import { useYjsNotifications, YjsNotification } from "@/hooks/useYjsNotifications";
import { useAuth } from "@/hooks/useAuth";
import {
    NotificationInvit,
    NotificationNoteDeleted,
    NotificationRemoved,
    NotificationSomeoneInvited,
    NotificationRoleChanged,
    NotificationCollaboratorRemoved,
    NotificationUserLeft,
    NotificationCommentAdded,
} from "@/ui/notifications";

interface NotificationListProps {
    isOpenSideBar?: boolean;
}

export default function NotificationList({ isOpenSideBar = true }: NotificationListProps) {
    const [open, setOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const auth = useAuth();

    // ✅ Utiliser YJS Awareness pour les notifications temps réel (plus de polling HTTP)
    const { notifications, loading, markAsRead, deleteNotification } = useYjsNotifications(auth.user?.id);

    // Déterminer si on doit afficher l'indicateur rouge (seulement pour les notifications non lues)
    const shouldShowRedIndicator = notifications.some(n => !n.read);
    
    // Compter les notifications non lues
    const unreadCount = notifications.filter(n => !n.read).length;

    // assure que le panneau est fermé au montage
    useEffect(() => {
        setOpen(false);
    }, []);

    // Gérer les clics en dehors du panneau de notifications
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    // Quand on ouvre le panneau, forcer un rafraîchissement des notifications
    useEffect(() => {
        if (open) {
            handleRefresh();
        }
    }, [open]);

    // Fonction de rafraîchissement pour forcer la mise à jour, utilise CustomEvent, ce qui émet un événement écouté par le hook useYjsNotifications, pour rafraîchir la liste des notifications
    const handleRefresh = () => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
    };

    /**
     * Rendu d'une notification selon son type
     */
    const renderNotification = (n: YjsNotification) => {
        switch (n.type) {
            case 'INVITATION':
                return (
                    <NotificationInvit
                        key={n.id}
                        id={n.id}
                        title={n.noteTitle || ''}
                        author={n.author || n.actorPseudo || ''}
                        onAccept={markAsRead}
                        onRefuse={deleteNotification}
                        onNotificationUpdate={handleRefresh}
                    />
                );
            
            case 'NOTE_DELETED':
                return (
                    <NotificationNoteDeleted
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        actorPseudo={n.actorPseudo}
                        isAdmin={false}
                        onDismiss={deleteNotification}
                    />
                );

            case 'NOTE_DELETED_ADMIN':
                return (
                    <NotificationNoteDeleted
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        actorPseudo={n.actorPseudo}
                        isAdmin={true}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'NOTE_DELETED_MEMBER':
                return (
                    <NotificationNoteDeleted
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        actorPseudo={n.actorPseudo}
                        isAdmin={false}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'REMOVED':
                return (
                    <NotificationRemoved
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        actorPseudo={n.actorPseudo}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'SOMEONE_INVITED':
                return (
                    <NotificationSomeoneInvited
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        invitedUserPseudo={n.invitedUserPseudo || ''}
                        actorPseudo={n.actorPseudo}
                        roleLabel={n.roleLabel}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'ROLE_CHANGED':
                return (
                    <NotificationRoleChanged
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        roleLabel={n.roleLabel || ''}
                        isPromotion={n.isPromotion}
                        actorPseudo={n.actorPseudo}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'COLLABORATOR_REMOVED':
                return (
                    <NotificationCollaboratorRemoved
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        removedUserPseudo={n.removedUserPseudo || ''}
                        actorPseudo={n.actorPseudo}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'USER_LEFT':
                return (
                    <NotificationUserLeft
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        leavingUserPseudo={n.leavingUserPseudo || ''}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'COMMENT_ADDED':
                return (
                    <NotificationCommentAdded
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        commentAuthorPseudo={n.commentAuthorPseudo || ''}
                        commentPreview={n.commentPreview}
                        onDismiss={deleteNotification}
                    />
                );
            
            case 'USER_ADDED':
                // Fallback pour USER_ADDED (rarement utilisé)
                return (
                    <NotificationSomeoneInvited
                        key={n.id}
                        id={n.id}
                        noteTitle={n.noteTitle || ''}
                        invitedUserPseudo="Vous"
                        actorPseudo={n.actorPseudo}
                        roleLabel={n.roleLabel}
                        onDismiss={deleteNotification}
                    />
                );
            
            default:
                // Fallback générique pour les types inconnus
                return null;
        }
    };

    return (
        <>
            {/* Badge avec le nombre de notifications non lues */}
            {shouldShowRedIndicator && (
                <div className={`absolute right-3 z-30 pointer-events-none ${isOpenSideBar ? 'top-6' : 'top-3'}`}>
                    {unreadCount <= 9 ? (
                        <div className="notification-badge bg-dangerous-500 rounded-full">
                            <span className="text-white text-xs font-bold">{unreadCount}</span>
                        </div>
                    ) : (
                        <div className="notification-badge min-w-[20px] bg-dangerous-500 rounded-full px-1">
                            <span className="text-white text-xs font-bold">9+</span>
                        </div>
                    )}
                </div>
            )}

            {/* Wrapper anchor */}
            <div
                ref={notificationRef}
                className={`relative flex items-end w-fit z-10 ${!isOpenSideBar ? 'hidden' : 'flex'}`}
            >
                <button
                    className="flex p-1 rounded hover:bg-deskbackground hover:text-primary transition-colors z-10"
                    onClick={() => setOpen((s) => !s)}
                    aria-label="Notifications"
                >
                    <NotificationsIcon width={22} height={22}
                        className="text-primary "
                    />
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="absolute -left-5 top-full mt-2 sm:mt-3 w-[calc(100vw-2rem)] max-w-[20rem] sm:w-80 sm:max-w-[22rem] z-[100]">
                        <div className="notification-dropdown bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-10rem)]">
                            
                            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Notifications</h3>
                            </div>

                            <div className="notification-list-container p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <NotificationsIcon width={36} height={36} className="text-gray-400 mb-3 animate-spin" />
                                        <p className="text-gray-600 text-sm">Chargement...</p>
                                    </div>
                                ) : notifications.length > 0 ? (
                                    <div className="space-y-2 w-full">
                                        {notifications.map((n) => renderNotification(n))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                                        <NotificationsIcon width={36} height={36} className="text-gray-400" />
                                        <p className="text-gray-600 text-sm">Aucune notification</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-100 flex justify-end bg-gray-50">
                                <button
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-sm"
                                    onClick={handleRefresh}
                                    aria-label="Rafraîchir les notifications"
                                >
                                    Rafraîchir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}