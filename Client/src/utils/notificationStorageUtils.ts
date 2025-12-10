/**
 * Utilitaires pour gérer le localStorage des notifications
 * 
 * Ces fonctions permettent de gérer la persistance des notifications supprimées
 * côté client, sans utiliser la base de données.
 */

const DISMISSED_NOTIFICATIONS_KEY = 'yanotela_dismissed_notifications';
const MAX_DISMISSED_ENTRIES = 500; // Limite pour éviter de remplir le localStorage
const CLEANUP_INTERVAL_DAYS = 30; // Nettoyer les entrées de plus de 30 jours

/**
 * Nettoie les anciennes notifications supprimées (plus de 30 jours)
 * À appeler périodiquement ou au démarrage de l'app
 */
export function cleanupOldDismissedNotifications(userId: number): void {
  try {
    const key = `${DISMISSED_NOTIFICATIONS_KEY}_${userId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return;

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return;

    // Filtrer uniquement les entrées récentes (simplification: on garde les MAX_DISMISSED_ENTRIES dernières)
    if (parsed.length > MAX_DISMISSED_ENTRIES) {
      const trimmed = parsed.slice(-MAX_DISMISSED_ENTRIES);
      localStorage.setItem(key, JSON.stringify(trimmed));
      console.log(`[NotificationStorage] Nettoyé ${parsed.length - trimmed.length} notifications anciennes`);
    }
  } catch (error) {
    console.error('[NotificationStorage] Erreur nettoyage:', error);
  }
}

/**
 * Réinitialise complètement les notifications supprimées d'un utilisateur
 * Utile pour le debugging ou si l'utilisateur veut tout réinitialiser
 */
export function resetDismissedNotifications(userId: number): void {
  try {
    const key = `${DISMISSED_NOTIFICATIONS_KEY}_${userId}`;
    localStorage.removeItem(key);
    console.log('[NotificationStorage] Notifications supprimées réinitialisées');
  } catch (error) {
    console.error('[NotificationStorage] Erreur réinitialisation:', error);
  }
}

/**
 * Obtient le nombre de notifications supprimées stockées
 */
export function getDismissedNotificationsCount(userId: number): number {
  try {
    const key = `${DISMISSED_NOTIFICATIONS_KEY}_${userId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return 0;
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (error) {
    console.error('[NotificationStorage] Erreur comptage:', error);
    return 0;
  }
}

/**
 * Exporte les notifications supprimées pour debugging
 */
export function exportDismissedNotifications(userId: number): string[] {
  try {
    const key = `${DISMISSED_NOTIFICATIONS_KEY}_${userId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[NotificationStorage] Erreur export:', error);
    return [];
  }
}
