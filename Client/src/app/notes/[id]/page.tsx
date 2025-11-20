"use client";

import { $getRoot, $insertNodes, $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import React, { useEffect, useState, use, useRef, useCallback, createContext, useContext } from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import ReturnButton from "@/ui/returnButton";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { motion } from "motion/react";

import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from '@/hooks/useAuth';
import { createWebsocketProvider, setAwarenessUserInfo } from "@/collaboration/providers";
import DrawingBoard, { DrawingData } from "@/components/drawingBoard/drawingBoard";
import { $createImageNode } from "@/components/flashnote/ImageNode";
import SyncButton, { SyncStatus } from "@/ui/syncButton";
import * as Y from 'yjs';

import { GetNoteById, AddNoteToFolder } from "@/loader/loader";
import { SaveNote } from "@/loader/loader";

import ErrorFetch from "@/ui/note/errorFetch";
import ToolbarPlugin from '@/components/textRich/ToolbarPlugin';
import { editorNodes } from "@/components/textRich/editorNodes";
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TitleSyncPlugin } from '@/components/collaboration/TitleSyncPlugin';
import { MoreIcon } from "@/libs/Icons";
import '@/components/textRich/EditorStyles.css';

// Contexte pour partager l'état de synchronisation
interface SyncContextType {
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  triggerSync: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSyncContext must be used within SyncProvider');
  return context;
};

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
  console.error('[Lexical Error]', error);
}

/**
 * Plugin pour insérer des images de dessin dans l'éditeur
 */
function DrawingInsertPlugin({
  onDrawingInsertRequest
}: {
  onDrawingInsertRequest: (callback: (data: DrawingData) => void) => void
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Exposer une fonction pour insérer l'image
    const insertDrawing = (drawingData: DrawingData) => {
      editor.update(() => {
        const imageNode = $createImageNode({
          src: drawingData.dataUrl,
          altText: 'Dessin',
          width: drawingData.width,
          height: drawingData.height,
        });

        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Insérer à la position du curseur
          $insertNodes([imageNode]);
        } else {
          // Insérer à la fin si pas de sélection
          const root = editor.getEditorState()._nodeMap.get('root');
          if (root) {
            $insertNodes([imageNode]);
          }
        }

      });
    };

    // Exposer la fonction au parent via callback
    onDrawingInsertRequest(insertDrawing);
  }, [editor, onDrawingInsertRequest]);

  return null;
}

