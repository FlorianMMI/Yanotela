"use client";
import React from "react";
import { $getRoot, EditorState, $getSelection, $isRangeSelection, $insertNodes } from "lexical";
import { useEffect, useState } from "react";
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
import SaveFlashNoteButton from "@/components/flashnote/SaveFlashNoteButton";
import { useAuth } from "@/hooks/useAuth";
import DrawingBoard, { DrawingData } from "@/components/drawingBoard/drawingBoard";
import { ImageNode, $createImageNode } from "@/components/flashnote/ImageNode";
import ToolbarPlugin from '@/components/textRich/ToolbarPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { editorNodes } from "@/components/textRich/editorNodes";
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

// Clés localStorage pour Flash Note
const FLASH_NOTE_TITLE_KEY = "yanotela:flashnote:title";
const FLASH_NOTE_CONTENT_KEY = "yanotela:flashnote:content";

export default function FlashNoteEditor() {
  const [noteTitle, setNoteTitle] = useState("Flash:");
  const [editorContent, setEditorContent] = useState("");
  const [initialEditorState, setInitialEditorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editor, setEditor] = useState<any>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);

  // États pour les notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Charger les données depuis localStorage
  useEffect(() => {
    try {
      // Charger le titre
      const savedTitle = localStorage.getItem(FLASH_NOTE_TITLE_KEY);
      if (savedTitle) {
        setNoteTitle(savedTitle);
      }

      // Charger le contenu
      const savedContent = localStorage.getItem(FLASH_NOTE_CONTENT_KEY);
      if (savedContent) {
        try {
          // Vérifier si c'est du JSON valide
          JSON.parse(savedContent);
          setInitialEditorState(savedContent);
          setEditorContent(savedContent);
        } catch {
          // Si ce n'est pas du JSON, créer un état simple
          const simpleState = {
            root: {
              children: [{
                children: [{
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: savedContent,
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
          setEditorContent(JSON.stringify(simpleState));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initialConfig = {
    namespace: "FlashNoteEditor",
    theme,
    onError,
    nodes: editorNodes,
    editorState: initialEditorState ? initialEditorState : undefined,
  };

  const focusAtEnd = useCallback(() => {
    if (!editor) return;
    editor.update(() => {
      const root = $getRoot();
      root.selectEnd();
    });
  }, [editor]);

  const handleDrawingSave = useCallback((drawingData: DrawingData) => {
    if (!editor) return;
    
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

    // Manually trigger a save after inserting the drawing
    // Wait for the next tick to ensure the editor state has been updated
    setTimeout(() => {
      if (editor) {
        setIsSavingContent(true);
        setIsTyping(false);
        
        const editorState = editor.getEditorState();
        const editorStateJSON = editorState.toJSON();
        const contentString = JSON.stringify(editorStateJSON);
        setEditorContent(contentString);
        localStorage.setItem(FLASH_NOTE_CONTENT_KEY, contentString);
        
        // Reset saving state after a short delay
        setTimeout(() => {
          setIsSavingContent(false);
        }, 300);
      }
    }, 100);
  }, [editor]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    const editorElem = editor.getRootElement();
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

    // Debounced callback for saving editor state
    const debouncedSave = useDebouncedCallback(
      (editorState: EditorState) => {
        saveContent(editorState);
      },
      500 // 500ms debounce for faster local saving
    );

    function saveContent(editorState: EditorState) {
      setIsSavingContent(true);
      setIsTyping(false);

      try {
        const editorStateJSON = editorState.toJSON();
        const contentString = JSON.stringify(editorStateJSON);
        setEditorContent(contentString);

        // Sauvegarder dans localStorage
        localStorage.setItem(FLASH_NOTE_CONTENT_KEY, contentString);

        setTimeout(() => {
          setIsSavingContent(false);
        }, 300);
      } catch (error) {
        console.error('Erreur localStorage contenu:', error);
        setError('Erreur lors de la sauvegarde du contenu');
        setTimeout(() => setError(null), 3000);
        setIsSavingContent(false);
      }
    }

    useEffect(() => {
      const unregisterListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }: any) => {
        // Save on any update: dirty elements/leaves OR explicit updates (like node insertions)
        if (dirtyElements?.size > 0 || dirtyLeaves?.size > 0 || tags?.has('history-merge') === false) {
          setIsTyping(true);
          debouncedSave(editorState);
        }
      });

      return () => {
        unregisterListener();
      };
    }, [editor, debouncedSave]);

    return null;
  }

  return (
    <div className="flex flex-col p-2.5 h-fit min-h-full gap-2.5">
      {/* Bandeau d'information pour les utilisateurs non connectés */}
      {!authLoading && !isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3"
        >
          <Icons name="info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Mode hors ligne
            </h3>
            <p className="text-xs text-blue-800">
              Vos notes sont automatiquement enregistrées localement sur votre appareil. 
              Pour synchroniser vos notes en ligne et y accéder depuis n'importe où, 
              <button 
                onClick={() => window.location.href = '/login'} 
                className="underline font-medium hover:text-blue-600 ml-1"
              >
                connectez-vous
              </button>.
            </p>
          </div>
        </motion.div>
      )}

      {/* Zone de notifications */}
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50 max-w-md pl-4">
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

      {/* Barre mobile uniquement avec bouton de sauvegarde (sans input titre) */}
      <div className="flex rounded-lg p-2.5 justify-between items-center md:hidden bg-primary text-white sticky top-2 z-10">
        <ReturnButton />
        
        {/* Bouton de sauvegarde pour mobile */}
        <SaveFlashNoteButton 
          variant="mobile" 
          currentTitle={noteTitle}
          className="!bg-white !text-primary hover:!bg-gray-100"
        />
      </div>

      {isLoading ? (
        // Écran de chargement
        <div className="bg-white p-4 rounded-lg h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-textcardNote font-medium">Chargement de Flash Note...</p>
          </motion.div>
        </div>
      ) : (
        // Éditeur principal
        <div onClick={handleClick} className="relative bg-fondcardNote text-textcardNote p-4 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-visible">
          {/* Indicateur de sauvegarde */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="group relative">
              {(isSavingContent || isTyping) ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              ) : (
              <Icons name="save" size={20} className="h-5 w-5 text-primary" />
              )}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-primary text-background text-xs rounded py-1 px-2 whitespace-nowrap">
                Sauvegarder dans la mémoire de votre machine
                <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
              </div>
            </div>
          </div>

          {/* Drawing Board */}
          <DrawingBoard 
            isOpen={isDrawingBoardOpen} 
            onSave={handleDrawingSave}
            onClose={() => setIsDrawingBoardOpen(false)}
          />

          <LexicalComposer initialConfig={initialConfig} key={initialEditorState}>
            <ToolbarPlugin onOpenDrawingBoard={() => setIsDrawingBoardOpen(true)} />
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder="Votre Flash Note..."
                  placeholder={
                    <p className="absolute top-4 md:top-20 left-4 text-textcardNote select-none pointer-events-none">
                      Votre Flash Note...
                    </p>
                  }
                  className="editor-root md:mt-2 h-full focus:outline-none"
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <OnChangeBehavior />
            <AutoFocusPlugin />
          </LexicalComposer>
        </div>
      )}
    </div>
  );
}
