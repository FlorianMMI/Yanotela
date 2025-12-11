/**
 * Service de notifications temps réel via YJS Awareness
 * 
 * Ce service permet d'émettre des notifications instantanées via le WebSocket YJS
 * existant, sans polling HTTP. Les notifications sont éphémères (mémoire uniquement).
 * 
 * Architecture :
 * - Stockage en mémoire : Map<userId, notifications[]>
 * - Diffusion via YJS Awareness (WebSocket) - LE BACKEND ENVOIE AU SERVEUR YJS
 * - Auto-nettoyage après 24h
 * 
 * IMPORTANT: Le backend et le serveur YJS sont dans des conteneurs Docker séparés.
 * Le backend utilise yjsBroadcastClient.js pour envoyer les notifications au serveur YJS.
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
import { sendNotificationToUser, broadcastNotificationToUsers } from "./yjsBroadcastClient.js";

const prisma = new PrismaClient();

/**
 * Types de notifications disponibles
 * 
 * NOTE_DELETED_ADMIN : Votre note a été supprimée (vous êtes admin/propriétaire)
 * NOTE_DELETED_MEMBER : La note a été supprimée (vous êtes simple membre)
 * REMOVED : Vous avez été exclu d'une note
 * SOMEONE_INVITED : Quelqu'un a invité un utilisateur sur votre note
 * ROLE_CHANGED : Votre rôle a été modifié
 * COLLABORATOR_REMOVED : Un collaborateur a été exclu (pour les admins)
 * USER_LEFT : Un utilisateur a quitté votre note (pour les admins)
 * COMMENT_ADDED : Un commentaire a été ajouté (désactivé sur notes publiques)
 */
export const NotificationType = {
  INVITATION: 'INVITATION',
  REMOVED: 'REMOVED',
  NOTE_DELETED: 'NOTE_DELETED', // Legacy, gardé pour compatibilité
  NOTE_DELETED_ADMIN: 'NOTE_DELETED_ADMIN',
  NOTE_DELETED_MEMBER: 'NOTE_DELETED_MEMBER',
  USER_ADDED: 'USER_ADDED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  SOMEONE_INVITED: 'SOMEONE_INVITED',
  COLLABORATOR_REMOVED: 'COLLABORATOR_REMOVED',
  USER_LEFT: 'USER_LEFT',
  COMMENT_ADDED: 'COMMENT_ADDED',
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
 * Registry des rooms de notifications par userId
 * Structure: Map<userId, { awareness, doc, roomName, conns }>
 */
export const notificationRooms = new Map();

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
 * Enregistre une room de notifications pour un utilisateur
 * 
 * @param {number} userId - ID de l'utilisateur
 * @param {object} room - Room YJS avec { awareness, doc, roomName, conns }
 */
export function registerNotificationRoom(userId, room) {
  notificationRooms.set(userId, room);
  console.log(`🔔 [YJS NOTIF SERVICE] Room de notifications enregistrée: userId=${userId}, total=${notificationRooms.size}`);
}

/**
 * Désenregistre une room de notifications
 * 
 * @param {number} userId - ID de l'utilisateur
 */
export function unregisterNotificationRoom(userId) {
  const removed = notificationRooms.delete(userId);
  if (removed) {
    console.log(`🧹 [YJS NOTIF SERVICE] Room de notifications désenregistrée: userId=${userId}, restantes=${notificationRooms.size}`);
  }
}

/**
 * Crée une notification et la diffuse via le serveur YJS WebSocket
 * Utilise le client WebSocket pour communiquer avec le serveur YJS séparé
 * @private
 */
async function createAndBroadcastNotification(type, userId, data) {
  console.log(`📦 [createAndBroadcastNotification] Création notification type=${type}, userId=${userId}`);
  console.log(`📦 [createAndBroadcastNotification] Données:`, data);
  
  const notification = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    targetUserId: userId,
    timestamp: Date.now(),
    read: false,
    ...data,
  };
  
  console.log(`📦 [createAndBroadcastNotification] Notification complète créée:`, notification);

  // Stocker en mémoire (pour référence/debug)
  if (!pendingNotifications.has(userId)) {
    pendingNotifications.set(userId, []);
  }
  pendingNotifications.get(userId).push(notification);
  console.log(`💾 [createAndBroadcastNotification] Stockée en mémoire, total pour user ${userId}: ${pendingNotifications.get(userId).length}`);

  // Auto-nettoyage après 24h
  setTimeout(() => {
    deleteNotification(userId, notification.id);
  }, 24 * 60 * 60 * 1000);

  // ✅ ENVOYER AU SERVEUR YJS VIA WEBSOCKET
  console.log(`📤 [createAndBroadcastNotification] Appel sendNotificationToUser pour userId=${userId}`);
  const sent = await sendNotificationToUser(userId, notification);
  
  console.log(`${sent ? '✅' : '❌'} [createAndBroadcastNotification] ${type} créée pour user=${userId}, envoyée au serveur YJS=${sent}`);
  return notification;
}