function YjsSyncPlugin({
  noteId,
  isReadOnly
}: {
  noteId: string,
  isReadOnly: boolean
}) {
  const [editor] = useLexicalComposerContext();
  const { setSyncStatus } = useSyncContext();
  const lastSyncRef = useRef<number>(0);
  const hasChangesRef = useRef<boolean>(false);

  useEffect(() => {
    if (isReadOnly) {

      setSyncStatus('synced');
      return;
    }

    // Marquer qu'il y a eu des changements à chaque update
    const unregister = editor.registerUpdateListener(() => {
      hasChangesRef.current = true;
      setSyncStatus('pending');

    });

    // Sync automatique toutes les 2 secondes si changements
    const syncInterval = setInterval(async () => {
      // Vérifier s'il y a des changements de contenu
      if (!hasChangesRef.current) return;

      const now = Date.now();
      if (now - lastSyncRef.current < 2000) return; // Throttle minimum 2s

      try {
        setSyncStatus('syncing');

        // Importer la map globale des documents YJS
        const { yjsDocuments } = await import('@/collaboration/providers');
        const ydoc = yjsDocuments.get(noteId);

        if (!ydoc) {
          console.warn('⚠️ [YjsSync] Y.Doc non trouvé pour', noteId);
          setSyncStatus('error');
          return;
        }

        // Encoder l'état YJS en Uint8Array
        const yjsState = Y.encodeStateAsUpdate(ydoc);

        // Récupérer le contenu Lexical JSON
        const lexicalJSON = editor.getEditorState().toJSON();
        const Content = JSON.stringify(lexicalJSON);

        // Envoyer au serveur
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const response = await fetch(`${API_URL}/note/sync/${noteId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            yjsState: Array.from(yjsState),
            Content: Content
          })
        });

        if (response.ok) {
          lastSyncRef.current = now;
          hasChangesRef.current = false;
          setSyncStatus('synced');
        } else {
          console.error('❌ [YjsSync] Erreur HTTP', response.status, await response.text());
          setSyncStatus('error');
        }
      } catch (error) {
        console.error('❌ [YjsSync] Erreur:', error);
        setSyncStatus('error');
      }
    }, 2000);

    // Écouter l'événement de sync manuel
    const handleManualSync = async () => {
      if (!hasChangesRef.current) {

        return;
      }

      try {
        setSyncStatus('syncing');

        const { yjsDocuments } = await import('@/collaboration/providers');
        const ydoc = yjsDocuments.get(noteId);

        if (!ydoc) {
          setSyncStatus('error');
          return;
        }

        const yjsState = Y.encodeStateAsUpdate(ydoc);
        const lexicalJSON = editor.getEditorState().toJSON();
        const Content = JSON.stringify(lexicalJSON);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const response = await fetch(`${API_URL}/note/sync/${noteId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            yjsState: Array.from(yjsState),
            Content: Content
          })
        });

        if (response.ok) {
          lastSyncRef.current = Date.now();
          hasChangesRef.current = false;
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (error) {
        console.error('❌ [YjsSync] Erreur sync manuel:', error);
        setSyncStatus('error');
      }
    };

    window.addEventListener('trigger-manual-sync', handleManualSync);

    return () => {

      clearInterval(syncInterval);
      unregister();
      window.removeEventListener('trigger-manual-sync', handleManualSync);
    };
  }, [editor, noteId, isReadOnly, setSyncStatus]);

  return null;
}

function ReadOnlyPlugin({ isReadOnly }: { isReadOnly: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {

    // ⚠️ NE PAS désactiver l'éditeur via setEditable(false) !
    // Cela empêche le binding YJS de mettre à jour le DOM
    // On va UNIQUEMENT bloquer les inputs utilisateur via le DOM

    if (!isReadOnly) {

      editor.setEditable(true);
      return;
    }

    // Attendre que l'éditeur ET le CollaborationPlugin soient montés
    const timeoutId = setTimeout(() => {
      const rootElement = editor.getRootElement();

      if (!rootElement) {
        console.error('❌ [ReadOnly] RootElement introuvable après 500ms');
        return;
      }

      // Bloquer UNIQUEMENT les événements utilisateur (keyboard, mouse, paste)
      const blockUserEvent = (e: Event) => {
        // CRITIQUE : Ne bloquer que les événements utilisateur (isTrusted = true)
        // Les événements programmatiques (YJS) ont isTrusted = false
        if (e.isTrusted) {
          e.preventDefault();
          e.stopPropagation();

        }
      };

      const userInputEvents = [
        'keydown', 'keypress', 'keyup',
        'beforeinput', 'input',
        'paste', 'cut', 'drop',
        'compositionstart', 'compositionupdate', 'compositionend',
      ];

      // Ajouter les listeners UNIQUEMENT sur le rootElement (pas en capture)
      userInputEvents.forEach(eventType => {
        rootElement.addEventListener(eventType, blockUserEvent, false);
      });

      // Empêcher le focus utilisateur (mais permettre le focus programmatique)
      const blockFocus = (e: FocusEvent) => {
        if (e.isTrusted) {

          (e.target as HTMLElement).blur();
        }
      };
      rootElement.addEventListener('focus', blockFocus, false);

      // Ajouter un style visuel pour indiquer la lecture seule
      rootElement.style.cursor = 'default';
      rootElement.style.userSelect = 'text'; // Permettre la sélection de texte
      rootElement.setAttribute('data-readonly', 'true');

      // Cleanup
      return () => {

        userInputEvents.forEach(eventType => {
          rootElement.removeEventListener(eventType, blockUserEvent, false);
        });
        rootElement.removeEventListener('focus', blockFocus, false);
        rootElement.style.cursor = '';
        rootElement.style.userSelect = '';
        rootElement.removeAttribute('data-readonly');
      };
    }, 500); // Délai réduit à 500ms

    return () => {
      clearTimeout(timeoutId);
    };
  }, [editor, isReadOnly]);

  return null;
}

/**
 * Plugin pour charger le contenu initial de la note dans l'éditeur
 */
function LoadInitialContentPlugin({ content, noteId }: { content: string | null, noteId: string }) {
  const [editor] = useLexicalComposerContext();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!content || hasLoadedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        // If a Y.Doc already exists and contains state, prefer Y.Doc as source of truth
        const { yjsDocuments } = await import('@/collaboration/providers');
        let ydoc = yjsDocuments.get(noteId);

        // If the provider hasn't been created yet, wait briefly for it (small race window)
        if (!ydoc) {
          const start = Date.now();
          const maxWait = 300; // ms
          while (Date.now() - start < maxWait && !cancelled) {
            await new Promise((r) => setTimeout(r, 50));
            const { yjsDocuments: yjsDocumentsRetry } = await import('@/collaboration/providers');
            ydoc = yjsDocumentsRetry.get(noteId);
            if (ydoc) break;
          }
        }

        if (ydoc) {
          const encoded = Y.encodeStateAsUpdate(ydoc);
          if (encoded && encoded.length > 0) {
            // Y.Doc already has content — skip applying DB content to avoid duplication
            hasLoadedRef.current = true;
            return;
          }
        }

        if (cancelled) return;

        const parsedContent = JSON.parse(content);

        editor.update(() => {
          const newEditorState = editor.parseEditorState(parsedContent);
          editor.setEditorState(newEditorState);

        }, {
          tag: 'history-merge',
        });

        hasLoadedRef.current = true;
      } catch (err) {
        console.error('❌ [LoadContent] Erreur parsing contenu:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editor, content, noteId]);

  return null;
}

/**
 * Plugin pour enregistrer l'éditeur dans le state parent
 */
function EditorRefPlugin({ onEditorReady }: { onEditorReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    onEditorReady(editor);
  }, [editor, onEditorReady]);

  return null;
}

interface NoteEditorProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NoteEditor({ params }: NoteEditorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  const triggerSync = () => {
    window.dispatchEvent(new Event('trigger-manual-sync'));
  };

  return (
    <SyncContext.Provider value={{ syncStatus, setSyncStatus, triggerSync }}>
      <NoteEditorContent params={params} />
      <SyncButton status={syncStatus} onSync={triggerSync} />
    </SyncContext.Provider>
  );
}

function NoteEditorContent({ params }: NoteEditorProps) {
  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [noteTitle, setNoteTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasError, setHasError] = useState(false);
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);

  // État pour le contenu initial de la note (pour bootstrapping)
  const [initialEditorContent, setInitialEditorContent] = useState<string | null>(null);

  // Ref to store the drawing insert function
  const insertDrawingRef = useRef<((data: DrawingData) => void) | null>(null);

  // États pour les notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const { id } = use(params);

  // State pour profil utilisateur (utilisé par CollaborationPlugin)
  const [userProfile, setUserProfile] = useState({ name: 'Anonyme', color: '#FF5733' });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorContentRef = useRef<HTMLDivElement | null>(null); // Ref pour le ContentEditable (export PDF)

  // ✅ Provider factory pour CollaborationPlugin
  const providerFactory = useCallback(
    (docId: string, yjsDocMap: Map<string, Y.Doc>) => {

      return createWebsocketProvider(docId, yjsDocMap);
    },
    []
  );

  // ✅ Référence à l'éditeur Lexical (pour insertion des dessins)
  const [editor, setEditor] = useState<LexicalEditor | null>(null);

  function updateNoteTitle(newTitle: string) {
    if (isReadOnly) {
      console.warn('🔒 [Permissions] Modification titre bloquée (lecture seule)');
      return;
    }

    const finalTitle = newTitle.trim() === '' ? 'Sans titre' : newTitle;
    setNoteTitle(finalTitle);

    // Émettre un événement pour synchroniser avec le Breadcrumb
    window.dispatchEvent(new CustomEvent('noteTitleUpdated', {
      detail: { noteId: id, title: finalTitle }
    }));
  }

  // Gestion du dessin - Insertion dans l'éditeur Lexical
  const handleDrawingSave = useCallback((drawingData: DrawingData) => {

    if (!editor) {
      console.error('❌ Editor non disponible');
      return;
    }

    editor.update(() => {
      const selection = $getSelection();

      // Créer un nouveau nœud image avec le dessin
      const imageNode = $createImageNode({
        src: drawingData.dataUrl,
        altText: "Drawing",
        width: Math.min(drawingData.width, 600),
        height: Math.min(drawingData.height, 600),
      });

      // Insérer le nœud image à la sélection actuelle ou à la fin
      if ($isRangeSelection(selection)) {
        $insertNodes([imageNode]);
      } else {
        const root = $getRoot();
        root.append(imageNode);
      }
    });

    // Forcer une sauvegarde immédiate après l'insertion du dessin
    setTimeout(() => {
      if (editor) {
        editor.getEditorState().read(() => {
          const json = editor.getEditorState().toJSON();
          const jsonString = JSON.stringify(json);

          SaveNote(id, { Content: jsonString }).catch((error) => {
            console.error('❌ Erreur sauvegarde après dessin:', error);
          });
        });
      }
    }, 100);
  }, [editor, id]);

  // Configuration Lexical - Charger l'état initial depuis la DB
  const initialConfig = {
    editorState: null, // Do not set initial editor state here when using YJS collaboration
    namespace: 'YanotelaNoteEditor',
    nodes: editorNodes,
    onError,
    theme,
  };

  // Charger les données de la note au montage
  useEffect(() => {
    async function loadNote() {
      try {
        setIsLoading(true);
        setHasError(false);

        const noteData = await GetNoteById(id);

        if (!noteData || 'error' in noteData) {
          setHasError(true);
          return;
        }

        const note = noteData;
        setNoteTitle(note.Titre || 'Sans titre');

        // ✅ Charger le contenu initial dans l'éditeur
        if (note.Content) {

          setInitialEditorContent(note.Content);
        } else {
          console.warn('⚠️ [LoadNote] Pas de contenu dans la note');
          setInitialEditorContent(null);
        }

        // ✅ Gestion des permissions (lecture seule)
        if (note.userRole !== undefined) {
          // Role 3 = lecture seule → bloquer l'édition
          const readOnly = note.userRole === 3;
          setIsReadOnly(readOnly);

          if (readOnly) {

          } else {

          }
        } else {
          console.warn('⚠️ [Permissions] userRole non reçu du serveur, défaut = édition');
          setIsReadOnly(false);
        }

      } catch (error) {
        console.error('❌ Erreur chargement note:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [id]);

  // Charger le profil utilisateur pour awareness
  const { user } = useAuth();

  useEffect(() => {
    // Si pas d'utilisateur authentifié, définir un profil anonyme
    if (!user) {
      setUserProfile({ name: 'Anonyme', color: '#999999' });
      return;
    }
    
    const pseudo = (user as any).pseudo || 'Anonyme';
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A1'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setUserProfile({ name: pseudo, color });
  }, [user]);

  // ✅ CRITIQUE: Mettre à jour l'awareness dès que le profil change
  useEffect(() => {
    // Récupérer l'userId pour la synchronisation automatique des permissions
    const userId = user ? (user as any).id : undefined;
    
    // Petit délai pour s'assurer que le provider est créé
    const timer = setTimeout(() => {
      setAwarenessUserInfo(id, userProfile.name, userProfile.color, userId);
    }, 500);

    setAwarenessUserInfo(id, userProfile.name, userProfile.color, userId);
    
    return () => clearTimeout(timer);
  }, [userProfile, id, user]);

  // Gestion des paramètres de recherche (assignation au dossier)
  useEffect(() => {
    // Ne pas permettre l'assignation de dossier pour les utilisateurs non authentifiés
    if (!user) return;
    
    const folderId = searchParams?.get('folderId');
    if (folderId && id) {
      AddNoteToFolder(id, folderId).then(() => {

        // Supprimer le paramètre après assignation
        const url = new URL(window.location.href);
        url.searchParams.delete('folderId');
        router.replace(url.pathname);
      }).catch((error) => {
        console.error('❌ Erreur assignation dossier:', error);
      });
    }
  }, [searchParams, id, router, user]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Écouter les événements de notification depuis les plugins
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { message, type } = event.detail;
      if (type === 'success') {
        setSuccess(message);
      } else if (type === 'error') {
        setError(message);
      }
    };

    window.addEventListener('showNotification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('showNotification', handleNotification as EventListener);
    };
  }, []);

  // Écouter les mises à jour de titre depuis le Breadcrumb (desktop)
  useEffect(() => {
    const handleTitleUpdate = (event: CustomEvent) => {
      const { noteId: updatedNoteId, title } = event.detail;
      // Vérifier que l'événement concerne bien cette note
      if (updatedNoteId === id) {

        setNoteTitle(title);
      }
    };

    window.addEventListener('noteTitleUpdated', handleTitleUpdate as EventListener);
    return () => {
      window.removeEventListener('noteTitleUpdated', handleTitleUpdate as EventListener);
    };
  }, [id]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Notifications */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-success-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-dangerous-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Mobile Header */}
      <div className="flex rounded-lg p-2.5 items-center md:hidden bg-primary text-white sticky top-2 z-10">
        <ReturnButton />
        {hasError ? (
          <p className="w-full font-semibold bg-transparent p-1">Erreur</p>
        ) : (
          <>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => !isReadOnly && setNoteTitle(e.target.value)}
              onBlur={(e) => updateNoteTitle(e.target.value)}
              className={`w-full font-semibold bg-transparent p-1 placeholder:text-textcardNote placeholder:font-medium focus:outline-white ${isReadOnly ? 'cursor-not-allowed' : ''
                }`}
              disabled={isReadOnly}
            />
            <div className="relative">
              <button
                onClick={() => setShowNoteMore((prev) => !prev)}
                aria-label="Ouvrir les options de la note"
                className="focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
              >
                <MoreIcon className="text-white cursor-pointer w-5 h-5" />
              </button>
              {showNoteMore && (
                <div className="absolute right-0 mt-2 z-30">
                  <NoteMore noteId={id} onClose={() => setShowNoteMore(false)} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {hasError ? (
        <ErrorFetch type="fetch" />
      ) : isLoading ? (
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
        <div className="relative bg-fondcardNote text-textcardNote p-4 pb-24 rounded-lg flex flex-col flex-1 overflow-visible">
          {/* Drawing Board */}
          {!isReadOnly && (
            <DrawingBoard
              isOpen={isDrawingBoardOpen}
              onSave={handleDrawingSave}
              onClose={() => setIsDrawingBoardOpen(false)}
            />
          )}

          {/* ✅ Éditeur Lexical avec CollaborationPlugin YJS + support dessin */}
          <div ref={containerRef}>
            <LexicalCollaboration>
              <LexicalComposer initialConfig={initialConfig}>
                {!isReadOnly && (
                  <ToolbarPlugin
                    onOpenDrawingBoard={() => setIsDrawingBoardOpen(true)}
                    noteTitle={noteTitle}
                    editorContentRef={editorContentRef}
                  />
                )}

                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      ref={editorContentRef as any}
                      className={`editor-root mt-2 h-full focus:outline-none ${isReadOnly ? 'cursor-default select-text' : ''
                        }`}
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />

                <ListPlugin />
                {!isReadOnly && <AutoFocusPlugin />}
                {!isReadOnly && <DrawingInsertPlugin onDrawingInsertRequest={(fn) => { insertDrawingRef.current = fn; }} />}

                {/* Plugin pour récupérer la référence de l'éditeur (pour dessins) */}
                <EditorRefPlugin onEditorReady={setEditor} />

                {/* Charger le contenu initial depuis la base de données (yjs-aware) */}
                <LoadInitialContentPlugin content={initialEditorContent} noteId={id} />

                {/* ✅ Toujours utiliser CollaborationPlugin pour la sync temps réel */}
                <CollaborationPlugin
                  id={id}
                  providerFactory={providerFactory}
                  shouldBootstrap={true}
                  username={isReadOnly ? `${userProfile.name} 👁️` : userProfile.name}
                  cursorColor={isReadOnly ? '#999999' : userProfile.color}
                  cursorsContainerRef={containerRef}
                />

                {/* Plugins d'édition (désactivés en lecture seule) */}
                {!isReadOnly && (
                  <>
                    <YjsSyncPlugin
                      noteId={id}
                      isReadOnly={isReadOnly}
                    />
                    <TitleSyncPlugin
                      noteId={id}
                      title={noteTitle}
                      onTitleChange={setNoteTitle}
                      isReadOnly={isReadOnly}
                    />
                  </>
                )}

                {/* Bloquer l'édition APRÈS que le binding YJS soit créé */}
                <ReadOnlyPlugin isReadOnly={isReadOnly} />
              </LexicalComposer>
            </LexicalCollaboration>
          </div>
        </div>
      )}
    </div>
  );
}