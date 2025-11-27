"use client";

import React, { useEffect, useState, useRef } from "react";
import Notification from "@/ui/notification";
import { NotificationsIcon } from "@/libs/Icons";
import { useYjsNotifications } from "@/hooks/useYjsNotifications";
import { useAuth } from "@/hooks/useAuth";

interface NotificationListProps {
    isOpenSideBar?: boolean;
}

export default function NotificationList({ isOpenSideBar = true }: NotificationListProps) {
    const [open, setOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const auth = useAuth();

    // ✅ Utiliser YJS Awareness pour les notifications temps réel (plus de polling HTTP)
    const { notifications, loading, markAsRead, deleteNotification } = useYjsNotifications(auth.user?.id);

    // Déterminer si on doit afficher l'indicateur rouge
    const shouldShowRedIndicator = notifications.length > 0;

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

    return (
        <>
            {/* Indicateur rouge quand une notification est présente */}
            {shouldShowRedIndicator && (
                <div className={`absolute right-4 z-30 pointer-events-none ${isOpenSideBar ? 'top-7' : 'top-4'}`}>
                    <div className={` w-3 h-3 bg-dangerous-500 rounded-full animate-pulse`}></div>
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
                    <div className=" absolute -left-5 top-full mt-2 sm:mt-3 w-[18.5rem] max-w-[calc(100vw-3rem)] sm:w-80 sm:max-h-[calc(100vh-10rem)] z-100">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{notifications.length}</span>
                            </div>

                            <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <NotificationsIcon width={36} height={36} className="text-gray-400 mb-3 animate-spin" />
                                        <p className="text-gray-600">Chargement...</p>
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <Notification
                                            key={n.id}
                                            id={n.id}
                                            title={n.noteTitle || ''}
                                            author={n.author || n.actorPseudo || ''}
                                            onAccept={markAsRead}
                                            onRefuse={deleteNotification}
                                            onNotificationUpdate={handleRefresh}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                                        <NotificationsIcon width={36} height={36} className="text-gray-400" />
                                        <p className="text-gray-600">Aucune notification</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-4 py-3 border-t border-gray-100 flex justify-end bg-gray-50">
                                <button
                                    className="px-4 py-2 bg-primary text-white rounded-lg transition-colors shadow-sm"
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
