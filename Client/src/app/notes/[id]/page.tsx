"use client";
import React from "react";
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
import OnChangePlugin from "@lexical/react/LexicalOnChangePlugin";
import { useCallback } from "react";
import Icons from '@/ui/Icon';
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter } from "next/navigation";
import CollaborationPlugin from "@/components/collaboration/CollaborationPlugin";
import { socketService } from "@/services/socketService";

import { GetNoteById } from "@/loader/loader";
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

  // Unwrap params using React.use()
  const { id } = use(params);

  // ✅ Hook pour déconnecter le socket quand on quitte la page note
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, [id]);

  // Hook pour détecter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      // Force le rechargement des données quand on change de taille d'écran
      setLastFetchTime(Date.now());
    };

    // Écouter les mises à jour de titre depuis le Breadcrumb
    const handleTitleUpdate = (event: CustomEvent) => {
      const { noteId, title } = event.detail;
      if (noteId === id) {
        setNoteTitle(title);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('noteTitleUpdated', handleTitleUpdate as EventListener);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('noteTitleUpdated', handleTitleUpdate as EventListener);
    };
  }, [id]);


  function updateNoteTitle(newTitle: string) {
    if (isReadOnly) return; // Ne pas sauvegarder si en lecture seule
    
    // Si le titre est vide, utiliser le fallback
    const finalTitle = newTitle.trim() === '' ? 'Titre de la note' : newTitle;
    
    setNoteTitle(finalTitle);
    
    // Sauvegarder le titre avec notification
    uploadContent(id, finalTitle, editorContent).then((success) => {
      if (success) {
        setSuccess('Titre sauvegardé avec succès');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Erreur lors de la sauvegarde du titre');
        setTimeout(() => setError(null), 5000);
      }
    });
    
    // Émettre un événement pour synchroniser avec le Breadcrumb
    window.dispatchEvent(new CustomEvent('noteTitleUpdated', { 
      detail: { noteId: id, title: finalTitle } 
    }));
  }

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

  const initialConfig = {
    namespace: "Editor",
    theme,
    onError,
    // Utiliser l'état initial si disponible
    editorState: initialEditorState ? initialEditorState : undefined,
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

    // Register editor in parent component
    useEffect(() => {
      setEditor(editor);
    }, [editor]);

    // Debounced callback for logging editor state
    const debouncedLog = useDebouncedCallback(
      (editorState: EditorState) => {
        saveContent(editorState);
      },
      1000 // 1-second debounce
    );

    function saveContent(editorState: EditorState) {
      if (isReadOnly) return; // Ne pas sauvegarder si en lecture seule
      
      // Indiquer que la sauvegarde du contenu est en cours
      setIsSavingContent(true);
      
      // Call toJSON on the EditorState object, which produces a serialization safe string
      const editorStateJSON = editorState.toJSON();
      // However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
      const contentString = JSON.stringify(editorStateJSON);
      setEditorContent(contentString);
      
      // Sauvegarder avec notification
      uploadContent(id, noteTitle, contentString).then((success) => {
        setIsSavingContent(false);
        if (success) {
          // Afficher brièvement l'icône de sauvegarde réussie
          setTimeout(() => {
            // L'icône de sauvegarde réussie sera gérée par l'état isSavingContent
          }, 500);
        } else {
          setError('Erreur lors de la sauvegarde du contenu');
          setTimeout(() => setError(null), 5000);
        }
      });
    }

    useEffect(() => {
      const unregisterListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
        // Only trigger the debounced log if there are changes to the content
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          debouncedLog(editorState);
        }
      });

      return () => {
        unregisterListener();
      };
    }, [editor, debouncedLog]);

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
                {isSavingContent ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                ) : (
                  <svg 
                    className="h-5 w-5 text-primary" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
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
                />
              </LexicalComposer>
            </div>
          </>
        )
      }

    </div>
  );
}
