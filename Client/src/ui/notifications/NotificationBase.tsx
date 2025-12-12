"use client";

import React from "react";
import { CloseIcon } from '@/libs/Icons';
import { refreshNotifications } from "@/utils/notificationUtils";

export interface NotificationBaseProps {
    id: string;
    title: string;
    message: React.ReactNode;
    icon?: React.ReactNode;
    // Accept a CSS color string (e.g. 'var(--color-element)' or '#fff') for theme compatibility
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
    iconBgColor = 'var(--color-element)',
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
                
            }
        }
    };

    return (
        <div className={
            `notification-item relative w-full max-w-full ` +
            (variant === 'row' ? 'flex flex-row items-start gap-2 sm:gap-3' : 'flex flex-col gap-2')
        }>
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 max-w-full">
                {icon && (
                    <div
                        className="notif-icon flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: iconBgColor }}
                    >
                        {icon}
                    </div>
                )}
                <div className="notification-content flex-1 min-w-0 max-w-full overflow-hidden">
                    <h3 className="font-bold text-primary text-sm sm:text-base break-words line-clamp-2 overflow-hidden">{title}</h3>
                    <div className="text-gray-500 text-xs sm:text-sm break-words overflow-hidden">{message}</div>
                </div>
            </div>

            {onDismiss && (
                <button 
                    onClick={handleDismiss} 
                    className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 flex-shrink-0 self-start transition-colors" 
                    aria-label="Fermer la notification"
                >
                    <CloseIcon width={16} height={16} className="text-gray-400"/>
                </button>
            )}
        </div>
    );
}
