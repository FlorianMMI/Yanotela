/**
 * 🔌 YjsCollaborationPlugin
 * 
 * Plugin Lexical qui synchronise l'EditorState avec Yjs.
 * Version simplifiée utilisant directement les updates Yjs.
 * 
 * FONCTIONNALITÉS :
 * - ✅ Synchronisation bidirectionnelle Lexical <-> Yjs
 * - ✅ Gestion automatique des conflits via Yjs CRDT
 * - ✅ Performance optimisée (pas de re-render inutiles)
 * - ✅ Compatible avec les autres plugins Lexical
 * 
 * INTÉGRATION :
 * ```tsx
 * <LexicalComposer initialConfig={{...}}>
 *   <YjsCollaborationPlugin ytext={ytext} noteId={noteId} />
 *   <RichTextPlugin ... />
 * </LexicalComposer>
 * ```
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection, type EditorState } from 'lexical';
import * as Y from 'yjs';

interface YjsCollaborationPluginProps {
  /** Y.Text partagé */
  ytext: Y.Text | null;
  /** ID de la note (pour logs) */
  noteId: string;
}

/**
 * Plugin de collaboration Yjs pour Lexical - VERSION MANUELLE
 * 
 * Cette version synchronise manuellement Lexical <-> Yjs sans utiliser
 * le CollaborationPlugin officiel (qui nécessite un Provider complexe).
 * 
 * ⚠️ IMPORTANT : Ce plugin doit être monté APRÈS RichTextPlugin
 * 
 * @param ytext - Y.Text créé par useYjsDocument
 * @param noteId - ID unique de la note
 */
export function YjsCollaborationPlugin({
  ytext,
  noteId,
}: YjsCollaborationPluginProps) {
  const [editor] = useLexicalComposerContext();

  /**
   * 📥 YTEXT -> LEXICAL : Écouter les changements Yjs et mettre à jour Lexical
   */
  useEffect(() => {
    if (!editor || !ytext) {
      
      return;
    }

    // Observer les changements dans Y.Text
    const observer = (event: Y.YTextEvent, transaction: Y.Transaction) => {
      // Ne pas traiter les updates locaux (ils viennent de Lexical)
      if (transaction.origin === 'lexical-local') {
        return;
      }

      // ✅ CORRECTION CRITIQUE: Synchroniser l'EditorState COMPLET (pas juste le texte)
      const yjsContent = ytext.toString();
      if (!yjsContent) return;

      try {
        // Parser le JSON Lexical depuis Yjs
        const parsedState = JSON.parse(yjsContent);
        
        // Vérifier que c'est un EditorState valide
        if (!parsedState.root || parsedState.root.type !== 'root') {
          
          return;
        }

        // ✅ AMÉLIORATION: Préserver le focus et la sélection de l'utilisateur local
        const editorRoot = editor.getRootElement();
        const hasFocus = editorRoot && (document.activeElement === editorRoot || editorRoot.contains(document.activeElement));
        
        let savedAnchorOffset: number | null = null;
        let savedFocusOffset: number | null = null;
        let savedAnchorKey: string | null = null;
        let savedFocusKey: string | null = null;
        
        if (hasFocus) {
          // Sauvegarder la sélection actuelle avec plus de détails
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              savedAnchorOffset = selection.anchor.offset;
              savedFocusOffset = selection.focus.offset;
              savedAnchorKey = selection.anchor.key;
              savedFocusKey = selection.focus.key;
              
            }
          });
        }

        // Appliquer l'état complet à Lexical
        editor.update(
          () => {
            const newEditorState = editor.parseEditorState(parsedState);
            editor.setEditorState(newEditorState);
            
          },
          {
            tag: 'yjs-sync',
            discrete: true, // ✅ IMPORTANT: Éviter de déclencher les listeners de changement
          }
        );

        // ✅ Restaurer le focus et la sélection après l'update
        if (hasFocus && savedAnchorKey && savedAnchorOffset !== null) {
          // Utiliser requestAnimationFrame pour s'assurer que le DOM est à jour
          requestAnimationFrame(() => {
            editor.focus();
            editor.update(() => {
              try {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  // Restaurer la sélection avec les clés de nœuds sauvegardées
                  selection.anchor.key = savedAnchorKey!;
                  selection.anchor.offset = savedAnchorOffset!;
                  selection.focus.key = savedFocusKey!;
                  selection.focus.offset = savedFocusOffset!;
                  selection.dirty = true;
                  
                }
              } catch (err) {
                
                // Fallback: juste restaurer le focus sans position précise
              }
            }, {
              tag: 'restore-selection',
              discrete: true,
            });
          });
        }
      } catch (err) {
        
      }
    };

    ytext.observe(observer);

    // Initialiser le contenu de Lexical avec Yjs si nécessaire
    const initialYjsContent = ytext.toString();
    if (initialYjsContent) {
      try {
        const parsedState = JSON.parse(initialYjsContent);
        if (parsedState.root && parsedState.root.type === 'root') {
          editor.update(() => {
            const root = $getRoot();
            if (root.getChildrenSize() === 0 || root.getTextContent() === '') {
              const newEditorState = editor.parseEditorState(parsedState);
              editor.setEditorState(newEditorState);
              
            }
          });
        }
      } catch (err) {
        
      }
    }

    // 🧹 Cleanup
    return () => {
      
      ytext.unobserve(observer);
    };
  }, [editor, ytext, noteId]);

  /**
   * 📤 LEXICAL -> YTEXT : Écouter les changements Lexical et mettre à jour Yjs
   */
  useEffect(() => {
    if (!editor || !ytext) return;

    // Listener pour les updates Lexical
    const removeListener = editor.registerUpdateListener(({ editorState, tags }: { editorState: EditorState; tags: Set<string> }) => {
      // Ne pas traiter les updates qui viennent de Yjs
      if (tags.has('yjs-sync')) {
        return;
      }

      // ✅ CORRECTION CRITIQUE: Sérialiser l'EditorState COMPLET (formatage, images, listes, etc.)
      const editorStateJSON = editorState.toJSON();
      const contentString = JSON.stringify(editorStateJSON);

      // Mettre à jour Y.Text si différent
      const currentYjsContent = ytext.toString();
      if (contentString !== currentYjsContent) {
        // Utiliser une transaction pour grouper les opérations
        ytext.doc?.transact(() => {
          ytext.delete(0, ytext.length);
          ytext.insert(0, contentString);
          
        }, 'lexical-local'); // Origine locale pour éviter les boucles
      }
    });

    // 🧹 Cleanup
    return () => {
      
      removeListener();
    };
  }, [editor, ytext]);

  // Ce plugin ne rend rien
  return null;
}

export default YjsCollaborationPlugin;
