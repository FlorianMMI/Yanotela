"use client";
import React, { useRef } from "react";
import { $getRoot, EditorState } from "lexical";
import { useEffect, useState, use } from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ReturnButton from "@/ui/returnButton";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDebouncedCallback } from "use-debounce";
import { motion } from "motion/react";

import { useCallback } from "react";
import Icons from '@/ui/Icon';
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter, useSearchParams } from "next/navigation";
import CollaborationPlugin from "@/components/collaboration/CollaborationPlugin";
import { socketService } from "@/services/socketService";

import { GetNoteById, AddNoteToFolder } from "@/loader/loader";
import { SaveNote } from "@/loader/loader";

import ErrorFetch from "@/ui/note/errorFetch";

const theme = {
  // Theme styling goes here
  //...
};

function onError(error: string | Error) {
  console.error(error);
}

function uploadContent(id: string, noteTitle: string, editorContent: string) {
  return SaveNote(id, {
    Titre: noteTitle,
    Content: editorContent,
  });
}

interface NoteEditorProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NoteEditor({ params }: NoteEditorProps) {
  const [noteTitle, setNoteTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [initialEditorState, setInitialEditorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasError, setHasError] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null); // Ajouter le rôle utilisateur
  const [isReadOnly, setIsReadOnly] = useState(false); // Mode lecture seule
  const [lastFetchTime, setLastFetchTime] = useState(0); // Pour forcer le rechargement
  const [userPseudo, setUserPseudo] = useState<string>(""); // Pseudo pour la collaboration
  
  // États pour les notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false); // Pour l'indicateur de sauvegarde du contenu
  const [isTyping, setIsTyping] = useState(false); // Pour détecter quand l'utilisateur tape

  // Unwrap params using React.use()
  const { id } = use(params);

  // Debounced emit pour le titre (synchronisation rapide quasi-instantanée)
  const debouncedTitleEmit = useDebouncedCallback(
    (titre: string) => {
      socketService.emitTitleUpdate(id, titre);
    },
    1000 // 1000ms = synchronisation très rapide, sensation quasi-instantanée
  );

  function updateNoteTitle(newTitle: string) {
    if (isReadOnly) return; // Ne pas sauvegarder si en lecture seule
    
    // Si le titre est vide, utiliser le fallback
    const finalTitle = newTitle.trim() === '' ? 'Titre de la note' : newTitle;
    
    setNoteTitle(finalTitle);
    
    // Émettre via socket (debounced)
    debouncedTitleEmit(finalTitle);
    
    // Émettre un événement pour synchroniser avec le Breadcrumb
    window.dispatchEvent(new CustomEvent('noteTitleUpdated', { 
      detail: { noteId: id, title: finalTitle } 
    }));
  }

  // Callback pour gérer les mises à jour de titre distantes
  const handleRemoteTitleUpdate = useCallback((titre: string) => {
    setNoteTitle(titre);
    // Synchroniser avec le Breadcrumb
    window.dispatchEvent(new CustomEvent('noteTitleUpdated', { 
      detail: { noteId: id, title: titre } 
    }));
  }, [id]);

  // DOM listener fallback: appliquer les updates provenant du socket
  // (moved) DOM listener will be registered after content callback is defined

