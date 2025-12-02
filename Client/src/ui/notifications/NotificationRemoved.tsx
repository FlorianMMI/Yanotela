"use client";

import React from "react";
import NotificationBase from "./NotificationBase";
import { CloseIcon } from '@/libs/Icons';

interface NotificationRemovedProps {
    id: string;
    noteTitle: string;
    actorPseudo?: string;
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Notification quand l'utilisateur a été exclu d'une note
 */
export default function NotificationRemoved({ 
    id, 
    noteTitle, 
    actorPseudo,
    onDismiss,
    variant = 'stack' 
}: NotificationRemovedProps) {
    
    const message = (
        <>
            <span className="font-semibold">{actorPseudo || 'Un administrateur'}</span> vous a exclu de la note <span className="font-semibold">&quot;{noteTitle}&quot;</span>
        </>
    );

    return (
        <NotificationBase
            id={id}
            title="Exclusion d'une note"
            message={message}
            icon={<CloseIcon width={16} height={16} className="text-dangerous-500" />}
            iconBgColor="bg-dangerous-100"
            onDismiss={onDismiss}
            variant={variant}
        />
    );
}
