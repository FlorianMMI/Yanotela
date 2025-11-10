"use client";

import { $getRoot, EditorState, $getSelection, $isRangeSelection } from "lexical";
import React, { useEffect, useState, use, useRef, useCallback } from "react";
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
import { motion } from "motion/react";
import Icons from '@/ui/Icon';
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter, useSearchParams } from "next/navigation";
import ConnectedUsers from "@/components/collaboration/ConnectedUsers";
import { createWebsocketProvider, setAwarenessUserInfo } from "@/collaboration/providers";
import DrawingBoard, { DrawingData } from "@/components/drawingBoard/drawingBoard";
import { ImageNode, $createImageNode } from "@/components/flashnote/ImageNode";
import { AudioNode } from "@/components/flashnote/AudioNode";
import { VideoNode } from "@/components/flashnote/VideoNode";
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
  console.error('[Lexical Error]', error);
}

/**
 * Plugin pour gérer onChange et sauvegarde HTTP
 */
function OnChangeBehavior({ noteId, onContentChange }: { noteId: string, onContentChange: (content: string) => void }) {
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
 * Plugin pour insérer des dessins via callback
 */
function DrawingInsertPlugin({ onReady }: { onReady: (insertFn: (data: DrawingData) => void) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const insertDrawing = (drawingData: DrawingData) => {
      editor.update(() => {
        const imageNode = $createImageNode({
          src: drawingData.dataUrl,
          width: drawingData.width,
          height: drawingData.height,
          altText: `Drawing from ${new Date(drawingData.timestamp).toLocaleString()}`,
          isDrawing: true, // Mark as drawing to show dashed border
        });
        $insertNodes([imageNode]);
      });
    };

    onReady(insertDrawing);
  }, [editor, onReady]);

  return null;
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

  const [noteTitle, setNoteTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasError, setHasError] = useState(false);
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);

  // Ref to store the drawing insert function
  const insertDrawingRef = useRef<((data: DrawingData) => void) | null>(null);

  // États pour les notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Sauvegarde HTTP debounced du titre
  const debouncedSaveTitle = useDebouncedCallback(
    (titre: string) => {
      SaveNote(id, { Titre: titre }).then(() => {
        
      }).catch((error) => {
        console.error('❌ Erreur sauvegarde titre:', error);
      });
    },
    1000
  );

  function updateNoteTitle(newTitle: string) {
    if (isReadOnly) return;
    
    const finalTitle = newTitle.trim() === '' ? 'Sans titre' : newTitle;
    setNoteTitle(finalTitle);
    debouncedSaveTitle(finalTitle);
    
    // Émettre un événement pour synchroniser avec le Breadcrumb
    window.dispatchEvent(new CustomEvent('noteTitleUpdated', { 
      detail: { noteId: id, title: finalTitle } 
    }));
  }

  // Sauvegarde HTTP debounced du contenu
  const debouncedSaveContent = useDebouncedCallback(
    (content: string) => {
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

  // Gestion du dessin
  const handleDrawingSave = useCallback((drawingData: DrawingData) => {
    // Use the ref to insert the drawing directly into the editor
    if (insertDrawingRef.current) {
      insertDrawingRef.current(drawingData);
    }
  }, []);

  // ✅ Configuration Lexical - CRITIQUE: editorState DOIT être null pour collaboration
  const initialConfig = {
    editorState: null,  // ← NE PAS initialiser, laisser CollaborationPlugin gérer
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
        // Note: userRole n'existe pas dans le type Note, on utilise isReadOnly basé sur les permissions
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
      console.log('👤 [Awareness] Tentative mise à jour avec:', userProfile);
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

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Notifications */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
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
        <div className="relative bg-fondcardNote text-textcardNote p-4 pb-24 rounded-lg flex flex-col overflow-visible">
          {/* Drawing Board */}
          {!isReadOnly && (
            <DrawingBoard 
              isOpen={isDrawingBoardOpen} 
              onSave={handleDrawingSave}
              onClose={() => setIsDrawingBoardOpen(false)}
            />
          )}

          {/* ✅ NOUVEAU: Wrapper LexicalCollaboration + CollaborationPlugin */}
          <div ref={containerRef}>
            <LexicalCollaboration>
              <LexicalComposer initialConfig={initialConfig}>
                {!isReadOnly && <ToolbarPlugin onOpenDrawingBoard={() => setIsDrawingBoardOpen(true)} />}
                
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      className={`editor-root mt-5 min-h-[400px] focus:outline-none ${
                        isReadOnly ? 'cursor-not-allowed' : ''
                      }`}
                      contentEditable={!isReadOnly}
                    />
                  }
                  placeholder={
                    <p className="absolute top-22 left-4 text-textcardNote select-none pointer-events-none">
                      Commencez à écrire...
                    </p>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />

                <ListPlugin />
                {!isReadOnly && <AutoFocusPlugin />}
                {!isReadOnly && <DrawingInsertPlugin onReady={(fn) => { insertDrawingRef.current = fn; }} />}
                
                {/* ✅ Plugin officiel de collaboration Lexical + YJS */}
                <CollaborationPlugin
                  id={id}
                  providerFactory={providerFactory}
                  shouldBootstrap={false} 
                  username={userProfile.name}
                  cursorColor={userProfile.color}
                  cursorsContainerRef={containerRef}
                />
              </LexicalComposer>
            </LexicalCollaboration>
          </div>
        </div>
      )}
    </div>
  );
}
