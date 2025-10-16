// Service de collaboration simplifié - Gère uniquement le tracking des utilisateurs
// Le contenu JSON Lexical est géré directement via WebSocket dans app.js

// Map<noteId, Set<socketId>> - Pour tracker les utilisateurs par note
const activeUsers = new Map();

/**
 * ✅ SIMPLIFIÉ: Plus besoin de Yjs, on gère directement le JSON Lexical
 * Garde juste le tracking des utilisateurs actifs par note
 * @param {string} noteId - ID de la note
 * @returns {object} Informations sur la note active
 */
export function getOrCreateNoteSession(noteId) {
  if (!activeUsers.has(noteId)) {
    activeUsers.set(noteId, new Set());
    console.log(`📝 Session créée pour note ${noteId}`);
  }
  
  return {
    noteId,
    userCount: activeUsers.get(noteId).size
  };
}



/**
 * ✅ SUPPRIMÉ: Plus besoin de ces fonctions Yjs car la sauvegarde 
 * est maintenant gérée directement via WebSocket dans app.js
 * Le JSON Lexical est préservé tel quel dans la base de données
 */

/**
 * Ajouter un utilisateur à une room de note
 * @param {string} noteId - ID de la note
 * @param {string} socketId - ID du socket
 */
export function addUserToNote(noteId, socketId) {
  if (!activeUsers.has(noteId)) {
    activeUsers.set(noteId, new Set());
  }
  activeUsers.get(noteId).add(socketId);
  
  const userCount = activeUsers.get(noteId).size;
  const socketIds = Array.from(activeUsers.get(noteId));
  
  return userCount;
}

/**
 * Retirer un utilisateur d'une room de note
 * @param {string} noteId - ID de la note
 * @param {string} socketId - ID du socket
 */
export function removeUserFromNote(noteId, socketId) {
  if (activeUsers.has(noteId)) {
    activeUsers.get(noteId).delete(socketId);
    
    const userCount = activeUsers.get(noteId).size;
    
    // Si plus personne sur la note, nettoyer après un délai
    if (userCount === 0) {
      setTimeout(() => {
        cleanupNote(noteId);
      }, 60000); // Nettoyer après 1 minute d'inactivité
    }
    
    return userCount;
  }
  return 0;
}

/**
 * Nettoyer les ressources d'une note inactive  
 * @param {string} noteId - ID de la note
 */
function cleanupNote(noteId) {
  // Vérifier qu'il n'y a toujours personne
  if (activeUsers.has(noteId) && activeUsers.get(noteId).size > 0) {
    return;
  }

  // Nettoyer les utilisateurs
  activeUsers.delete(noteId);
  console.log(`🧹 Note ${noteId} nettoyée (inactivité)`);
}

/**
 * Obtenir le nombre d'utilisateurs actifs sur une note
 * @param {string} noteId - ID de la note
 * @returns {number} Nombre d'utilisateurs
 */
export function getActiveUserCount(noteId) {
  if (activeUsers.has(noteId)) {
    return activeUsers.get(noteId).size;
  }
  return 0;
}

/**
 * Obtenir toutes les sessions actives (pour monitoring)
 * @returns {Array} Liste des notes actives
 */
export function getActiveSessions() {
  return Array.from(activeUsers.keys()).map(noteId => ({
    noteId,
    userCount: getActiveUserCount(noteId)
  }));
}
