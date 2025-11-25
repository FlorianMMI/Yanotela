/**
 * Service de notifications temps réel via YJS Awareness
 * 
 * Ce service permet d'émettre des notifications instantanées via le WebSocket YJS
 * existant, sans polling HTTP. Les notifications sont éphémères (mémoire uniquement).
 * 
 * Architecture :
 * - Stockage en mémoire : Map<userId, notifications[]>
 * - Diffusion via YJS Awareness (WebSocket)
 * - Auto-nettoyage après 24h
 * 
 * Types de notifications supportés :
 * - REMOVED : Exclusion d'une note partagée
 * - NOTE_DELETED : Note collaborative supprimée
 * - USER_ADDED : Utilisateur ajouté à une note
 * - ROLE_CHANGED : Promotion/rétrogradation de rôle
 * 
 * 📝 Pour ajouter un nouveau type de notification :
 * 1. Ajouter le type dans NotificationType
 * 2. Créer une fonction notify{Type}()
 * 3. Appeler cette fonction dans le contrôleur approprié
 * 4. Mettre à jour le hook client useYjsNotifications.ts
 * 5. Mettre à jour le composant Notification.tsx pour afficher le nouveau type
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Types de notifications disponibles
 */
export const NotificationType = {
  REMOVED: 'REMOVED',
  NOTE_DELETED: 'NOTE_DELETED',
  USER_ADDED: 'USER_ADDED',
  ROLE_CHANGED: 'ROLE_CHANGED',
};

/**
 * Labels de rôles pour les messages
 */
const ROLE_LABELS = {
  0: 'Propriétaire',
  1: 'Administrateur',
  2: 'Éditeur',
  3: 'Lecteur',
};

/**
 * Stockage en mémoire des notifications par utilisateur
 * Structure: Map<userId, Array<notification>>
 */
const pendingNotifications = new Map();

/**
 * Registry des providers YJS actifs (rempli par le serveur WebSocket custom)
 * Structure: Map<noteId, Provider>
 * 
 * Provider shape: { awareness, doc, roomName, noteId }
 */
export const yjsProviders = new Map();

/**
 * Enregistre un provider YJS créé par le serveur WebSocket
 * Appelé automatiquement quand un client se connecte à une room
 * 
 * @param {string} noteId - ID de la note
 * @param {object} provider - Provider YJS avec { awareness, doc, roomName, noteId }
 */
export function registerProvider(noteId, provider) {
  yjsProviders.set(noteId, provider);
  console.log(`✅ [YJS NOTIF SERVICE] Provider enregistré: noteId=${noteId}, total=${yjsProviders.size}`);
}

/**
 * Désenregistre un provider YJS quand tous les clients se déconnectent
 * 
 * @param {string} noteId - ID de la note
 */
export function unregisterProvider(noteId) {
  const removed = yjsProviders.delete(noteId);
  if (removed) {
    console.log(`🧹 [YJS NOTIF SERVICE] Provider désenregistré: noteId=${noteId}, restants=${yjsProviders.size}`);
  }
}

/**
 * Crée une notification et la diffuse via YJS Awareness
 * @private
 */
function createNotification(type, userId, data) {
  const notification = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    targetUserId: userId,
    timestamp: Date.now(),
    read: false,
    ...data,
  };

  // Stocker en mémoire
  if (!pendingNotifications.has(userId)) {
    pendingNotifications.set(userId, []);
  }
  pendingNotifications.get(userId).push(notification);

  // Auto-nettoyage après 24h
  setTimeout(() => {
    deleteNotification(userId, notification.id);
  }, 24 * 60 * 60 * 1000);

  // Diffuser via YJS Awareness sur tous les providers actifs
  broadcastNotificationViaAwareness(notification);

  console.log(`✅ [YJS NOTIF] ${type} créée pour user=${userId}`);
  return notification;
}

/**
 * Diffuse une notification via YJS Awareness
 * @private
 */
