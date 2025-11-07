"use client";

import { $getRoot, EditorState, $getSelection, $isRangeSelection } from "lexical";
import React, { useEffect, useState, use, useRef, useCallback } from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import ReturnButton from "@/ui/returnButton";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDebouncedCallback } from "use-debounce";
import { motion } from "motion/react";
import Icons from '@/ui/Icon';
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter, useSearchParams } from "next/navigation";
import ConnectedUsers from "@/components/collaboration/ConnectedUsers";
import { createWebsocketProvider } from "@/collaboration/providers";
import DrawingBoard, { DrawingData } from "@/components/drawingBoard/drawingBoard";
import { ImageNode, $createImageNode } from "@/components/flashnote/ImageNode";
import { $insertNodes } from "lexical";

import { GetNoteById, AddNoteToFolder } from "@/loader/loader";
import { SaveNote } from "@/loader/loader";

import ErrorFetch from "@/ui/note/errorFetch";
import ToolbarPlugin from '@/components/textRich/ToolbarPlugin';
import { editorNodes } from "@/components/textRich/editorNodes";
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import '@/components/textRich/EditorStyles.css';
import * as Y from 'yjs';

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
  const [userRole, setUserRole] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [userPseudo, setUserPseudo] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);

  // États pour les notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // ✅ Refs pour éviter les sauvegardes HTTP trop fréquentes
  const lastHttpSaveTimeRef = useRef<number>(0);
  const lastContentLengthRef = useRef<number>(0);

  // Unwrap params using React.use()
  const { id } = use(params);

  // ✅ NOUVEAU: State pour profil utilisateur (utilisé par CollaborationPlugin)
  const [userProfile, setUserProfile] = useState({ name: 'Anonyme', color: '#FF5733' });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ✅ Provider factory pour CollaborationPlugin
  const providerFactory = useCallback(
    (docId: string, yjsDocMap: Map<string, Y.Doc>) => {
      
      return createWebsocketProvider(docId, yjsDocMap);
    },
    []
  );

  // Debounced emit pour le titre (sauvegarde HTTP simple)
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
    
    // ✅ Sauvegarder en base de données
    SaveNote(id, { Titre: finalTitle }).then(() => {
      
    }).catch((error) => {
      console.error('❌ Erreur sauvegarde titre:', error);
    });
    
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
        
        // Appliquer la mise à jour dans une transaction séparée
        setTimeout(() => {
          const newEditorState = editor.parseEditorState(parsedContent);
          editor.setEditorState(newEditorState);
          setEditorContent(content);
          
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
                    // Ignorer les erreurs de sélection
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

  // 💾 SAUVEGARDE HTTP PÉRIODIQUE: Sauvegarder automatiquement toutes les 10 secondes
  useEffect(() => {
    if (!editor || !ytext || !isYjsReady || isReadOnly) return;

    const interval = setInterval(async () => {
      try {
        // Récupérer le contenu actuel depuis Yjs (source de vérité)
        const yjsContent = ytext.toString();
        
        if (!yjsContent) {
          
          return;
        }

        // Sauvegarder en BDD (avec titre actuel)
        await uploadContent(id, noteTitle, yjsContent);
        
      } catch (error) {
        console.error('[AutoSave] ❌ Erreur sauvegarde HTTP:', error);
      }
    }, 10000); // 10 secondes

    return () => {
      
      clearInterval(interval);
    };
  }, [editor, ytext, isYjsReady, isReadOnly, id, noteTitle]);

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

  // ✅ NOUVEAU: Écouter directement les mises à jour de titre via socket
  useEffect(() => {

    const handleTitleUpdate = (data: { noteId: string; titre: string; userId: number; pseudo: string }) => {

      if (data.noteId !== id) {
        
        return;
      }
      
      // Dispatcher l'événement DOM pour que le listener existant le récupère
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('socketTitleUpdate', { 
          detail: { noteId: data.noteId, titre: data.titre, pseudo: data.pseudo } 
        }));
      }
    };
    
    socketService.onTitleUpdate(handleTitleUpdate);
    
    return () => {
      
      socketService.off('titleUpdate', handleTitleUpdate);
    };
  }, [id]);

  // Récupérer les informations utilisateur au chargement
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/auth/check`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUserPseudo(userData.pseudo || 'Anonyme');
          setUserId(userData.userId || null);
          
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
        console.log('[OnChangeBehavior] 📤 emitUserTyping(false) appelé (debounced)');
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
      
      // ✅ STRATÉGIE: Yjs gère la collaboration temps réel + HTTP périodique pour sécurité
      
      // 🔥 DÉSACTIVÉ: YjsCollaborationPlugin gère automatiquement les mises à jour via yjs-update
      // Ne pas utiliser l'ancien système contentUpdate qui entre en conflit avec Yjs
      // socketService.emitContentUpdate(id, contentString);

      // 2. Sauvegarde HTTP PÉRIODIQUE seulement (toutes les 10 secondes max)
      const now = Date.now();
      const timeSinceLastHttpSave = now - lastHttpSaveTimeRef.current;
      
      if (timeSinceLastHttpSave > 10000) { // 10 secondes minimum entre chaque sauvegarde HTTP
        lastHttpSaveTimeRef.current = now;
        
        setTimeout(async () => {
          try {
            await uploadContent(id, noteTitle, contentString);
            
          } catch (error) {
            console.error('❌ Erreur sauvegarde HTTP périodique:', error);
          }
        }, 100); // Petit délai pour ne pas bloquer l'UI
      }
      
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
      {/* Badge utilisateurs connectés - NOUVEAU COMPOSANT */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
        <ConnectedUsers noteId={id} className="bg-primary rounded-lg shadow-lg p-3" />
        {userPseudo && userId && (
          <TypingIndicator 
            noteId={id} 
            currentUserPseudo={userPseudo}
            currentUserId={userId}
            className="bg-white rounded-lg shadow-lg px-4 py-2"
          />
        )}
      </div>

      {/* Zone de notifications */}
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50 max-w-md pl-4">
          {success && (
            <div 
              onClick={() => setSuccess(null)}
              className="rounded-md bg-success-50 p-4 border border-success-200 cursor-pointer hover:bg-success-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-green" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-success-800">
                    {success}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <button className="inline-flex text-green hover:text-success-800">
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
              className="rounded-md bg-dangerous-50 p-4 border border-dangerous-600 cursor-pointer hover:bg-dangerous-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-dangerous-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-dangerous-800">
                    {error}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <button className="inline-flex text-dangerous-600 hover:text-dangerous-800">
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
            <div onClick={handleClick} className="relative bg-fondcardNote text-textcardNote p-4 pb-24 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-visible">

              {/* Drawing Board */}
              {!isReadOnly && (
                <DrawingBoard 
                  isOpen={isDrawingBoardOpen} 
                  onSave={handleDrawingSave}
                  onClose={() => setIsDrawingBoardOpen(false)}
                />
              )}

              {/* Ne monter le LexicalComposer que quand initialEditorState est prêt ET Yjs est prêt */}
              {initialEditorState && isYjsReady && ytext ? (
                <LexicalComposer initialConfig={initialConfig} key={id}>
                  {!isReadOnly && <ToolbarPlugin onOpenDrawingBoard={() => setIsDrawingBoardOpen(true)} />}
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        aria-placeholder={ ""} // Suppresion du place holder
                        placeholder={
                          <p className="absolute top-20 left-4 text-textcardNote select-none pointer-events-none">
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
                  {/* 🔥 Plugin de collaboration Yjs (remplace l'ancien CollaborationPlugin) */}
                  <YjsCollaborationPlugin 
                    ytext={ytext} 
                    noteId={id}
                  />
                  {/* Plugin des curseurs avec awareness */}
                  {userPseudo && userId && (
                    <CursorPlugin 
                      noteId={id} 
                      currentUserId={userId}
                      currentUserPseudo={userPseudo}
                    />
                  )}
                </LexicalComposer>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>⏳ Chargement de l'éditeur...</p>
                </div>
              )}
            </div>
          </>
        )
      }

    </div>
  );
}
