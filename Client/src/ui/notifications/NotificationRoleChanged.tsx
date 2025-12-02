"use client";

import React from "react";
import NotificationBase from "./NotificationBase";
import { ArrowIcon } from '@/libs/Icons';

interface NotificationRoleChangedProps {
    id: string;
    noteTitle: string;
    roleLabel: string;
    isPromotion?: boolean;
    actorPseudo?: string;
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Notification quand le rôle de l'utilisateur a été modifié sur une note
 */
export default function NotificationRoleChanged({ 
    id, 
    noteTitle, 
    roleLabel,
    isPromotion = false,
    actorPseudo,
    onDismiss,
    variant = 'stack' 
}: NotificationRoleChangedProps) {
    
    const actionText = isPromotion ? "promu" : "rétrogradé";
    const message = (
        <>
            <span className="font-semibold">{actorPseudo || 'Un administrateur'}</span> vous a {actionText} au rôle de <span className="font-semibold">{roleLabel}</span> sur <span className="font-semibold">&quot;{noteTitle}&quot;</span>
        </>
    );

    return (
        <NotificationBase
            id={id}
            title={isPromotion ? "Promotion" : "Changement de rôle"}
            message={message}
            icon={<ArrowIcon width={16} height={16} className={isPromotion ? "text-success-500 rotate-180" : "text-warning-500"} />}
            iconBgColor={isPromotion ? "bg-success-100" : "bg-warning-100"}
            onDismiss={onDismiss}
            variant={variant}
        />
    );
}
