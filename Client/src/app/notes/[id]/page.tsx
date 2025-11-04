"use client";

import { $getRoot, EditorState, $getSelection, $isRangeSelection } from "lexical";
import React, { useEffect, useState, use, useRef, useCallback } from "react";
// @ts-ignore
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
// @ts-ignore
import { LexicalComposer } from "@lexical/react/LexicalComposer";
// @ts-ignore
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
// @ts-ignore
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
// @ts-ignore
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
// @ts-ignore
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ReturnButton from "@/ui/returnButton";
// @ts-ignore
// import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDebouncedCallback } from "use-debounce";
import { motion } from "motion/react";
import Icons from '@/ui/Icon';
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter, useSearchParams } from "next/navigation";
import CollaborationPlugin from "@/components/collaboration/CollaborationPlugin";
import { socketService } from "@/services/socketService";
import DrawingBoard, { DrawingData } from "@/components/drawingBoard/drawingBoard";
import { ImageNode, $createImageNode } from "@/components/flashnote/ImageNode";
import { $insertNodes } from "lexical";

import { GetNoteById, AddNoteToFolder } from "@/loader/loader";
import { SaveNote } from "@/loader/loader";

import ErrorFetch from "@/ui/note/errorFetch";
import ToolbarPlugin from '@/components/textRich/ToolbarPlugin';
import { editorNodes } from "@/components/textRich/editorNodes";
// @ts-ignore
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import '@/components/textRich/EditorStyles.css';

