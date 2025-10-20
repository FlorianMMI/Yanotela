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
    const [isMobile, setIsMobile] = useState(false);

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
    // detect mobile by width
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('refreshNotifications', handleNotificationRefresh);
            window.removeEventListener('resize', checkMobile);
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
            // if mobile and open, clicking backdrop closes (backdrop handled by modal markup)
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = isMobile ? 'hidden' : '';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [open, isMobile]);

    return (
        <>
            {/* Indicateur rouge quand une notification est présente */}
            {shouldShowRedIndicator && (
                <div className="absolute -top-1 -right-1 z-30 pointer-events-none">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
            )}

            {/* Wrapper anchor - always render icon (hidden prop removed) */}
            <div
                ref={notificationRef}
                className={`relative flex items-end w-fit z-30`}
            >
                <button
                    className={`flex p-1 rounded hover:bg-deskbackground hover:text-primary transition-colors z-30`}
                    onClick={() => setOpen((s) => !s)}
                    aria-label="Notifications"
                >
                    <Icon
                        name="notification"
                        size={22}
                        className={isProfilePage ? "md:text-white text-primary hover:text-primary" : "text-primary"}
                    />
                </button>

                {/* Desktop dropdown */}
                {!isMobile && open && (
                    loading ? (
                        <div className="bg-white relative top-8 rounded-xl w-[20rem] shadow-lg overflow-hidden h-auto flex flex-col items-center justify-center p-6" aria-busy="true">
                            <Icon name="notification" size={36} className="text-gray-400 mb-3 animate-spin" />
                            <p className="text-gray-600 mb-4">Chargement...</p>
                            <button
                                className="px-3 py-1 bg-[#882626] text-white rounded opacity-60 cursor-not-allowed"
                                onClick={fetchNotifications}
                                aria-label="Rafraîchir les notifications"
                                disabled
                            >
                                Rafraîchir
                            </button>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="bg-white rounded-xl w-[20rem] shadow-lg overflow-hidden relative top-8 h-auto flex flex-col">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">Notification</h3>
                                <span className="text-sm text-gray-500">{notifications.length}</span>
                            </div>

                            <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
                                {notifications.map((n: any) => (
                                    <Notification
                                        key={n.id}
                                        id={n.id}
                                        title={n.Titre}
                                        author={n.author}
                                        onNotificationUpdate={fetchNotifications}
                                        variant="row"
                                    />
                                ))}
                            </div>

                            <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
                                <button
                                    className="px-3 py-1 bg-[#882626] text-white rounded hover:bg-[#792121] transition-colors"
                                    onClick={fetchNotifications}
                                    aria-label="Rafraîchir les notifications"
                                >
                                    Rafraîchir
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden relative top-8 w-[20rem] h-auto flex flex-col items-center justify-center p-4 gap-3">
                            <Icon name="notification" size={36} className="text-gray-400 " />
                            <p className="text-gray-600 ">Aucune notification</p>
                            <button
                                className="px-3 py-1 bg-[#882626] text-white rounded hover:bg-[#792121] transition-colors"
                                onClick={fetchNotifications}
                                aria-label="Rafraîchir les notifications"
                            >
                                Rafraîchir
                            </button>
                        </div>
                    )
                )}

                {/* Mobile bottom sheet */}
                {isMobile && open && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-40 z-40"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />

                        <div className="fixed left-0 right-0 bottom-0 z-50">
                            <div className="bg-white rounded-t-xl shadow-xl max-h-[50vh] overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                    <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">Fermer</button>
                                </div>

                                <div className="p-3 space-y-2 max-h-[35vh] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <Icon name="notification" size={32} className="text-gray-400 mb-2 animate-spin" />
                                            <p className="text-gray-600 mb-2">Chargement...</p>
                                        </div>
                                    ) : notifications.length > 0 ? (
                                        notifications.map((n: any) => (
                                            <Notification
                                                key={n.id}
                                                id={n.id}
                                                title={n.Titre}
                                                author={n.author}
                                                onNotificationUpdate={fetchNotifications}
                                                variant="stack"
                                            />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <Icon name="notification" size={32} className="text-gray-400 " />
                                            <p className="text-gray-600 ">Aucune notification</p>
                                        </div>
                                    )}
                                </div>

                                <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
                                    <button
                                        className="px-3 py-1 bg-[#882626] text-white rounded hover:bg-[#792121] transition-colors"
                                        onClick={fetchNotifications}
                                        aria-label="Rafraîchir les notifications"
                                    >
                                        Rafraîchir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}