/**
 * Utilitaires pour la gestion des notifications
 */

/**
 * Force la mise à jour des notifications depuis n'importe où dans l'application
 * Déclenche un événement personnalisé que le composant NotificationList écoute
 */
export function refreshNotifications() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('refreshNotifications'));
  }
}

/**
 * Debounced version pour éviter les appels multiples rapides
 */
let refreshTimeout: NodeJS.Timeout | null = null;
export function refreshNotificationsDebounced(delay: number = 1000) {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  refreshTimeout = setTimeout(() => {
    refreshNotifications();
    refreshTimeout = null;
  }, delay);
}