/**
 * Crée une notification et la diffuse via YJS Awareness
 * @deprecated Utiliser createAndBroadcastNotification à la place
 * @private
 */
function createNotification(type, userId, data) {
  // Rediriger vers la nouvelle fonction (async)
  return createAndBroadcastNotification(type, userId, data);
}

// NOTE: Les fonctions broadcastNotificationViaAwareness et broadcastNotificationToUser
// ont été supprimées car elles ne fonctionnent pas quand le backend et le serveur YJS
// sont dans des conteneurs Docker séparés. On utilise maintenant yjsBroadcastClient.js
// qui envoie les notifications au serveur YJS via WebSocket.

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
 * 🔔 Notifie un utilisateur qu'il a reçu une invitation à collaborer sur une note
 * 
 * Cette fonction est appelée quand AddPermission crée une nouvelle permission
 * avec isAccepted=false. La notification est envoyée en temps réel via WebSocket.
 * 
 * @param {number} userId - ID de l'utilisateur invité
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {number} role - Rôle attribué (0-3)
 * @param {string} actorPseudo - Pseudo de l'utilisateur qui invite
 * 
 * @example
 * // Dans permissionController.js (AddPermission)
 * await notifyInvitation(targetUser.id, noteId, note.Titre, targetRole, req.session.pseudo);
 */
export async function notifyInvitation(userId, noteId, noteTitle, role, actorPseudo) {
  console.log(`🔔 [NOTIF] Invitation: userId=${userId}, note="${noteTitle}", par ${actorPseudo}`);
  
  const roleLabel = ROLE_LABELS[role] || 'Collaborateur';
  
  const notification = {
    id: `invitation-${noteId}`, // ID unique basé sur noteId (comme dans le client)
    type: NotificationType.INVITATION,
    targetUserId: userId,
    noteId,
    noteTitle,
    author: actorPseudo,
    actorPseudo,
    roleLabel,
    timestamp: Date.now(),
    read: false,
  };

  // Stocker en mémoire
  if (!pendingNotifications.has(userId)) {
    pendingNotifications.set(userId, []);
  }
  pendingNotifications.get(userId).push(notification);

  // Auto-nettoyage après 7 jours (les invitations persistent plus longtemps)
  setTimeout(() => {
    deleteNotification(userId, notification.id);
  }, 7 * 24 * 60 * 60 * 1000);

  // ✅ ENVOYER AU SERVEUR YJS VIA WEBSOCKET (même pattern que les autres notifications)
  const sent = await sendNotificationToUser(userId, notification);
  
  console.log(`✅ [YJS NOTIF] INVITATION envoyée au serveur YJS pour user=${userId}, sent=${sent}`);
  return notification;
}

/**
 * 🔔 Notifie tous les collaborateurs qu'une note a été supprimée
 * Distingue les admins (NOTE_DELETED_ADMIN) des simples membres (NOTE_DELETED_MEMBER)
 * 
 * @param {string} noteId - ID de la note supprimée
 * @param {string} noteTitle - Titre de la note
 * @param {number} actorUserId - ID de l'utilisateur qui a supprimé (à exclure des notifications)
 * @param {string} actorPseudo - Pseudo de l'utilisateur qui a supprimé
 * 
 * @example
 * // Dans noteController.js (deleteNote)
 * const actor = await prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
 * await notifyNoteDeleted(noteId, note.Titre, userId, actor?.pseudo || "Un utilisateur");
 */
