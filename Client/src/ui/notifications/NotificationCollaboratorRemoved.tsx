"use client";

import React from "react";
import NotificationBase from "./NotificationBase";
import { CloseIcon } from '@/libs/Icons';

interface NotificationCollaboratorRemovedProps {
    id: string;
    noteTitle: string;
    removedUserPseudo: string;
    actorPseudo?: string;
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Notification quand un collaborateur a été exclu de votre note
 * (visible uniquement pour les admins/propriétaires)
 */
export default function NotificationCollaboratorRemoved({ 
    id, 
    noteTitle, 
    removedUserPseudo,
    actorPseudo,
    onDismiss,
    variant = 'stack' 
}: NotificationCollaboratorRemovedProps) {
    
    const message = (
        <>
            <span className="font-semibold">{actorPseudo || 'Un administrateur'}</span> a exclu <span className="font-semibold">{removedUserPseudo}</span> de la note <span className="font-semibold">&quot;{noteTitle}&quot;</span>
        </>
    );

    return (
        <NotificationBase
            id={id}
            title="Collaborateur exclu"
            message={message}
            icon={<CloseIcon width={16} height={16} className="text-warning-500" />}
            iconBgColor="bg-warning-100"
            onDismiss={onDismiss}
            variant={variant}
        />
    );
}