function broadcastNotificationViaAwareness(notification) {
  // Parcourir tous les providers actifs et diffuser la notification
  yjsProviders.forEach((provider) => {
    const awareness = provider.awareness;
    
    // Récupérer l'état local actuel
    const localState = awareness.getLocalState() || {};
    
    // Ajouter/mettre à jour les notifications dans l'awareness
    const notifications = localState.notifications || [];
    notifications.push(notification);
    
    // Mettre à jour l'awareness (broadcast automatique)
    awareness.setLocalStateField('notifications', notifications);
  });

  console.log(`📡 [YJS NOTIF] Broadcast via Awareness pour ${yjsProviders.size} providers`);
}

/**
 * 🔔 Notifie un utilisateur qu'il a été exclu d'une note
 * 
 * @param {number} userId - ID de l'utilisateur exclu
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {string} actorPseudo - Pseudo de l'utilisateur qui a exclu
 * 
 * @example
 * // Dans permissionController.js (RemovePermission)
 * await notifyUserRemoved(targetUserId, noteId, note.Titre, req.session.pseudo);
 */
export async function notifyUserRemoved(userId, noteId, noteTitle, actorPseudo = 'Un administrateur') {
  console.log(`🔔 [NOTIF] Exclusion: userId=${userId}, note="${noteTitle}"`);
  
  return createNotification(NotificationType.REMOVED, userId, {
    noteId,
    noteTitle,
    actorPseudo,
  });
}

/**
 * 🔔 Notifie tous les collaborateurs qu'une note a été supprimée
 * 
 * @param {string} noteId - ID de la note supprimée
 * @param {string} noteTitle - Titre de la note
 * @param {number} actorUserId - ID de l'utilisateur qui a supprimé (à exclure des notifications)
 * 
 * @example
 * // Dans noteController.js (deleteNote)
 * await notifyNoteDeleted(noteId, note.Titre, req.session.userId);
 */
export async function notifyNoteDeleted(noteId, noteTitle, actorUserId) {
  console.log(`🔔 [NOTIF] Note supprimée: "${noteTitle}"`);

  try {
    // Récupérer tous les collaborateurs (sauf celui qui a supprimé)
    const permissions = await prisma.permission.findMany({
      where: { 
        noteId,
        userId: { not: actorUserId }
      },
      select: { userId: true },
    });

    // Créer une notification pour chaque collaborateur
    const notifications = [];
    for (const perm of permissions) {
      const notif = createNotification(NotificationType.NOTE_DELETED, perm.userId, {
        noteId,
        noteTitle,
      });
      notifications.push(notif);
    }

    console.log(`✅ [NOTIF] ${notifications.length} notifications NOTE_DELETED diffusées`);
    return notifications;

  } catch (error) {
    console.error('[notifyNoteDeleted] Erreur:', error);
    return [];
  }
}

/**
 * 🔔 Notifie un utilisateur qu'il a été ajouté à une note
 * 
 * ⚠️ IMPORTANT: Ne PAS appeler lors de la création d'une invitation classique
 * (Permission.isAccepted=false), car l'invitation sera affichée via le système classique.
 * 
 * Utiliser uniquement pour :
 * - Les ajouts directs avec isAccepted=true
 * - Les notifications post-acceptation
 * 
 * @param {number} userId - ID de l'utilisateur ajouté
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {number} role - Rôle attribué (0-3)
 * @param {string} actorPseudo - Pseudo de l'utilisateur qui a ajouté
 * 
 * @example
 * // Dans permissionController.js (AddPermission) - UNIQUEMENT si isAccepted=true
 * if (isAccepted) {
 *   await notifyUserAdded(userId, noteId, note.Titre, role, req.session.pseudo);
 * }
 */
export async function notifyUserAdded(userId, noteId, noteTitle, role, actorPseudo) {
  console.log(`🔔 [NOTIF] Utilisateur ajouté: userId=${userId}, note="${noteTitle}", role=${role}`);
  
  const roleLabel = ROLE_LABELS[role] || 'Collaborateur';
  
  return createNotification(NotificationType.USER_ADDED, userId, {
    noteId,
    noteTitle,
    actorPseudo,
    roleLabel,
  });
}

/**
 * 🔔 Notifie un utilisateur que son rôle a changé
 * 
 * @param {number} userId - ID de l'utilisateur concerné
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {number} oldRole - Ancien rôle (0-3)
 * @param {number} newRole - Nouveau rôle (0-3)
 * @param {string} actorPseudo - Pseudo de l'utilisateur qui a modifié
 * 
 * @example
 * // Dans permissionController.js (UpdatePermission)
 * await notifyRoleChanged(targetUserId, noteId, note.Titre, oldRole, newRole, req.session.pseudo);
 */
