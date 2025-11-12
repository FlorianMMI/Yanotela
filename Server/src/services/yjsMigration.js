/**
 * 🔄 Service de migration YJS
 * 
 * Convertit les anciennes notes (Content = Lexical JSON string)
 * vers le nouveau format YJS (yjsState = Uint8Array binaire)
 * 
 * Migration à la volée: déclenchée lors du getNoteById
 */

import * as Y from 'yjs';

/**
 * Extraire le texte brut d'un JSON Lexical
 * Parcourt récursivement l'arbre pour extraire tout le texte
 * 
 * @param {Object} node - Nœud Lexical (root, paragraph, text...)
 * @returns {string} - Texte brut
 */
function extractTextFromLexicalNode(node) {
  if (!node) return '';

  // Si c'est un nœud texte, retourner directement
  if (node.type === 'text' && node.text) {
    return node.text;
  }

  // Si c'est un nœud avec enfants, parcourir récursivement
  if (node.children && Array.isArray(node.children)) {
    return node.children
      .map(child => extractTextFromLexicalNode(child))
      .join('');
  }

  // Si c'est le root node
  if (node.root && node.root.children) {
    return extractTextFromLexicalNode(node.root);
  }

  return '';
}

/**
 * Migrer le contenu JSON Lexical vers YJS state
 * 
 * @param {string} lexicalJSON - Contenu brut (JSON stringifié de Lexical)
 * @returns {Buffer|null} - État YJS encodé en Buffer, ou null si erreur
 */
export function migrateContentToYjs(lexicalJSON) {
  try {

    // 1. Parser le JSON Lexical
    let parsedContent;
    try {
      parsedContent = JSON.parse(lexicalJSON);
    } catch (parseError) {
      console.error('❌ [YJS Migration] JSON invalide:', parseError);
      return null;
    }

    // 2. Extraire le texte brut
    const plainText = extractTextFromLexicalNode(parsedContent);
    
    if (!plainText || plainText.trim() === '') {
      console.warn('⚠️ [YJS Migration] Contenu vide après extraction');
      return null;
    }

    console.log(`📝 [YJS Migration] Texte extrait (${plainText.length} chars): ${plainText.substring(0, 100)}...`);

    // 3. Créer un nouveau document YJS
    const ydoc = new Y.Doc();
    
    // CRITICAL: Utiliser la même structure que CollaborationPlugin
    // Le plugin Lexical attend une YXmlText dans une YMap 'root'
    const yXmlText = ydoc.get('root', Y.XmlText);
    
    // Insérer le texte brut dans YJS
    yXmlText.insert(0, plainText);

    // 4. Encoder en binaire
    const yjsState = Y.encodeStateAsUpdate(ydoc);

    return Buffer.from(yjsState);
  } catch (error) {
    console.error('❌ [YJS Migration] Erreur fatale:', error);
    return null;
  }
}

/**
 * Vérifier si une note nécessite une migration
 * 
 * @param {Object} note - Note Prisma (avec Content et yjsState)
 * @returns {boolean} - true si migration nécessaire
 */
export function needsMigration(note) {
  // Besoin de migration si:
  // - yjsState est vide/null
  // - Content existe et n'est pas vide
  return (!note.yjsState || note.yjsState.length === 0) && 
         note.Content && 
         note.Content.trim() !== '';
}

/**
 * Extraire le contenu Lexical JSON depuis un yjsState
 * Utilisé pour sérialiser yjsState → Content lors des sauvegardes
 * 
 * @param {Buffer|Uint8Array} yjsState - État YJS encodé
 * @returns {string|null} - JSON Lexical stringifié, ou null si erreur
 */
export function extractContentFromYjs(yjsState) {
  try {
    if (!yjsState) {
      console.warn('⚠️ [YJS Extract] yjsState vide');
      return null;
    }

    // 1. Créer un nouveau document YJS
    const ydoc = new Y.Doc();
    
    // 2. Appliquer l'état binaire
    const stateBuffer = Buffer.isBuffer(yjsState) ? yjsState : Buffer.from(yjsState);
    Y.applyUpdate(ydoc, new Uint8Array(stateBuffer));

    // 3. Récupérer le YXmlText (même structure que CollaborationPlugin)
    const yXmlText = ydoc.get('root', Y.XmlText);
    
    // 4. Extraire le texte brut
    const plainText = yXmlText.toString();
    
    if (!plainText || plainText.trim() === '') {
      console.warn('⚠️ [YJS Extract] Contenu vide');
      // Retourner un document Lexical vide valide
      return JSON.stringify({
        root: {
          children: [],
          direction: null,
          format: "",
          indent: 0,
          type: "root",
          version: 1
        }
      });
    }

    console.log(`📝 [YJS Extract] Texte extrait (${plainText.length} chars): ${plainText.substring(0, 100)}...`);

    // 5. Reconstruire un JSON Lexical depuis le texte brut
    const lexicalJSON = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: plainText,
                type: "text",
                version: 1
              }
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1
          }
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1
      }
    };

    return JSON.stringify(lexicalJSON);
  } catch (error) {
    console.error('❌ [YJS Extract] Erreur:', error);
    return null;
  }
}