export async function notifyNoteDeleted(noteId, noteTitle, actorUserId, actorPseudo = 'Un utilisateur') {
  console.log(`🔔 [NOTIF] Note supprimée: "${noteTitle}" par ${actorPseudo}`);

  try {
    // Récupérer tous les collaborateurs avec leur rôle (sauf celui qui a supprimé)
    const permissions = await prisma.permission.findMany({
      where: { 
        noteId,
        userId: { not: actorUserId }
      },
      select: { userId: true, role: true },
    });

    // Créer une notification pour chaque collaborateur
    const notifications = [];
    for (const perm of permissions) {
      // Admins (rôle 0-1) reçoivent NOTE_DELETED_ADMIN, les autres NOTE_DELETED_MEMBER
      const notifType = perm.role <= 1 
        ? NotificationType.NOTE_DELETED_ADMIN 
        : NotificationType.NOTE_DELETED_MEMBER;
      
      const notif = createNotification(notifType, perm.userId, {
        noteId,
        noteTitle,
        actorPseudo,
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
  console.log(`🔔 [yjsNotificationService] notifyRoleChanged appelé:`, {
    userId,
    noteId,
    noteTitle,
    oldRole,
    newRole,
    actorPseudo,
    timestamp: new Date().toISOString()
  });
  
  const roleLabel = ROLE_LABELS[newRole] || 'Collaborateur';
  const isPromotion = newRole < oldRole; // Rôles: 0=owner, 1=admin, 2=editor, 3=reader
  
  console.log(`📋 [yjsNotificationService] Détails notification: roleLabel=${roleLabel}, isPromotion=${isPromotion}`);
  
  const result = await createNotification(NotificationType.ROLE_CHANGED, userId, {
    noteId,
    noteTitle,
    actorPseudo,
    roleLabel,
    isPromotion,
  });
  
  console.log(`✅ [yjsNotificationService] notifyRoleChanged terminé, notification créée:`, result.id);
  return result;
}

/**
 * 🔔 Notifie les admins/propriétaires qu'un utilisateur a été invité sur leur note
 * (Seulement pour les invitations "directes", pas via lien public)
 * 
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {string} invitedUserPseudo - Pseudo de l'utilisateur invité
 * @param {number} invitedRole - Rôle attribué à l'invité (0-3)
 * @param {number} actorUserId - ID de celui qui invite (pour ne pas le notifier)
 * @param {string} actorPseudo - Pseudo de celui qui invite
 * 
 * @example
 * // Dans permissionController.js (AddPermission)
 * await notifySomeoneInvited(noteId, note.Titre, targetUser.pseudo, targetRole, req.session.userId, inviter.pseudo);
 */
export async function notifySomeoneInvited(noteId, noteTitle, invitedUserPseudo, invitedRole, actorUserId, actorPseudo) {
  console.log(`🔔 [NOTIF] Quelqu'un invité: ${invitedUserPseudo} sur "${noteTitle}" par ${actorPseudo}`);

  try {
    // Récupérer les admins/propriétaires de la note (rôle 0-1) sauf celui qui invite
    const admins = await prisma.permission.findMany({
      where: {
        noteId,
        role: { in: [0, 1] },
        userId: { not: actorUserId },
      },
      select: { userId: true },
    });

    const roleLabel = ROLE_LABELS[invitedRole] || 'Collaborateur';
    const notifications = [];

    for (const admin of admins) {
      const notif = createNotification(NotificationType.SOMEONE_INVITED, admin.userId, {
        noteId,
        noteTitle,
        invitedUserPseudo,
        roleLabel,
        actorPseudo,
      });
      notifications.push(notif);
    }

    console.log(`✅ [NOTIF] ${notifications.length} notifications SOMEONE_INVITED diffusées`);
    return notifications;

  } catch (error) {
    console.error('[notifySomeoneInvited] Erreur:', error);
    return [];
  }
}

/**
 * 🔔 Notifie les admins/propriétaires qu'un collaborateur a été exclu de leur note
 * 
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {string} removedUserPseudo - Pseudo de l'utilisateur exclu
 * @param {number} actorUserId - ID de celui qui exclut (pour ne pas le notifier)
 * @param {string} actorPseudo - Pseudo de celui qui exclut
 * 
 * @example
 * // Dans permissionController.js (RemovePermission)
 * await notifyCollaboratorRemoved(noteId, note.Titre, removedUser.pseudo, req.session.userId, actor.pseudo);
 */
export async function notifyCollaboratorRemoved(noteId, noteTitle, removedUserPseudo, actorUserId, actorPseudo) {
  console.log(`🔔 [NOTIF] Collaborateur exclu: ${removedUserPseudo} de "${noteTitle}" par ${actorPseudo}`);

  try {
    // Récupérer les admins/propriétaires de la note (rôle 0-1) sauf celui qui exclut
    const admins = await prisma.permission.findMany({
      where: {
        noteId,
        role: { in: [0, 1] },
        userId: { not: actorUserId },
      },
      select: { userId: true },
    });

    const notifications = [];

    for (const admin of admins) {
      const notif = createNotification(NotificationType.COLLABORATOR_REMOVED, admin.userId, {
        noteId,
        noteTitle,
        removedUserPseudo,
        actorPseudo,
      });
      notifications.push(notif);
    }

    console.log(`✅ [NOTIF] ${notifications.length} notifications COLLABORATOR_REMOVED diffusées`);
    return notifications;

  } catch (error) {
    console.error('[notifyCollaboratorRemoved] Erreur:', error);
    return [];
  }
}

/**
 * 🔔 Notifie les admins/propriétaires qu'un utilisateur a quitté leur note
 * ⚠️ Désactivé sur les notes publiques
 * 
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {string} leavingUserPseudo - Pseudo de l'utilisateur qui quitte
 * @param {number} leavingUserId - ID de l'utilisateur qui quitte (pour ne pas le notifier)
 * @param {boolean} isPublic - Si true, ne pas envoyer de notification
 * 
 * @example
 * // Dans noteController.js (leaveNote)
 * const note = await prisma.note.findUnique({ where: { id }, select: { Titre: true, isPublic: true } });
 * await notifyUserLeft(id, note.Titre, user.pseudo, userId, note.isPublic);
 */
export async function notifyUserLeft(noteId, noteTitle, leavingUserPseudo, leavingUserId, isPublic = false) {
  // Ne pas notifier sur les notes publiques
  if (isPublic) {
    console.log(`⏭️ [NOTIF] USER_LEFT ignoré: note "${noteTitle}" est publique`);
    return [];
  }

  console.log(`🔔 [NOTIF] Utilisateur parti: ${leavingUserPseudo} a quitté "${noteTitle}"`);

  try {
    // Récupérer les admins/propriétaires de la note (rôle 0-1)
    const admins = await prisma.permission.findMany({
      where: {
        noteId,
        role: { in: [0, 1] },
        userId: { not: leavingUserId },
      },
      select: { userId: true },
    });

    const notifications = [];

    for (const admin of admins) {
      const notif = createNotification(NotificationType.USER_LEFT, admin.userId, {
        noteId,
        noteTitle,
        leavingUserPseudo,
      });
      notifications.push(notif);
    }

    console.log(`✅ [NOTIF] ${notifications.length} notifications USER_LEFT diffusées`);
    return notifications;

  } catch (error) {
    console.error('[notifyUserLeft] Erreur:', error);
    return [];
  }
}

/**
 * 🔔 Notifie les collaborateurs qu'un commentaire a été ajouté
 * ⚠️ Désactivé sur les notes publiques
 * 
 * @param {string} noteId - ID de la note
 * @param {string} noteTitle - Titre de la note
 * @param {string} commentAuthorPseudo - Pseudo de l'auteur du commentaire
 * @param {number} commentAuthorId - ID de l'auteur (pour ne pas le notifier)
 * @param {string} commentPreview - Aperçu du commentaire (premiers caractères)
 * @param {boolean} isPublic - Si true, ne pas envoyer de notification
 * 
 * @example
 * // Dans commentController.js (addComment) - à implémenter
 * await notifyCommentAdded(noteId, note.Titre, user.pseudo, userId, comment.text.slice(0, 50), note.isPublic);
 */
export async function notifyCommentAdded(noteId, noteTitle, commentAuthorPseudo, commentAuthorId, commentPreview, isPublic = false) {
  // Ne pas notifier sur les notes publiques
  if (isPublic) {
    console.log(`⏭️ [NOTIF] COMMENT_ADDED ignoré: note "${noteTitle}" est publique`);
    return [];
  }

  console.log(`🔔 [NOTIF] Commentaire ajouté sur "${noteTitle}" par ${commentAuthorPseudo}`);

  try {
    // Récupérer tous les collaborateurs sauf l'auteur du commentaire
    const collaborators = await prisma.permission.findMany({
      where: {
        noteId,
        userId: { not: commentAuthorId },
      },
      select: { userId: true },
    });

    const notifications = [];

    for (const collab of collaborators) {
      const notif = createNotification(NotificationType.COMMENT_ADDED, collab.userId, {
        noteId,
        noteTitle,
        commentAuthorPseudo,
        commentPreview,
      });
      notifications.push(notif);
    }

    console.log(`✅ [NOTIF] ${notifications.length} notifications COMMENT_ADDED diffusées`);
    return notifications;

  } catch (error) {
    console.error('[notifyCommentAdded] Erreur:', error);
    return [];
  }
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
