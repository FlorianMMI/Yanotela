"use client";

import React from "react";
import NotificationBase from "./NotificationBase";
import { ExitIcon } from '@/libs/Icons';

interface NotificationUserLeftProps {
    id: string;
    noteTitle: string;
    leavingUserPseudo: string;
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Notification quand un utilisateur a quitté votre note
 * (visible uniquement pour les admins/propriétaires, désactivé sur notes publiques)
 */
export default function NotificationUserLeft({ 
    id, 
    noteTitle, 
    leavingUserPseudo,
    onDismiss,
    variant = 'stack' 
}: NotificationUserLeftProps) {
    
    const message = (
        <>
            <span className="font-semibold">{leavingUserPseudo}</span> a quitté la note <span className="font-semibold">&quot;{noteTitle}&quot;</span>
        </>
    );

    return (
        <NotificationBase
            id={id}
            title="Départ d'un collaborateur"
            message={message}
            icon={<ExitIcon width={16} height={16} className="text-gray-500" />}
            iconBgColor="var(--color-gray-100)"
            onDismiss={onDismiss}
            variant={variant}
        />
    );
}
