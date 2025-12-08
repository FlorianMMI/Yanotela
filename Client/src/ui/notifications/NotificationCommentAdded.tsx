"use client";

import React from "react";
import NotificationBase from "./NotificationBase";
import { DocsIcon } from '@/libs/Icons';

interface NotificationCommentAddedProps {
    id: string;
    noteTitle: string;
    commentAuthorPseudo: string;
    commentPreview?: string;
    onDismiss?: (notificationId: string) => Promise<void>;
    variant?: 'row' | 'stack';
}

/**
 * Notification quand un commentaire a été ajouté sur une note
 * (désactivé sur les notes publiques)
 */
export default function NotificationCommentAdded({ 
    id, 
    noteTitle, 
    commentAuthorPseudo,
    commentPreview,
    onDismiss,
    variant = 'stack' 
}: NotificationCommentAddedProps) {
    
    const message = (
        <>
            <span className="font-semibold">{commentAuthorPseudo}</span> a commenté sur <span className="font-semibold">&quot;{noteTitle}&quot;</span>
            {commentPreview && (
                <p className="text-xs text-gray-400 mt-1 italic truncate">&quot;{commentPreview}...&quot;</p>
            )}
        </>
    );

    return (
        <NotificationBase
            id={id}
            title="Nouveau commentaire"
            message={message}
            icon={<DocsIcon width={16} height={16} className="text-blue-500" />}
            iconBgColor="var(--color-info-100)"
            onDismiss={onDismiss}
            variant={variant}
        />
    );
}
