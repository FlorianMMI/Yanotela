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
            setNotifications(result.notifications ?? []);
        } catch (err) {
            console.error("Error fetching notifications", err);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // preload when opening
        if (open && notifications.length === 0) {
            fetchNotifications();
        }
    }, [open]);

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
                    <div className="py-4 text-element">Chargement...</div>
                ) : (
                    <div className="bg-white rounded-xl min-w-2xs w-sm shadow-lg overflow-hidden relative h-auto flex flex-col">
                        {notifications.map((n: any) => (
                            <Notification key={n.id} title={n.title} author={n.author} />
                        ))}
                    </div>
                )
            ) : (
                <div className="bg-white rounded-xl min-w-2xs w-sm shadow-lg overflow-hidden relative h-auto flex flex-col">
                    <p>Aucune notification</p>
                </div>
            )}
        </div>
    );
}