  // Callback pour gérer les mises à jour de contenu distantes (temps réel)
  const handleRemoteContentUpdate = useCallback((content: string) => {
    if (!editor) return;
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Vérifier si le contenu est vraiment différent pour éviter les boucles
      const currentContent = JSON.stringify(editor.getEditorState().toJSON());
      if (currentContent === content) {
        return; // Pas de changement, ignorer
      }
      
      const newEditorState = editor.parseEditorState(parsedContent);
      
      // Sauvegarder la position du curseur et le focus
      const hasFocus = editor.getRootElement() === document.activeElement || 
                       editor.getRootElement()?.contains(document.activeElement);
      
      let savedSelection: any = null;
      if (hasFocus) {
        editor.getEditorState().read(() => {
          savedSelection = editor.getEditorState()._selection?.clone();
        });
      }
      
      // Appliquer la mise à jour distante
      editor.setEditorState(newEditorState);
      setEditorContent(content);
      
      // Restaurer le focus et la position du curseur si l'utilisateur était en train de taper
      if (hasFocus && savedSelection) {
        // Attendre un tick pour que l'état soit appliqué
        setTimeout(() => {
          editor.focus();
          // Tenter de restaurer la sélection (peut échouer si le contenu a trop changé)
          editor.update(() => {
            try {
              if (savedSelection) {
                savedSelection.dirty = true;
                editor.getEditorState()._selection = savedSelection;
              }
            } catch (e) {
              // Si la restauration échoue, on laisse le curseur à la fin
              console.log('Impossible de restaurer la sélection exacte');
            }
          });
        }, 0);
      }
    } catch (err) {
      console.warn('Impossible de parser le contenu distant:', err);
    }
  }, [editor]);

  // DOM listener fallback: appliquer les updates provenant du socket
  useEffect(() => {
    const onSocketContent = (e: any) => {
      const { noteId: nid, content } = e.detail || {};
      if (!nid || nid !== id) return;
      // Si editor prêt, appliquer via callback sinon buffer via setEditorContent
      if (editor) {
        handleRemoteContentUpdate(content);
      } else {
        console.log('🔔 Buffering content update until editor is ready (note:', id, ')');
        setEditorContent(content);
      }
    };

    const onSocketTitle = (e: any) => {
      const { noteId: nid, titre } = e.detail || {};
      if (!nid || nid !== id) return;
      handleRemoteTitleUpdate(titre);
    };

    window.addEventListener('socketContentUpdate', onSocketContent as EventListener);
    window.addEventListener('socketTitleUpdate', onSocketTitle as EventListener);

    return () => {
      window.removeEventListener('socketContentUpdate', onSocketContent as EventListener);
      window.removeEventListener('socketTitleUpdate', onSocketTitle as EventListener);
    };
  }, [editor, handleRemoteContentUpdate, handleRemoteTitleUpdate, id]);

  // Récupérer les informations utilisateur au chargement
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('http://localhost:3001/user/info', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUserPseudo(userData.pseudo || 'Anonyme');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du pseudo:', error);
      }
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchNote = async () => {
      // Récupération de l'ID depuis les params unwrappés (garder comme string)
      const noteId = id;

      if (noteId) {
        const note = await GetNoteById(noteId);
        if (note && !('error' in note)) {
          setNoteTitle(note.Titre);
          setUserRole((note as any).userRole !== undefined ? (note as any).userRole : null);
          setIsReadOnly((note as any).userRole === 3); // Lecteur = lecture seule
          // Si on a du contenu, on le parse pour l'éditeur
          if (note.Content) {
            try {
              // Vérifier si c'est déjà du JSON valide
              const parsedContent = JSON.parse(note.Content);
              setInitialEditorState(note.Content);
            } catch {
              // Si ce n'est pas du JSON, on crée un état d'éditeur simple avec le texte
              const simpleState = {
                root: {
                  children: [{
                    children: [{
                      detail: 0,
                      format: 0,
                      mode: "normal",
                      style: "",
                      text: note.Content,
                      type: "text",
                      version: 1
                    }],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1
                  }],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "root",
                  version: 1
                }
              };
              setInitialEditorState(JSON.stringify(simpleState));
            }
          }
          setEditorContent(note.Content || "");
        }
        else {
          setHasError(true);
        }
      }
      setIsLoading(false);
    };

    fetchNote();
  }, [id, lastFetchTime]); // Ajouter lastFetchTime comme dépendance

  // Gestion de l'association automatique au dossier via le paramètre folderId
  useEffect(() => {
    const folderId = searchParams.get('folderId');
    if (folderId && !isLoading) {
      // Associer automatiquement la note au dossier
      const associateToFolder = async () => {
        try {
          const result = await AddNoteToFolder(id, folderId);
          if (result.success) {
            setSuccess(`Note associée au dossier avec succès`);
            // Retirer le paramètre de l'URL après association
            const newUrl = window.location.pathname;
            router.replace(newUrl);
          } else {
            console.warn('Erreur lors de l\'association au dossier:', result.error);
          }
        } catch (error) {
          console.error('Erreur lors de l\'association au dossier:', error);
        }
      };
      
      associateToFolder();
    }
  }, [id, searchParams, isLoading, router]);

  const initialConfig = {
    namespace: "Editor",
    theme,
    onError,
    // ✅ NE PAS utiliser initialEditorState - Le contenu vient de Yjs via CollaborationPlugin
    // Cela évite les conflits entre BDD et Yjs lors de la synchro initiale
    editorState: undefined,
  };

  const focusAtEnd = useCallback(() => {
    if (!editor) return;
    editor.update(() => {
      const root = $getRoot();
      root.selectEnd();
    });
  }, [editor]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    const editorElem = editor.getRootElement();
    // Si on clique directement sur la zone d'édition (mais pas sur du texte)
    if (e.target === editorElem) {
      focusAtEnd();
    }
  };

  function OnChangeBehavior() {
    const [editor] = useLexicalComposerContext();
    const charCountRef = useRef(0);
    const lastContentLengthRef = useRef(0);

    // Register editor in parent component
    useEffect(() => {
      setEditor(editor);
    }, [editor]);

    // Debounced callback for emitting content changes via socket (150ms d'inactivité)
    const debouncedContentEmit = useDebouncedCallback(
      (editorState: EditorState) => {
        charCountRef.current = 0; // Reset le compteur après l'envoi
        saveContent(editorState);
      },
      150 // 150ms = envoi après inactivité
    );

    async function saveContent(editorState: EditorState) {
      if (isReadOnly) return; // Ne pas sauvegarder si en lecture seule
      
      // Indiquer que la sauvegarde du contenu est en cours
      setIsSavingContent(true);
      
      // Call toJSON on the EditorState object, which produces a serialization safe string
      const editorStateJSON = editorState.toJSON();
      // However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
      const contentString = JSON.stringify(editorStateJSON);
      setEditorContent(contentString);
      
      console.log('🔄 Début sauvegarde contenu:', {
        noteId: id,
        contentLength: contentString.length,
        title: noteTitle
      });
      
      try {
        // Sauvegarder dans la base de données PostgreSQL
        console.log('📡 Appel SaveNote...');
        const result = await SaveNote(id, {
          Titre: noteTitle,
          Content: contentString,
        });
        console.log('✅ Résultat SaveNote:', result);
        
        // Émettre via socket pour synchronisation temps réel
        socketService.emitContentUpdate(id, contentString);
        console.log('📡 Socket émis avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du contenu:', error);
      } finally {
        setIsSavingContent(false);
        setIsTyping(false); // Marquer immédiatement comme terminé
        console.log('🏁 Fin sauvegarde contenu');
      }
    }

    useEffect(() => {
      const unregisterListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }: any) => {
        // Only trigger the emit if there are changes to the content
        if (dirtyElements?.size > 0 || dirtyLeaves?.size > 0) {
          // Indiquer immédiatement que l'utilisateur tape
          setIsTyping(true);
          
          // Calculer le nombre de caractères changés
          const currentContent = editorState.read(() => {
            const root = $getRoot();
            return root.getTextContent();
          });
          const currentLength = currentContent.length;
          const charDiff = Math.abs(currentLength - lastContentLengthRef.current);
          lastContentLengthRef.current = currentLength;
          
          // Incrémenter le compteur de caractères
          charCountRef.current += charDiff;
          
          // Si on a tapé 2 caractères ou plus, envoyer immédiatement
          if (charCountRef.current >= 2) {
            charCountRef.current = 0; // Reset
            debouncedContentEmit.cancel(); // Annuler le debounce en cours
            saveContent(editorState); // Envoyer immédiatement
          } else {
            // Sinon, utiliser le debounce (150ms)
            debouncedContentEmit(editorState);
          }
        }
      });

      return () => {
        unregisterListener();
      };
    }, [editor, debouncedContentEmit]);

    return null;
  }

  return (
    <div className="flex flex-col p-2.5 h-fit min-h-full gap-2.5">
      {/* Zone de notifications */}
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          {success && (
            <div 
              onClick={() => setSuccess(null)}
              className="rounded-md bg-green-50 p-4 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-800">
                    {success}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex text-green-400 hover:text-green-600">
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div 
              onClick={() => setError(null)}
              className="rounded-md bg-red-50 p-4 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex text-red-400 hover:text-red-600">
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicateur de sauvegarde du contenu - retiré, sera dans la zone d'écriture */}

      <div className="flex rounded-lg p-2.5 items-center md:hidden bg-primary text-white sticky top-2 z-10">
        <ReturnButton />
        {
          hasError ?
            <p className="w-full font-semibold bg-transparent p-1">Erreur</p>
            :
            <>
              <input
              type="text"
              value={noteTitle}
              onChange={(e) => !isReadOnly && setNoteTitle(e.target.value)}
              onBlur={(e) => updateNoteTitle(e.target.value)}
              className={`w-full font-semibold bg-transparent p-1 placeholder:text-textcardNote placeholder:font-medium focus:outline-white ${isReadOnly ? 'cursor-not-allowed' : ''}`}
              
              disabled={isReadOnly}
              />
              <div className="relative">
              <span onClick={() => setShowNoteMore((prev) => !prev)}>
                <Icons
                  name="more"
                  size={20}
                  className="text-white cursor-pointer"
                />
              </span>
              {showNoteMore && (
                <div className="absolute right-0 mt-2 z-20">
                <NoteMore noteId={id} onClose={() => setShowNoteMore(false)} />
                </div>
              )}
              </div>
            </>
        }

      </div>
      {
        hasError ? (
          // Si erreur :
          <ErrorFetch type="fetch" />
        ) : isLoading ? (
          // Si en chargement :
          <div className="bg-white p-4 rounded-lg h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-textcardNote font-medium">Chargement de la note...</p>
            </motion.div>
          </div>
        ) : (
          // Si pas d'erreur et chargement terminé :
          <>
            <div onClick={handleClick} className="relative bg-fondcardNote text-textcardNote p-4 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-auto">
              {/* Indicateur de sauvegarde en bas à droite de la zone d'écriture */}
              <div className="absolute bottom-4 right-4 z-10">
                {(isSavingContent || isTyping) ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                ) : (
                  <Icons name="save" size={20} className="h-5 w-5 text-primary" />
                )}
              </div>
              
              <LexicalComposer initialConfig={initialConfig} key={initialEditorState}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      aria-placeholder={ "Commencez à écrire..."}
                      placeholder={
                        <p className="absolute top-4 left-4 text-textcardNote select-none pointer-events-none">
                           "Commencez à écrire..."
                        </p>
                      }
                      className={`h-full focus:outline-none ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                      contentEditable={!isReadOnly}
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                {!isReadOnly && <OnChangeBehavior />}
                {!isReadOnly && <AutoFocusPlugin />}
                {/* Plugin de collaboration temps réel */}
                <CollaborationPlugin 
                  noteId={id} 
                  username={userPseudo}
                  isReadOnly={isReadOnly}
                  onTitleUpdate={handleRemoteTitleUpdate}
                  onContentUpdate={handleRemoteContentUpdate}
                />
              </LexicalComposer>
            </div>
          </>
        )
      }

    </div>
  );
}