"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Notification from "@/ui/notification";
import { GetNotifications } from "@/loader/loader";
import Icon from "@/ui/Icon";

interface NotificationListProps {
    isOpenSideBar?: boolean;
}

export default function NotificationList({ isOpenSideBar = true }: NotificationListProps) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    
    // Déterminer si on est sur la page profil
    const isProfilePage = pathname.includes('/profil');
    
    // Déterminer si on doit afficher l'indicateur rouge
    const shouldShowRedIndicator = notifications.length > 0;

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const result = await GetNotifications();
            setNotifications(result.notes ?? []);
        } catch (err) {
            console.error("Error fetching notifications", err);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    // assure que le panneau est fermé au montage
    useEffect(() => {
        setOpen(false);
    }, []);

    // Charger les notifications au montage pour permettre l'affichage de l'indicateur rouge
    useEffect(() => {
        fetchNotifications();
        
        // Polling périodique pour détecter les nouvelles notifications
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // Vérifier toutes les 30 secondes
        
        // Vérifier les notifications quand la fenêtre redevient active
        const handleFocus = () => {
            fetchNotifications();
        };

        // Écouter l'événement personnalisé pour forcer la mise à jour des notifications
        const handleNotificationRefresh = () => {
            fetchNotifications();
        };
        
        window.addEventListener('focus', handleFocus);
        window.addEventListener('refreshNotifications', handleNotificationRefresh);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('refreshNotifications', handleNotificationRefresh);
        };
    }, []);

    useEffect(() => {
        // preload when opening si pas déjà chargées
        if (open && notifications.length === 0) {
            fetchNotifications();
        }
    }, [open, notifications.length]);

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

    return (
        <>
            {/* Indicateur rouge quand une notification est présente */}
            {shouldShowRedIndicator && (
                <div className={`absolute right-4 z-30 pointer-events-none ${isOpenSideBar ? 'top-7' : 'top-4'}`}>
                    <div className={` w-3 h-3 bg-red-500 rounded-full animate-pulse`}></div>
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
                    <Icon
                        name="notification"
                        size={22}
                        className="text-primary "
                    />
                </button>

                {/* Dropdown */}
                {open && (
                    <div className=" absolute md:left-0 left-auto right-0 md:right-auto  top-full mt-2 sm:mt-3 w-[18.5rem] max-w-[calc(100vw-3rem)] sm:w-80 sm:max-h-[calc(100vh-10rem)] z-100">
                        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{notifications.length}</span>
                            </div>

                            <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <Icon name="notification" size={36} className="text-gray-400 mb-3 animate-spin" />
                                        <p className="text-gray-600">Chargement...</p>
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.map((n: any) => (
                                        <Notification
                                            key={n.id}
                                            id={n.id}
                                            title={n.Titre}
                                            author={n.author}
                                            onNotificationUpdate={fetchNotifications}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                                        <Icon name="notification" size={36} className="text-gray-400" />
                                        <p className="text-gray-600">Aucune notification</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-4 py-3 border-t border-gray-100 flex justify-end bg-gray-50">
                                <button
                                    className="px-4 py-2 bg-[#882626] text-white rounded-lg hover:bg-[#792121] transition-colors shadow-sm"
                                    onClick={fetchNotifications}
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