/**
 * 💾 AutoSavePlugin
 * 
 * Plugin Lexical qui sauvegarde automatiquement le contenu en base de données.
 * Fonctionne avec le CollaborationPlugin de Lexical + YJS.
 * 
 * FONCTIONNALITÉS :
 * - ✅ Sauvegarde debounced (évite trop de requêtes HTTP)
 * - ✅ Sérialisation complète de l'EditorState (texte, images, formatage)
 * - ✅ Gestion des erreurs réseau
 * - ✅ Indicateur visuel de sauvegarde
 * 
 * INTÉGRATION :
 * ```tsx
 * <LexicalComposer initialConfig={{...}}>
 *   <AutoSavePlugin noteId={noteId} debounceMs={2000} />
 *   <RichTextPlugin ... />
 * </LexicalComposer>
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EditorState } from 'lexical';
import { SaveNote } from '@/loader/loader';

interface AutoSavePluginProps {
  /** ID de la note à sauvegarder */
  noteId: string;
  /** Délai de debounce en millisecondes (défaut: 2000ms) */
  debounceMs?: number;
  /** Mode lecture seule */
  isReadOnly?: boolean;
  /** Callback après sauvegarde réussie */
  onSaveSuccess?: () => void;
  /** Callback en cas d'erreur */
  onSaveError?: (error: Error) => void;
}

/**
 * Plugin de sauvegarde automatique pour Lexical
 * 
 * Écoute les changements de l'éditeur et sauvegarde en BDD après un délai.
 * Ignore les updates provenant de YJS (tag 'collaboration' ou 'yjs-sync').
 */
export function AutoSavePlugin({
  noteId,
  debounceMs = 2000,
  isReadOnly = false,
  onSaveSuccess,
  onSaveError,
}: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Sauvegarder le contenu en base de données
   */
  const saveContent = useCallback(async (editorState: EditorState) => {
    if (isReadOnly) return;

    try {
      // Sérialiser l'EditorState complet (inclut texte, images, formatage, etc.)
      const contentJSON = editorState.toJSON();
      const contentString = JSON.stringify(contentJSON);

      // Appel API pour sauvegarder
      const success = await SaveNote(noteId, {
        Content: contentString,
      });

      if (success) {
        
        onSaveSuccess?.();
      } else {
        throw new Error('Échec de la sauvegarde');
      }
    } catch (error) {
      console.error(`❌ [AutoSave] Erreur sauvegarde pour note ${noteId}:`, error);
      onSaveError?.(error as Error);
    }
  }, [noteId, isReadOnly, onSaveSuccess, onSaveError]);

  /**
   * Écouter les changements de l'éditeur
   */
  useEffect(() => {
    if (isReadOnly) return;

    const removeListener = editor.registerUpdateListener(({ editorState, tags }: { editorState: EditorState; tags: Set<string> }) => {
      // Ignorer les updates provenant de la collaboration YJS
      // (ces updates sont déjà synchronisés, pas besoin de sauvegarder)
      if (tags.has('collaboration') || tags.has('yjs-sync') || tags.has('historic')) {
        console.log(`⏭️ [AutoSave] Update ignoré (tag: ${Array.from(tags).join(', ')})`);
        return;
      }

      // Ignorer les updates de restauration de sélection
      if (tags.has('restore-selection')) {
        return;
      }

      // Annuler le timer précédent
      if (saveTimer) {
        clearTimeout(saveTimer);
      }

      // Programmer une nouvelle sauvegarde après le délai
      const timer = setTimeout(() => {
        saveContent(editorState);
      }, debounceMs);

      setSaveTimer(timer);
    });

    // Cleanup
    return () => {
      
      removeListener();
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [editor, noteId, debounceMs, isReadOnly, saveTimer, saveContent]);

  // Sauvegarder une dernière fois avant le unmount
  useEffect(() => {
    return () => {
      if (!isReadOnly && saveTimer) {
        // Forcer une sauvegarde immédiate
        editor.getEditorState().read(() => {
          saveContent(editor.getEditorState());
        });
      }
    };
  }, [editor, isReadOnly, saveTimer, saveContent]);

  // Ce plugin ne rend rien dans le DOM
  return null;
}

export default AutoSavePlugin;
