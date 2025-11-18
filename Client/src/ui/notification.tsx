import React from "react";
import Icon from "./Icon";
import { AcceptNotification, RefuseNotification } from "@/loader/loader";
import { refreshNotifications } from "@/utils/notificationUtils";

interface NotificationProps {
    id: string;
    title: string;
    author: string;
    onNotificationUpdate?: () => void;
    variant?: 'row' | 'stack';
}

export default function Notification({ id, title, author, onNotificationUpdate, variant = 'stack' }: NotificationProps) {
    const handleUpdateNotification = async (event?: React.MouseEvent<HTMLDivElement>) => {
        // prevent parent click handlers if any
        event?.stopPropagation();
        try {
            const result = await AcceptNotification(id);
            if (result.success && result.noteId) {
                // Déclencher la mise à jour globale des notifications
                refreshNotifications();
                
            } else {
                // Appeler le callback pour rafraîchir la liste même en cas d'erreur
                onNotificationUpdate?.();
                // Déclencher la mise à jour globale des notifications
                refreshNotifications();
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la notification:", error);
        }
    };
    const handleRefuseNotification = async (event?: React.MouseEvent<HTMLDivElement>) => {
        // prevent parent click handlers if any
        event?.stopPropagation();
        try {
            await RefuseNotification(id);
            // Appeler le callback pour rafraîchir la liste
            onNotificationUpdate?.();
            // Déclencher la mise à jour globale des notifications
            refreshNotifications();
        } catch (error) {
            console.error("Erreur lors du refus de la notification:", error);
        }
    };
    return (
        <>
            <div className={
                `relative after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:border-b after:border-b-gray-300 hover:after:border-b-[#882626] transition-all duration-200 ease-in-out rounded-md hover:bg-white/5 hover:shadow-md hover:scale-[1.01] cursor-pointer ` +
                (variant === 'row' ? 'flex flex-row items-center gap-3 p-2' : 'flex flex-col p-2')
            }>
                <div className={variant === 'row' ? 'flex-1 min-w-0' : ''}>
                    <h3 className={`font-bold text-primary ${variant === 'row' ? 'truncate' : ''}`}>{title}</h3>
                    <p className={`text-gray-500 text-sm ${variant === 'row' ? 'truncate' : ''}`}><span className="font-bold">{author}</span> vous a invité à rejoindre cette note</p>
                </div>

                <div className="flex items-center gap-2">
                    <div onClick={handleUpdateNotification} className="p-1 rounded hover:bg-gray-100" aria-label="Accepter la notification"><Icon  name="Checkk" size={20} className=" text-success-500"/></div>
                    <div onClick={handleRefuseNotification} className="p-1 rounded hover:bg-gray-100" aria-label="Refuser la notification"><Icon  name="close" size={20} className=" text-dangerous-500"/></div>
                </div>
            </div>
        </>
    );
}
