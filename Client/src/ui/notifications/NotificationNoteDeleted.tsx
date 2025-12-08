"use client";

import React from "react";
import NotificationBase from "./NotificationBase";
import { TrashIcon } from '@/libs/Icons';

interface NotificationNoteDeletedProps {
    id: string;
    noteTitle: string;
    actorPseudo?: string;
    isAdmin?: boolean; // true = version admin, false = version simple membre
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Notification pour la suppression d'une note
 * - Version Admin : "Votre note a été supprimée" (vous étiez admin/propriétaire)
 * - Version Membre : "La note X a été supprimée par Y"
 */
export default function NotificationNoteDeleted({ 
    id, 
    noteTitle, 
    actorPseudo,
    isAdmin = false,
    onDismiss,
    variant = 'stack' 
}: NotificationNoteDeletedProps) {
    
    const message = isAdmin ? (
        <>La note <span className="font-semibold">&quot;{noteTitle}&quot;</span> que vous gériez a été supprimée</>
    ) : (
        <>
            <span className="font-semibold">{actorPseudo || 'Un administrateur'}</span> a supprimé la note <span className="font-semibold">&quot;{noteTitle}&quot;</span>
        </>
    );

    return (
        <NotificationBase
            id={id}
            title={isAdmin ? "Note supprimée" : "Note supprimée"}
            message={message}
            icon={<TrashIcon width={16} height={16} className="text-dangerous-500" />}
            iconBgColor="var(--color-dangerous-100)"
            onDismiss={onDismiss}
            variant={variant}
        />
    );
}
