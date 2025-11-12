"use client";

import { $getRoot, EditorState, $insertNodes,  $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import ExportPDFButton from "@/ui/exportpdfbutton";
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
import { useDebouncedCallback } from "use-debounce";
import { motion, AnimatePresence } from "motion/react";
import Icons from '@/ui/Icon';
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter, useSearchParams } from "next/navigation";
import { createWebsocketProvider, setAwarenessUserInfo } from "@/collaboration/providers";
import DrawingBoard, { DrawingData } from "@/components/drawingBoard/drawingBoard";
import SyncButton, { SyncStatus } from "@/ui/syncButton";
import { $createImageNode } from "@/components/flashnote/ImageNode";
import * as Y from 'yjs';

import { GetNoteById, AddNoteToFolder } from "@/loader/loader";
import { SaveNote } from "@/loader/loader";

import ErrorFetch from "@/ui/note/errorFetch";
import ToolbarPlugin from '@/components/textRich/ToolbarPlugin';
import { editorNodes } from "@/components/textRich/editorNodes";
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TitleSyncPlugin } from '@/components/collaboration/TitleSyncPlugin';
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
 * Plugin pour gérer onChange et sauvegarde HTTP
 */
function OnChangeBehavior({ onContentChange }: { noteId: string, onContentChange: (content: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }: { editorState: EditorState }) => {
      editorState.read(() => {
        const json = editorState.toJSON();
        const jsonString = JSON.stringify(json);
        onContentChange(jsonString);
      });
    });
  }, [editor, onContentChange]);

  return null;
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

        console.log('🎨 [Drawing] Image insérée dans l\'éditeur via YJS');
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
      console.log('🔒 [YjsSync] Mode lecture seule, sync désactivé');
      setSyncStatus('synced');
      return;
    }

    console.log('✅ [YjsSync] Plugin initialisé pour note', noteId);

    // Marquer qu'il y a eu des changements à chaque update
    const unregister = editor.registerUpdateListener(() => {
      hasChangesRef.current = true;
      setSyncStatus('pending');
      console.log('📝 [YjsSync] Changement détecté → pending');
    });

    // Sync automatique toutes les 2 secondes si changements
    const syncInterval = setInterval(async () => {
      // Vérifier s'il y a des changements de contenu
      if (!hasChangesRef.current) return;
      
      const now = Date.now();
      if (now - lastSyncRef.current < 2000) return; // Throttle minimum 2s

      try {
        setSyncStatus('syncing');
        console.log('🔄 [YjsSync] Début synchronisation...');
        
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
        console.log('📦 [YjsSync] yjsState encodé:', yjsState.length, 'octets');
        
        // Récupérer le contenu Lexical JSON
        const lexicalJSON = editor.getEditorState().toJSON();
        const Content = JSON.stringify(lexicalJSON);
        console.log('📄 [YjsSync] Content JSON:', Content.substring(0, 100) + '...');

        // Envoyer au serveur
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('🚀 [YjsSync] Envoi vers', `${API_URL}/note/sync/${noteId}`);
        
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
          const data = await response.json();
          console.log('✅ [YjsSync] Synchronisé avec DB, ModifiedAt:', data.ModifiedAt);
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
        console.log('ℹ️ [YjsSync] Aucun changement à synchroniser');
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
      console.log('🛑 [YjsSync] Plugin nettoyé');
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
    // Mettre à jour l'état readonly de l'éditeur
    editor.setEditable(!isReadOnly);
    
    if (isReadOnly) {
      console.log('🔒 [ReadOnly] Éditeur verrouillé');
    }
  }, [editor, isReadOnly]);

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

  // États pour les notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const { id } = use(params);

  // ✅ State pour profil utilisateur (utilisé par CollaborationPlugin)
  const [userProfile, setUserProfile] = useState({ name: 'Anonyme', color: '#FF5733' });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorContentRef = useRef<HTMLDivElement | null>(null); // Ref pour le ContentEditable (export PDF)
  
  // Ref pour la fonction d'insertion de dessin
  const drawingInsertCallbackRef = useRef<((data: DrawingData) => void) | null>(null);

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
    
    console.log('📝 [Title] Titre mis à jour:', finalTitle);
    
    // Émettre un événement pour synchroniser avec le Breadcrumb
    window.dispatchEvent(new CustomEvent('noteTitleUpdated', { 
      detail: { noteId: id, title: finalTitle } 
    }));
  }

  // Sauvegarde HTTP debounced du contenu
  const debouncedSaveContent = useDebouncedCallback(
    (content: string) => {
      if (isReadOnly) {
        console.warn('🔒 [Permissions] Sauvegarde contenu bloquée (lecture seule)');
        return;
      }
      
      SaveNote(id, { Content: content }).then(() => {
        
      }).catch((error) => {
        console.error('❌ Erreur sauvegarde contenu:', error);
      });
    },
    2000 // Sauvegarde toutes les 2 secondes max
  );

  const handleContentChange = useCallback((content: string) => {
    debouncedSaveContent(content);
  }, [debouncedSaveContent]);

  // Gestion du dessin - Insertion dans l'éditeur Lexical
  const handleDrawingSave = useCallback((drawingData: DrawingData) => {
    console.log('🎨 Sauvegarde du dessin dans la note', drawingData);
    
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
          console.log('💾 Sauvegarde forcée après dessin');
          SaveNote(id, { Content: jsonString }).catch((error) => {
            console.error('❌ Erreur sauvegarde après dessin:', error);
          });
        });
      }
    }, 100);
  }, [editor, id]);

  // ✅ Configuration Lexical - Charger l'état initial depuis la DB
  const initialConfig = {
    editorState: null,  // État chargé depuis la DB
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
        
        // ✅ Gestion des permissions (lecture seule)
        if (note.userRole !== undefined) {
          // Role 3 = lecture seule → bloquer l'édition
          const readOnly = note.userRole === 3;
          setIsReadOnly(readOnly);
          
          if (readOnly) {
            console.log('🔒 [Permissions] Mode lecture seule activé (role 3)');
          }
        } else {
          console.warn('⚠️ [Permissions] userRole non reçu du serveur');
          setIsReadOnly(false);
        }
        
        setIsReadOnly(false); // TODO: Récupérer depuis permissions

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
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('🔍 [Auth] Appel à:', `${API_URL}/auth/check`);

        const response = await fetch(`${API_URL}/auth/check`, {
          credentials: "include",
        });

        console.log('📡 [Auth] Response status:', response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log('📦 [Auth] userData reçu:', userData);

          const pseudo = userData.pseudo || userData.user?.pseudo || 'Anonyme';

          // Générer une couleur aléatoire pour ce user
          const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33A1'];
          const color = colors[Math.floor(Math.random() * colors.length)];

          setUserProfile({ name: pseudo, color });

        }
      } catch (error) {
        console.error('❌ Erreur récupération profil:', error);
      }
    }

    fetchUserInfo();
  }, []);




   // ✅ CRITIQUE: Mettre à jour l'awareness dès que le profil change
  useEffect(() => {
    // Petit délai pour s'assurer que le provider est créé
    const timer = setTimeout(() => {
      
      setAwarenessUserInfo(id, userProfile.name, userProfile.color);
    }, 500);

    setAwarenessUserInfo(id, userProfile.name, userProfile.color);
  }, [userProfile, id]);

  // Gestion des paramètres de recherche (assignation au dossier)
  useEffect(() => {
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
  }, [searchParams, id, router]);

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
        console.log('📥 [Title] Mise à jour reçue du Breadcrumb:', title);
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
              className={`w-full font-semibold bg-transparent p-1 placeholder:text-textcardNote placeholder:font-medium focus:outline-white ${
                isReadOnly ? 'cursor-not-allowed' : ''
              }`}
              disabled={isReadOnly}
            />
            <div className="relative">
              <span onClick={() => setShowNoteMore((prev) => !prev)}>
                <Icons name="more" size={20} className="text-white cursor-pointer" />
              </span>
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
                      className={`editor-root mt-2 h-full focus:outline-none ${
                        isReadOnly ? 'cursor-not-allowed' : ''
                      }`}
                      contentEditable={!isReadOnly}
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />

                <ListPlugin />
                {!isReadOnly && <AutoFocusPlugin />}
                
                {/* Plugin pour récupérer la référence de l'éditeur (pour dessins) */}
                <EditorRefPlugin onEditorReady={setEditor} />
                
                <ReadOnlyPlugin isReadOnly={isReadOnly} />
                <CollaborationPlugin
                  id={id}
                  providerFactory={providerFactory}
                  shouldBootstrap={false} 
                  username={userProfile.name}
                  cursorColor={userProfile.color}
                  cursorsContainerRef={containerRef}
                />
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
              </LexicalComposer>
            </LexicalCollaboration>
          </div>
        </div>
      )}
    </div>
  );
}