const theme = {
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code',
  },
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
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
  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reload page on breakpoint change (mobile <-> desktop)
  React.useEffect(() => {
    // Détection du breakpoint initial
    let lastIsMobile = window.innerWidth < 768;
    const onResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== lastIsMobile) {
        window.location.reload();
      }
      lastIsMobile = isMobile;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      
      // ✅ AMÉLIORATION: Comparaison plus robuste pour éviter les boucles infinites
      editor.getEditorState().read(() => {
        const currentStateJSON = editor.getEditorState().toJSON();
        const currentContent = JSON.stringify(currentStateJSON);
        
        // Si le contenu est identique, ignorer complètement
        if (currentContent === content) {
          
          return;
        }
        
        // Vérifier si c'est bien un EditorState Lexical valide
        if (!parsedContent.root || parsedContent.root.type !== 'root') {
          console.warn('⚠️ Contenu distant invalide, ignoré');
          return;
        }

        // Sauvegarder le focus et la sélection avant mise à jour
        const hasFocus = editor.getRootElement() === document.activeElement || 
                         editor.getRootElement()?.contains(document.activeElement);
        
        let savedSelection: any = null;
        if (hasFocus) {
          savedSelection = editor.getEditorState()._selection?.clone();
        }
        
        // ✅ CORRECTION CRITIQUE: Marquer qu'on applique une mise à jour distante
        // Ceci permet d'éviter que l'updateListener déclenche une sauvegarde
        const isApplyingRemoteUpdateRef = (editor as any)._isApplyingRemoteUpdateRef;
        if (isApplyingRemoteUpdateRef) {
          isApplyingRemoteUpdateRef.current = true;
        }
        
        // Appliquer la mise à jour dans une transaction séparée
        setTimeout(() => {
          const newEditorState = editor.parseEditorState(parsedContent);
          editor.setEditorState(newEditorState);
          setEditorContent(content);
          
          // ✅ Réinitialiser le flag après application
          setTimeout(() => {
            if (isApplyingRemoteUpdateRef) {
              isApplyingRemoteUpdateRef.current = false;
            }
          }, 50);
          
          // Restaurer le focus si nécessaire
          if (hasFocus) {
            setTimeout(() => {
              editor.focus();
              if (savedSelection) {
                editor.update(() => {
                  try {
                    savedSelection.dirty = true;
                    editor.getEditorState()._selection = savedSelection;
                  } catch (e) {
                    
                  }
                });
              }
            }, 0);
          }
        }, 0);
      });
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
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://preprod.yanotela.fr";
        const response = await fetch(`${API_URL}/auth/check`, {
          credentials: "include",
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
          
          // ✅ CORRECTION: Meilleur traitement du contenu depuis la BDD
          if (note.Content) {
            try {
              // Vérifier si c'est déjà du JSON Lexical valide
              const parsedContent = JSON.parse(note.Content);
              
              // Validation basique pour s'assurer que c'est bien un EditorState Lexical
              if (parsedContent.root && parsedContent.root.type === 'root') {
                
                setInitialEditorState(note.Content);
                setEditorContent(note.Content);
              } else {
                // JSON mais pas Lexical, créer un état valide
                
                const simpleState = createSimpleLexicalState(note.Content);
                setInitialEditorState(simpleState);
                setEditorContent(simpleState);
              }
            } catch {
              // Si ce n'est pas du JSON, créer un état d'éditeur simple avec le texte
              
              const simpleState = createSimpleLexicalState(note.Content);
              setInitialEditorState(simpleState);
              setEditorContent(simpleState);
            }
          } else {
            // Pas de contenu, créer un état vide
            const emptyState = createSimpleLexicalState("");
            setInitialEditorState(emptyState);
            setEditorContent(emptyState);
          }
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
  
  // ✅ NOUVELLE FONCTION: Créer un EditorState Lexical valide depuis du texte
  function createSimpleLexicalState(text: string): string {
    const simpleState = {
      root: {
        children: [{
          children: text ? [{
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: text,
            type: "text",
            version: 1
          }] : [],
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
    return JSON.stringify(simpleState);
  }

  const initialConfig = {
    namespace: "Editor",
    theme,
    onError,
    nodes: editorNodes,
    // ✅ CORRECTION: Utiliser l'état initial depuis la BDD pour un chargement immédiat
    // La collaboration temps-réel viendra s'ajouter par-dessus via les WebSockets
    editorState: initialEditorState || createSimpleLexicalState(""),
  };

  const focusAtEnd = useCallback(() => {
    if (!editor) return;
    editor.update(() => {
      const root = $getRoot();
      root.selectEnd();
    });
  }, [editor]);

  const handleDrawingSave = useCallback((drawingData: DrawingData) => {
    if (!editor || isReadOnly) return;
    
    editor.update(() => {
      const selection = $getSelection();
      
      // Create a new image node with the drawing
      const imageNode = $createImageNode({
        src: drawingData.dataUrl,
        altText: "Drawing",
        width: Math.min(drawingData.width, 600), // Limit max width
        height: Math.min(drawingData.height, 600),
      });
      
      // Insert the image node at the current selection or at the end
      if ($isRangeSelection(selection)) {
        $insertNodes([imageNode]);
      } else {
        const root = $getRoot();
        root.selectEnd();
        $insertNodes([imageNode]);
      }
    });
  }, [editor, isReadOnly]);

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
    const lastSaveTimeRef = useRef(Date.now());
    const isApplyingRemoteUpdateRef = useRef(false); // ✅ Flag pour éviter les boucles

    // Register editor in parent component
    useEffect(() => {
      // ✅ Attacher la référence du flag à l'éditeur pour éviter les boucles
      (editor as any)._isApplyingRemoteUpdateRef = isApplyingRemoteUpdateRef;
      setEditor(editor);
    }, [editor]);

    // Debounced callback: 150ms AVEC minimum 1 caractère
    const debouncedContentEmit = useDebouncedCallback(
      (editorState: EditorState) => {
        // Vérifier qu'on a au moins 1 caractère modifié
        if (charCountRef.current >= 1) {
          charCountRef.current = 0; // Reset
          saveContent(editorState);
        }
        // Indiquer qu'on a arrêté de taper
        socketService.emitUserTyping(id, false);
      },
      150 // 150ms après inactivité
    );

    function saveContent(editorState: EditorState) {
      if (isReadOnly) return; // Ne pas sauvegarder si en lecture seule
      
      setIsSavingContent(true);
      setIsTyping(false); // L'utilisateur a arrêté de taper
      
      // Sérialiser l'état Lexical
      const editorStateJSON = editorState.toJSON();
      const contentString = JSON.stringify(editorStateJSON);
      setEditorContent(contentString);
      
      // ✅ Mettre à jour le timestamp de dernière sauvegarde
      lastSaveTimeRef.current = Date.now();
      
      // ✅ DOUBLE SAUVEGARDE: WebSocket (temps réel) + HTTP (sécurité)
      
      // 1. WebSocket pour la collaboration temps réel
      socketService.emitContentUpdate(id, contentString);

      // 2. Sauvegarde HTTP en arrière-plan pour la sécurité
      // (avec un délai pour éviter de surcharger l'API)
      setTimeout(async () => {
        try {
          const result = await uploadContent(id, noteTitle, contentString);

          // Si la sauvegarde HTTP échoue, on peut afficher une notification
          if (typeof result === 'object' && result && 'error' in result) {
            console.error('❌ Erreur sauvegarde HTTP:', (result as any).error);
          }
        } catch (error) {
          console.error('❌ Erreur sauvegarde HTTP:', error);
        }
      }, 1000); // 1 seconde de délai pour ne pas interférer avec le WebSocket
      
      setIsSavingContent(false);
    }

    useEffect(() => {
      const unregisterListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }: any) => {
        // ✅ CORRECTION CRITIQUE: Ignorer les mises à jour si on applique du contenu distant
        if (isApplyingRemoteUpdateRef.current) {
          
          return;
        }

        if (dirtyElements?.size > 0 || dirtyLeaves?.size > 0) {
          // Indiquer que l'utilisateur tape
          setIsTyping(true);
          socketService.emitUserTyping(id, true);
          
          // Calculer le nombre de caractères modifiés
          const currentContent = editorState.read(() => {
            const root = $getRoot();
            return root.getTextContent();
          });
          const currentLength = currentContent.length;
          const charDiff = Math.abs(currentLength - lastContentLengthRef.current);
          lastContentLengthRef.current = currentLength;
          
          // Incrémenter le compteur
          charCountRef.current += charDiff;
          
          // ✅ Double sécurité: 3 caractères OU 150ms avec min 1 char
          if (charCountRef.current >= 3) {
            // Envoi immédiat après 3 caractères
            debouncedContentEmit.cancel(); // Annuler le debounce
            charCountRef.current = 0;
            saveContent(editorState);
            
          } else {
            // Sinon, attendre 150ms (avec min 1 char)
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
    <div className="flex flex-col p-2.5 h-fit min-h-full gap-2.5 relative">
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
                <div className="absolute right-0 mt-2 z-30">
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
            <div onClick={handleClick} className="relative bg-fondcardNote text-textcardNote p-4 pb-24 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-auto">
              {/* Indicateur de sauvegarde en bas à droite de la zone d'écriture */}
              {/* <div className="absolute bottom-4 right-4 z-10">
                {(isSavingContent || isTyping) ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                ) : (
                  <Icons name="save" size={20} className="h-5 w-5 text-primary" />
                )}
              </div> */}
              
              {/* Drawing Board */}
              {!isReadOnly && <DrawingBoard isOpen={false} onSave={handleDrawingSave} />}
              
              {/* Ne monter le LexicalComposer que quand initialEditorState est prêt */}
              {initialEditorState && (
                <LexicalComposer initialConfig={initialConfig} key={id}>
                  {!isReadOnly && <ToolbarPlugin />}
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        aria-placeholder={ "Commencez à écrire..."}
                        placeholder={
                          <p className="absolute top-20 left-4 text-textcardNote select-none pointer-events-none">
                            "Commencez à écrire..."
                          </p>
                        }
                        className={`editor-root mt-2 h-full focus:outline-none ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                        contentEditable={!isReadOnly}
                      />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  <HistoryPlugin />
                  <ListPlugin />
                  {!isReadOnly && <OnChangeBehavior />}
                  {!isReadOnly && <AutoFocusPlugin />}
                  {/* Plugin de collaboration temps réel */}
                  {userPseudo && (
                    <CollaborationPlugin 
                      noteId={id} 
                      username={userPseudo}
                      isReadOnly={isReadOnly}
                      onTitleUpdate={handleRemoteTitleUpdate}
                      onContentUpdate={handleRemoteContentUpdate}
                    />
                  )}
                </LexicalComposer>
              )}
            </div>
          </>
        )
      }

    </div>
  );
}
