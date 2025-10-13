"use client";

import React, { useEffect, useState } from "react";
import Notification from "@/ui/notification";
import { GetNotifications } from "@/loader/loader";
import Icon from "@/ui/Icon";

export default function NotificationList() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        // preload when opening
        if (open && notifications.length === 0) {
            fetchNotifications();
        }
    }, [open, notifications.length]);

    return (
        <div className="relative flex flex-col gap-3">

            <div className="inline-block text-left">
                <button
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                    onClick={() => setOpen((s) => !s)}
                    aria-label="Notifications"
                >
                    <Icon name="notification" size={24} className="text-primary" />
                </button>

                {open ? (
                    loading ? (
                        <div className="absolute left-0 top-full mt-2 sm:mt-3 bg-white rounded-xl w-80 max-w-[calc(100vw-3rem)] shadow-xl border border-gray-200 overflow-hidden h-auto flex flex-col items-center justify-center p-6 z-50" aria-busy="true">
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
                        <div className="absolute left-0 top-full mt-2 sm:mt-3 bg-white rounded-xl w-80 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-10rem)] shadow-xl border border-gray-200 overflow-hidden flex flex-col z-50 sm:left-auto sm:right-0 sm:translate-x-2">

                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{notifications.length}</span>
                            </div>

                            <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0 bg-white">
                                {notifications.map((n: any) => (
                                    <Notification
                                        key={n.id}
                                        id={n.id}
                                        title={n.Titre}
                                        author={n.author}
                                        onNotificationUpdate={fetchNotifications}
                                    />
                                ))}
                            </div>

                            <div className="px-4 py-3 border-t border-gray-100 flex justify-end flex-shrink-0 bg-gray-50">
                                <button
                                    className="px-4 py-2 bg-[#882626] text-white rounded-lg hover:bg-[#792121] transition-colors shadow-sm"
                                    onClick={fetchNotifications}
                                    aria-label="Rafraîchir les notifications"
                                >
                                    Rafraîchir
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="absolute left-0 top-full mt-2 sm:mt-3 bg-white rounded-xl w-80 max-w-[calc(100vw-3rem)] shadow-xl border border-gray-200 overflow-hidden h-auto flex flex-col items-center justify-center p-6 z-50 sm:left-auto sm:right-0 sm:translate-x-2">
                            <Icon name="notification" size={36} className="text-gray-400 mb-3" />
                            <p className="text-gray-600 mb-4 text-center">Aucune notification</p>
                            <button
                                className="px-4 py-2 bg-[#882626] text-white rounded-lg hover:bg-[#792121] transition-colors shadow-sm"
                                onClick={fetchNotifications}
                                aria-label="Rafraîchir les notifications"
                            >
                                Rafraîchir
                            </button>
                        </div>
                    )
                ) : null}
            </div>
        </div>
    );
}