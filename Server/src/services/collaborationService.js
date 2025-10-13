import * as Y from 'yjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Stockage des documents Yjs actifs en mémoire
// Map<noteId, Y.Doc>
const activeDocuments = new Map();

// Map<noteId, Set<socketId>> - Pour tracker les utilisateurs par note
const activeUsers = new Map();

// Intervalle de sauvegarde automatique (en ms) - 3 secondes
const AUTO_SAVE_INTERVAL = 3000;

// Map<noteId, timeoutId> - Pour gérer les sauvegardes différées
const savePending = new Map();

/**
 * Obtenir ou créer un document Yjs pour une note
 * @param {string} noteId - ID de la note
 * @param {string} initialContent - Contenu initial depuis la base de données
 * @returns {Y.Doc} Document Yjs
 */
export function getOrCreateYDoc(noteId, initialContent = null) {
  if (activeDocuments.has(noteId)) {
    return activeDocuments.get(noteId);
  }

  const doc = new Y.Doc();
  const yText = doc.getText('content');

  // ✅ Si on a du contenu initial, l'appliquer
  if (initialContent) {
    // D'abord vérifier si c'est du base64 Yjs (anciennes notes)
    // Le base64 Yjs commence généralement par des caractères spécifiques
    const looksLikeBase64Yjs = /^[A-Za-z0-9+/=]{50,}$/.test(initialContent.substring(0, 100));
    
    if (looksLikeBase64Yjs) {
      try {
        // Essayer de décoder depuis base64 (format binaire Yjs - anciennes notes)
        const binary = Buffer.from(initialContent, 'base64');
        Y.applyUpdate(doc, binary);
        
        // ✅ CORRECTION: Après avoir chargé du base64, sauvegarder en texte brut
        const textContent = yText.toString();
        // La prochaine sauvegarde sera en texte brut grâce à saveYDocToDatabase
      } catch (e) {
        // Si ça échoue, traiter comme du texte
        yText.insert(0, initialContent);
      }
    } else {
      // Sinon, traiter comme du texte brut ou JSON
      try {
        const parsed = JSON.parse(initialContent);
        // Si c'est un EditorState Lexical, extraire le texte
        if (parsed.root && parsed.root.children) {
          const text = extractTextFromLexical(parsed);
          yText.insert(0, text);
        } else {
          yText.insert(0, initialContent);
        }
      } catch {
        // Si ce n'est pas du JSON, insérer comme texte brut
        yText.insert(0, initialContent);
      }
    }
  }

  // Écouter les mises à jour pour déclencher les sauvegardes
  doc.on('update', () => {
    scheduleSave(noteId, doc);
  });

  activeDocuments.set(noteId, doc);
  
  return doc;
}

/**
 * Extraire le texte d'un EditorState Lexical
 * @param {object} lexicalState - État de l'éditeur Lexical
 * @returns {string} Texte extrait
 */
function extractTextFromLexical(lexicalState) {
  let text = '';
  
  function traverse(node) {
    if (node.type === 'text') {
      text += node.text || '';
    }
    if (node.children) {
      node.children.forEach(traverse);
      // Ajouter un retour à la ligne après chaque paragraphe
      if (node.type === 'paragraph') {
        text += '\n';
      }
    }
  }
  
  if (lexicalState.root) {
    traverse(lexicalState.root);
  }
  
  return text.trim();
}

/**
 * Planifier une sauvegarde différée du document
 * @param {string} noteId - ID de la note
 * @param {Y.Doc} doc - Document Yjs
 */
function scheduleSave(noteId, doc) {
  // Annuler la sauvegarde précédente si elle existe
  if (savePending.has(noteId)) {
    clearTimeout(savePending.get(noteId));
  }

  // Planifier une nouvelle sauvegarde dans 5 secondes
  const timeoutId = setTimeout(() => {
    saveYDocToDatabase(noteId, doc);
    savePending.delete(noteId);
  }, 5000);

  savePending.set(noteId, timeoutId);
}

/**
 * Sauvegarder le document Yjs dans la base de données
 * @param {string} noteId - ID de la note
 * @param {Y.Doc} doc - Document Yjs
 */
export async function saveYDocToDatabase(noteId, doc) {
  try {
    // ✅ CORRECTION CRITIQUE : Extraire le TEXTE du document Yjs, pas l'état binaire
    const yText = doc.getText('content');
    const textContent = yText.toString();

    // Sauvegarder le texte brut dans Prisma
    await prisma.note.update({
      where: { id: noteId },
      data: { 
        Content: textContent, // ✅ Sauvegarder le texte, pas le binaire
        ModifiedAt: new Date()
      }
    });

  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde de la note ${noteId}:`, error);
  }
}

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
async function cleanupNote(noteId) {
  // Vérifier qu'il n'y a toujours personne
  if (activeUsers.has(noteId) && activeUsers.get(noteId).size > 0) {
    return;
  }

  // Sauvegarder une dernière fois avant de nettoyer
  if (activeDocuments.has(noteId)) {
    const doc = activeDocuments.get(noteId);
    await saveYDocToDatabase(noteId, doc);
    
    // Nettoyer le document
    doc.destroy();
    activeDocuments.delete(noteId);
  }

  // Nettoyer les utilisateurs
  activeUsers.delete(noteId);
  
  // Annuler toute sauvegarde en attente
  if (savePending.has(noteId)) {
    clearTimeout(savePending.get(noteId));
    savePending.delete(noteId);
  }

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
 * Obtenir tous les documents actifs (pour monitoring)
 * @returns {Array} Liste des notes actives
 */
export function getActiveDocuments() {
  return Array.from(activeDocuments.keys()).map(noteId => ({
    noteId,
    userCount: getActiveUserCount(noteId)
  }));
}

/**
 * Forcer la sauvegarde de tous les documents actifs
 */
export async function saveAllDocuments() {
  const promises = [];
  
  for (const [noteId, doc] of activeDocuments.entries()) {
    promises.push(saveYDocToDatabase(noteId, doc));
  }
  
  await Promise.all(promises);
}

// Sauvegarde automatique périodique
setInterval(() => {
  if (activeDocuments.size > 0) {
    saveAllDocuments();
  }
}, AUTO_SAVE_INTERVAL);

// Nettoyage à l'arrêt du serveur
process.on('SIGINT', async () => {
  await saveAllDocuments();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await saveAllDocuments();
  await prisma.$disconnect();
  process.exit(0);
});
