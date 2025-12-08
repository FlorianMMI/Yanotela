import React from "react";
import { CheckIcon, CloseIcon } from '@/libs/Icons';
import { refreshNotifications } from "@/utils/notificationUtils";
import { useRouter } from "next/navigation";

interface NotificationProps {
    id: string;
    title: string;
    author: string;
    onAccept?: (notificationId: string) => Promise<void>;
    onRefuse?: (notificationId: string) => Promise<void>;
    onNotificationUpdate?: () => void;
    variant?: 'row' | 'stack';
}

export default function Notification({ 
    id, 
    title, 
    author, 
    onAccept, 
    onRefuse, 
    onNotificationUpdate, 
    variant = 'stack' 
}: NotificationProps) {
  const router = useRouter();
  
  const handleUpdateNotification = async (event?: React.MouseEvent<HTMLButtonElement>) => {
        // prevent parent click handlers if any
        event?.stopPropagation();
        
        if (onAccept) {
            // Utiliser la fonction passée en props (gère invitation-)
            try {
                await onAccept(id);
                // Déclencher la mise à jour globale des notifications
                refreshNotifications();
                // Si c'est une invitation, rediriger vers la note
                if (id.startsWith('invitation-')) {
                    const noteId = id.replace('invitation-', '');
                    router.push(`/notes/${noteId}`);
                }
            } catch (error) {
                console.error("Erreur lors de l'acceptation de la notification:", error);
            }
        }
    };
    
    const handleRefuseNotification = async (event?: React.MouseEvent<HTMLButtonElement>) => {
        // prevent parent click handlers if any
        event?.stopPropagation();
        
        if (onRefuse) {
            // Utiliser la fonction passée en props (gère invitation-)
            try {
                await onRefuse(id);
                // Appeler le callback pour rafraîchir la liste
                onNotificationUpdate?.();
                // Déclencher la mise à jour globale des notifications
                refreshNotifications();
            } catch (error) {
                console.error("Erreur lors du refus de la notification:", error);
            }
        }
    };
    return (
        <>
            <div className={
                `notification-item relative w-full max-w-full cursor-pointer ` +
                (variant === 'row' ? 'flex flex-row items-start gap-2 sm:gap-3' : 'flex flex-col gap-2 sm:gap-3')
            }>
                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                    <h3 className="font-bold text-primary text-sm sm:text-base break-words line-clamp-2 overflow-hidden">{title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm break-words overflow-hidden">
                        <span className="font-bold">{author}</span> vous a invité à rejoindre cette note
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                        onClick={handleUpdateNotification} 
                        className="p-1.5 sm:p-2 rounded hover:bg-success-50 focus:outline-none focus:ring-2 focus:ring-success-500 transition-colors" 
                        aria-label="Accepter la notification"
                    >
                        <CheckIcon width={18} height={18} className="text-success-500"/>
                    </button>
                    <button 
                        onClick={handleRefuseNotification} 
                        className="p-1.5 sm:p-2 rounded hover:bg-dangerous-50 focus:outline-none focus:ring-2 focus:ring-dangerous-500 transition-colors" 
                        aria-label="Refuser la notification"
                    >
                        <CloseIcon width={18} height={18} className="text-dangerous-500"/>
                    </button>
                </div>
            </div>
        </>
    );
}
