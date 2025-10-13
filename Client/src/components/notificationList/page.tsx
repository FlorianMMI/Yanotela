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
        <div className="flex flex-col gap-3">
            <button
                className="absolute top-2 right-2 p-1 rounded hover:bg-deskbackground transition-colors z-10"
                onClick={() => setOpen((s) => !s)}
                aria-label="Notifications"
            >
                <Icon name="notification" size={22} className="text-primary" />
            </button>

            {open ? (
                loading ? (
                    <div className="bg-white rounded-xl min-w-2xs w-sm shadow-lg overflow-hidden relative h-auto flex flex-col items-center justify-center p-6" aria-busy="true">
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
                    <div className="bg-white rounded-xl min-w-2xs w-sm shadow-lg overflow-hidden relative h-auto flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">Notification</h3>
                            <span className="text-sm text-gray-500">{notifications.length}</span>
                        </div>

                        <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
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
                    <div className="bg-white rounded-xl min-w-2xs w-sm shadow-lg overflow-hidden relative h-auto flex flex-col items-center justify-center p-6">
                        <Icon name="notification" size={36} className="text-gray-400 mb-3" />
                        <p className="text-gray-600 mb-4">Aucune notification</p>
                        <button
                            className="px-3 py-1 bg-[#882626] text-white rounded hover:bg-[#792121] transition-colors"
                            onClick={fetchNotifications}
                            aria-label="Rafraîchir les notifications"
                        >
                            Rafraîchir
                        </button>
                    </div>
                )
            ) : null}
        </div>
    );
}