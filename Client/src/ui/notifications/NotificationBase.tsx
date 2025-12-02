"use client";

import React from "react";
import { CloseIcon } from '@/libs/Icons';
import { refreshNotifications } from "@/utils/notificationUtils";

export interface NotificationBaseProps {
    id: string;
    title: string;
    message: React.ReactNode;
    icon?: React.ReactNode;
    iconBgColor?: string;
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Composant de base pour toutes les notifications (sauf les invitations qui ont des boutons spéciaux)
 * Affiche une notification simple avec un bouton de fermeture
 */
export default function NotificationBase({ 
    id, 
    title, 
    message,
    icon,
    iconBgColor = 'bg-gray-100',
    onDismiss,
    variant = 'stack' 
}: NotificationBaseProps) {
    
    const handleDismiss = async (event?: React.MouseEvent<HTMLButtonElement>) => {
        event?.stopPropagation();
        
        if (onDismiss) {
            try {
                await onDismiss(id);
                refreshNotifications();
            } catch (error) {
                console.error("Erreur lors de la suppression de la notification:", error);
            }
        }
    };

    return (
        <div className={
            `relative w-full after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:border-b after:border-b-gray-300 hover:after:border-b-[#882626] transition-all duration-200 ease-in-out rounded-md hover:bg-white/5 hover:shadow-md hover:scale-[1.01] p-3 ` +
            (variant === 'row' ? 'flex flex-row items-start gap-3' : 'flex flex-col gap-2')
        }>
            <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                {icon && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-bold text-primary break-words line-clamp-2">{title}</h3>
                    <div className="text-gray-500 text-sm break-words">{message}</div>
                </div>
            </div>

            {onDismiss && (
                <button 
                    onClick={handleDismiss} 
                    className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 flex-shrink-0 self-start" 
                    aria-label="Fermer la notification"
                >
                    <CloseIcon width={16} height={16} className="text-gray-400"/>
                </button>
            )}
        </div>
    );
}
