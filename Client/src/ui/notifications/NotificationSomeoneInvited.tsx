"use client";

import React from "react";
import NotificationBase from "./NotificationBase";
import { ProfileIcon } from '@/libs/Icons';

interface NotificationSomeoneInvitedProps {
    id: string;
    noteTitle: string;
    invitedUserPseudo: string;
    actorPseudo?: string;
    roleLabel?: string;
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Notification quand quelqu'un a invité un autre utilisateur sur votre note
 * (visible uniquement pour les admins/propriétaires)
 */
export default function NotificationSomeoneInvited({ 
    id, 
    noteTitle, 
    invitedUserPseudo,
    actorPseudo,
    roleLabel,
    onDismiss,
    variant = 'stack' 
}: NotificationSomeoneInvitedProps) {
    
    const message = (
        <>
            <span className="font-semibold">{actorPseudo || 'Un administrateur'}</span> a invité <span className="font-semibold">{invitedUserPseudo}</span> 
            {roleLabel && <> en tant que <span className="font-semibold">{roleLabel}</span></>} sur <span className="font-semibold">&quot;{noteTitle}&quot;</span>
        </>
    );

    return (
        <NotificationBase
            id={id}
            title="Nouvel invité"
            message={message}
            icon={<ProfileIcon width={16} height={16} className="text-blue-500" />}
            iconBgColor="bg-blue-100"
            onDismiss={onDismiss}
            variant={variant}
        />
    );
}
