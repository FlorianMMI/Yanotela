"use client";

import { $getRoot, EditorState, $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import React, { useEffect, useState, use, useCallback } from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import ReturnButton from "@/ui/returnButton";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDebouncedCallback } from "use-debounce";
import { motion } from "motion/react";
import Icons from '@/ui/Icon';
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter, useSearchParams } from "next/navigation";
import DrawingBoard, { DrawingData } from "@/components/drawingBoard/drawingBoard";
import { $createImageNode } from "@/components/flashnote/ImageNode";
import { $insertNodes } from "lexical";

import { GetNoteById, AddNoteToFolder } from "@/loader/loader";
import { SaveNote } from "@/loader/loader";

import ErrorFetch from "@/ui/note/errorFetch";
import ToolbarPlugin from '@/components/textRich/ToolbarPlugin';
import { editorNodes } from "@/components/textRich/editorNodes";
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
  const [noteTitle, setNoteTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasError, setHasError] = useState(false);
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);

  // États pour les notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const { id } = use(params);

  // ✅ État initial de l'éditeur (chargé depuis la DB)
  const [initialEditorState, setInitialEditorState] = useState<string | null>(null);

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

  // Référence à l'éditeur Lexical
  const [editor, setEditor] = useState<LexicalEditor | null>(null);

  // Gestion du dessin
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
    editorState: initialEditorState,  // État chargé depuis la DB
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
        
        // ✅ Charger le contenu de la note dans l'éditeur
        if (note.Content) {
          try {
            // Vérifier si c'est du JSON Lexical valide
            JSON.parse(note.Content);
            setInitialEditorState(note.Content);
          } catch {
            // Si ce n'est pas du JSON, créer un état Lexical simple
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
        } else {
          setInitialEditorState(null);
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
        <div className="relative bg-fondcardNote text-textcardNote p-4 pb-24 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-visible">
          {/* Drawing Board */}
          {!isReadOnly && (
            <DrawingBoard 
              isOpen={isDrawingBoardOpen} 
              onSave={handleDrawingSave}
              onClose={() => setIsDrawingBoardOpen(false)}
            />
          )}

          {/* ✅ Éditeur Lexical simplifié sans collaboration YJS */}
          <div>
            <LexicalComposer initialConfig={initialConfig}>
              {!isReadOnly && <ToolbarPlugin onOpenDrawingBoard={() => setIsDrawingBoardOpen(true)} />}
              
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={`editor-root mt-2 h-full focus:outline-none ${
                      isReadOnly ? 'cursor-not-allowed' : ''
                    }`}
                    contentEditable={!isReadOnly}
                  />
                }
                placeholder={
                  <p className="absolute top-20 left-4 text-textcardNote select-none pointer-events-none">
                    Commencez à écrire...
                  </p>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />

              <ListPlugin />
              {!isReadOnly && <AutoFocusPlugin />}
              
              {/* Plugin pour récupérer la référence de l'éditeur */}
              <EditorRefPlugin onEditorReady={setEditor} />
              
              {/* Plugin pour sauvegarder le contenu HTTP */}
              <OnChangeBehavior noteId={id} onContentChange={handleContentChange} />
            </LexicalComposer>
          </div>
        </div>
      )}
    </div>
  );
}
