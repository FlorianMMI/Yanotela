/**
 * 🔥 Contrôleur Yjs - Gestion de la persistence des documents Yjs
 * 
 * Ce contrôleur gère la sauvegarde et le chargement des états Yjs en base de données.
 * Il permet de persister les documents collaboratifs et de les restaurer au besoin.
 */

import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';

const prisma = new PrismaClient();

/**
 * Sauvegarder l'état Yjs d'une note en base de données
 * 
 * @param {string} noteId - ID de la note
 * @param {Buffer} yjsStateBuffer - État Yjs encodé (Bytes)
 * @returns {Promise<boolean>} - Success
 */
export async function saveYjsState(noteId, yjsStateBuffer) {
  try {
    console.log(`[YJS Controller] 💾 Sauvegarde état Yjs pour note: ${noteId} (${yjsStateBuffer.length} bytes)`);

    await prisma.note.update({
      where: { id: noteId },
      data: { yjsState: yjsStateBuffer }
    });

    console.log(`[YJS Controller] ✅ État Yjs sauvegardé avec succès`);
    return true;
  } catch (error) {
    console.error(`[YJS Controller] ❌ Erreur sauvegarde Yjs:`, error);
    return false;
  }
}

/**
 * Charger l'état Yjs d'une note depuis la base de données
 * 
 * @param {string} noteId - ID de la note
 * @returns {Promise<Buffer|null>} - État Yjs encodé ou null si absent
 */
export async function loadYjsState(noteId) {
  try {
    console.log(`[YJS Controller] 📂 Chargement état Yjs pour note: ${noteId}`);

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { yjsState: true, Content: true }
    });

    if (!note) {
      console.log(`[YJS Controller] ⚠️ Note introuvable: ${noteId}`);
      return null;
    }

    if (note.yjsState && note.yjsState.length > 0) {
      console.log(`[YJS Controller] ✅ État Yjs chargé (${note.yjsState.length} bytes)`);
      return note.yjsState;
    }

    // Si pas d'état Yjs, migrer depuis Content
    if (note.Content) {
      console.log(`[YJS Controller] 🔄 Migration du contenu vers Yjs`);
      const yjsState = await migrateContentToYjs(noteId, note.Content);
      return yjsState;
    }

    console.log(`[YJS Controller] ℹ️ Aucun contenu pour note: ${noteId}`);
    return null;
  } catch (error) {
    console.error(`[YJS Controller] ❌ Erreur chargement Yjs:`, error);
    return null;
  }
}

/**
 * Fusionner un update Yjs dans l'état existant
 * 
 * @param {string} noteId - ID de la note
 * @param {Uint8Array} updateBuffer - Update Yjs à fusionner
 * @returns {Promise<boolean>} - Success
 */
export async function mergeYjsUpdate(noteId, updateBuffer) {
  try {
    console.log(`[YJS Controller] 🔀 Fusion update Yjs pour note: ${noteId}`);

    // Charger l'état actuel
    const currentState = await loadYjsState(noteId);
    
    // Créer un Y.Doc et appliquer l'état actuel
    const ydoc = new Y.Doc();
    
    if (currentState) {
      Y.applyUpdate(ydoc, currentState);
    }
    
    // Appliquer le nouvel update
    Y.applyUpdate(ydoc, updateBuffer);
    
    // Encoder le nouvel état
    const newState = Y.encodeStateAsUpdate(ydoc);
    
    // Sauvegarder
    await saveYjsState(noteId, Buffer.from(newState));
    
    console.log(`[YJS Controller] ✅ Update fusionné avec succès`);
    return true;
  } catch (error) {
    console.error(`[YJS Controller] ❌ Erreur fusion update:`, error);
    return false;
  }
}

/**
 * Migrer le contenu d'une note (Content string) vers Yjs
 * 
 * @param {string} noteId - ID de la note
 * @param {string} content - Contenu texte ou JSON Lexical
 * @returns {Promise<Buffer|null>} - État Yjs encodé
 */
export async function migrateContentToYjs(noteId, content) {
  try {
    console.log(`[YJS Controller] 🔄 Migration contenu vers Yjs pour note: ${noteId}`);

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');

    // Essayer de parser comme JSON Lexical
    try {
      const parsed = JSON.parse(content);
      const text = extractTextFromLexical(parsed);
      ytext.insert(0, text);
      console.log(`[YJS Controller] ✅ Contenu Lexical migré (${text.length} chars)`);
    } catch {
      // Sinon insérer comme texte brut
      ytext.insert(0, content);
      console.log(`[YJS Controller] ✅ Contenu texte migré (${content.length} chars)`);
    }

    // Encoder l'état Yjs
    const yjsState = Y.encodeStateAsUpdate(ydoc);
    
    // Sauvegarder en DB
    await saveYjsState(noteId, Buffer.from(yjsState));

    return Buffer.from(yjsState);
  } catch (error) {
    console.error(`[YJS Controller] ❌ Erreur migration:`, error);
    return null;
  }
}

/**
 * Extraire le texte brut d'un état Lexical JSON
 * 
 * @param {object} state - État Lexical
 * @returns {string} - Texte brut
 */
function extractTextFromLexical(state) {
  let text = '';
  
  function traverse(node) {
    if (node.text) {
      text += node.text;
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  if (state.root && state.root.children) {
    state.root.children.forEach(traverse);
  }

  return text;
}

/**
 * Calculer le diff entre l'état serveur et un state vector client
 * 
 * @param {string} noteId - ID de la note
 * @param {Uint8Array} clientStateVector - State vector du client
 * @returns {Promise<Uint8Array|null>} - Update contenant les différences
 */
export async function computeDiff(noteId, clientStateVector) {
  try {
    const serverState = await loadYjsState(noteId);
    
    if (!serverState) {
      return null;
    }

    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, serverState);
    
    // Calculer le diff
    const diff = Y.encodeStateAsUpdate(ydoc, clientStateVector);
    
    console.log(`[YJS Controller] ✅ Diff calculé: ${diff.length} bytes`);
    return diff;
  } catch (error) {
    console.error(`[YJS Controller] ❌ Erreur calcul diff:`, error);
    return null;
  }
}

export default {
  saveYjsState,
  loadYjsState,
  mergeYjsUpdate,
  migrateContentToYjs,
  computeDiff
};