export async function notifyRoleChanged(userId, noteId, noteTitle, oldRole, newRole, actorPseudo) {
  console.log(`🔔 [NOTIF] Rôle changé: userId=${userId}, note="${noteTitle}", ${oldRole} → ${newRole}`);
  
  const roleLabel = ROLE_LABELS[newRole] || 'Collaborateur';
  const isPromotion = newRole < oldRole; // Rôles: 0=owner, 1=admin, 2=editor, 3=reader
  
  return createNotification(NotificationType.ROLE_CHANGED, userId, {
    noteId,
    noteTitle,
    actorPseudo,
    roleLabel,
    isPromotion,
  });
}

/**
 * Récupère les notifications en attente d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Array} Liste des notifications
 */
export function getPendingNotifications(userId) {
  return pendingNotifications.get(userId) || [];
}

/**
 * Compte le nombre de notifications non lues
 * @param {number} userId - ID de l'utilisateur
 * @returns {number} Nombre de notifications non lues
 */
export function getUnreadCount(userId) {
  const notifications = pendingNotifications.get(userId) || [];
  return notifications.filter(n => !n.read).length;
}

/**
 * Marque une notification comme lue
 * @param {number} userId - ID de l'utilisateur
 * @param {string} notificationId - ID de la notification
 * @returns {boolean} Succès ou échec
 */
export function markNotificationAsRead(userId, notificationId) {
  const notifications = pendingNotifications.get(userId);
  if (!notifications) return false;

  const notification = notifications.find(n => n.id === notificationId);
  if (!notification) return false;

  notification.read = true;
  console.log(`✅ [NOTIF] Notification ${notificationId} marquée comme lue`);
  return true;
}

/**
 * Supprime une notification
 * @param {number} userId - ID de l'utilisateur
 * @param {string} notificationId - ID de la notification
 * @returns {boolean} Succès ou échec
 */
export function deleteNotification(userId, notificationId) {
  const notifications = pendingNotifications.get(userId);
  if (!notifications) return false;

  const index = notifications.findIndex(n => n.id === notificationId);
  if (index === -1) return false;

  notifications.splice(index, 1);
  console.log(`✅ [NOTIF] Notification ${notificationId} supprimée`);
  return true;
}

/**
 * Nettoie toutes les notifications d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 */
export function clearUserNotifications(userId) {
  pendingNotifications.delete(userId);
  console.log(`🧹 [NOTIF] Notifications de user=${userId} nettoyées`);
}

/**
 * Obtenir des statistiques sur les notifications (pour monitoring)
 * @returns {object} Statistiques
 */
export function getNotificationStats() {
  const totalUsers = pendingNotifications.size;
  let totalNotifications = 0;
  let unreadNotifications = 0;

  pendingNotifications.forEach((notifications) => {
    totalNotifications += notifications.length;
    unreadNotifications += notifications.filter(n => !n.read).length;
  });

  return {
    totalUsers,
    totalNotifications,
    unreadNotifications,
    activeProviders: yjsProviders.size,
  };
}

/**
 * 📝 TEMPLATE pour ajouter un nouveau type de notification
 * 
 * 1. Ajouter le type dans NotificationType
 * 2. Créer la fonction :
 * 
 * export async function notifyNewType(userId, noteId, noteTitle, ...params) {
 *   console.log(`🔔 [NOTIF] NewType: userId=${userId}, note="${noteTitle}"`);
 *   
 *   return createNotification(NotificationType.NEW_TYPE, userId, {
 *     noteId,
 *     noteTitle,
 *     // ...autres données
 *   });
 * }
 * 
 * 3. Appeler dans le contrôleur :
 * 
 * import { notifyNewType } from '../services/yjsNotificationService.js';
 * await notifyNewType(userId, noteId, note.Titre, ...);
 * 
 * 4. Mettre à jour le client :
 * - Client/src/hooks/useYjsNotifications.ts (ajouter le type dans l'interface)
 * - Client/src/ui/notification.tsx (ajouter le case dans le switch)
 */
