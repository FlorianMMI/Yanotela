"use client";

import React from "react";
import { $getRoot, EditorState, $getSelection, $isRangeSelection, $getNodeByKey, LexicalEditor } from "lexical";
import { useEffect, useState, useCallback } from "react";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDebouncedCallback } from "use-debounce";
import { motion } from "motion/react";
import { useAuth } from '@/hooks/useAuth';

import SaveFlashNoteButton from "@/components/flashnote/SaveFlashNoteButton";
import DrawingBoard, { DrawingData } from "../drawingBoard/drawingBoard";
import { $createImageNode } from "./ImageNode";
import { $insertNodes } from "lexical";
import ToolbarPlugin from '@/components/textRich/ToolbarPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { editorNodes } from "@/components/textRich/editorNodes";
import ImageClickPlugin from "./ImageClickPlugin";
import '@/components/textRich/EditorStyles.css';
import { CheckIcon, FlashIcon, InfoIcon } from "@/libs/Icons";

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
  
}

// Clés localStorage pour Flash Note
const FLASH_NOTE_CONTENT_KEY = "yanotela:flashnote:content";

export default function FlashNoteWidget() {
  const [, setEditorContent] = useState("");
  const [initialEditorState, setInitialEditorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editor, setEditor] = useState<LexicalEditor | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDrawingBoardOpen, setIsDrawingBoardOpen] = useState(false);
  const [editingImageSrc, setEditingImageSrc] = useState<string | undefined>(undefined);
  const [editingImageNodeKey, setEditingImageNodeKey] = useState<string | undefined>(undefined);
  
  // Hook pour l'authentification
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Charger les données depuis localStorage
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem(FLASH_NOTE_CONTENT_KEY);
      if (savedContent) {
        try {
          JSON.parse(savedContent);
          setInitialEditorState(savedContent);
          setEditorContent(savedContent);
          // Notify other components in the same tab that flash content was loaded
          if (typeof window !== 'undefined') {
            try {
              window.dispatchEvent(new CustomEvent('yanotela:flashnote:updated', { detail: savedContent }));
            } catch (err) {
              void err;
            }
          }
        } catch {
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
          if (typeof window !== 'undefined') {
            try {
              window.dispatchEvent(new CustomEvent('yanotela:flashnote:updated', { detail: JSON.stringify(simpleState) }));
            } catch (err) {
              void err;
            }
          }
        }
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initialConfig = {
    namespace: "FlashNoteWidget",
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
      // Create a new image node with the drawing
      const imageNode = $createImageNode({
        src: drawingData.dataUrl,
        altText: "Drawing",
        width: Math.min(drawingData.width, 600), // Limit max width
        height: Math.min(drawingData.height, 600),
      });

      // If we're editing an existing image, replace it
      if (editingImageNodeKey) {
        const existingNode = $getNodeByKey(editingImageNodeKey);
        if (existingNode) {
          existingNode.replace(imageNode);
          return;
        }
      }

      // Otherwise, insert as a new node
      const selection = $getSelection();
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

        // Notify in-tab listeners that flash content changed
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(new CustomEvent('yanotela:flashnote:updated', { detail: contentString }));
          } catch (err) {
            void err;
          }
        }

        // Reset saving state after a short delay
        setTimeout(() => {
          setIsSavingContent(false);
        }, 300);
      }
    }, 100);

    // Clear the editing image and close the board
    setEditingImageSrc(undefined);
    setEditingImageNodeKey(undefined);
  }, [editor, editingImageNodeKey]);

  const handleImageClick = useCallback((src: string, nodeKey?: string) => {
    setEditingImageSrc(src);
    setEditingImageNodeKey(nodeKey);
    setIsDrawingBoardOpen(true);
  }, []);

  const handleDrawingBoardClose = useCallback(() => {
    setIsDrawingBoardOpen(false);
    setEditingImageSrc(undefined);
    setEditingImageNodeKey(undefined);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    const editorElem = editor.getRootElement();
    if (e.target === editorElem) {
      focusAtEnd();
    }
  };

  function OnChangeBehavior() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
      setEditor(editor);
    }, [editor]);

    const debouncedSave = useDebouncedCallback(
      (editorState: EditorState) => {
        saveContent(editorState);
      },
      500
    );

    function saveContent(editorState: EditorState) {
      setIsSavingContent(true);
      setIsTyping(false);

      try {
        const editorStateJSON = editorState.toJSON();
        const contentString = JSON.stringify(editorStateJSON);
        setEditorContent(contentString);
        localStorage.setItem(FLASH_NOTE_CONTENT_KEY, contentString);

        // Notify in-tab listeners that flash content changed
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(new CustomEvent('yanotela:flashnote:updated', { detail: contentString }));
          } catch (err) {
            void err;
          }
        }

        setTimeout(() => {
          setIsSavingContent(false);
        }, 300);
      } catch (error) {
        
        setIsSavingContent(false);
      }
    }

    useEffect(() => {
      type UpdatePayload = {
        editorState: EditorState;
        dirtyElements?: Set<string>;
        dirtyLeaves?: Set<string>;
        tags?: Set<string | symbol>;
      };

      const unregisterListener = editor.registerUpdateListener((update: UpdatePayload) => {
        const { editorState, dirtyElements, dirtyLeaves, tags } = update;
        // Save on any update: dirty elements/leaves OR explicit updates (like node insertions)
        if ((dirtyElements?.size ?? 0) > 0 || (dirtyLeaves?.size ?? 0) > 0 || (tags && !tags.has('history-merge'))) {
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
    <div className="h-full flex flex-col p-4 gap-3">
      {/* En-tête avec titre et bouton de sauvegarde */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlashIcon width={24} height={24} strokeWidth={12} className="text-primary" />
          <h2 className="text-xl font-semibold text-clrprincipal">Flash Note</h2>
        </div>
        <SaveFlashNoteButton variant="default" />
      </div>

      {/* Bandeau d'information */}
      {!authLoading && !isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-info-50 border border-info-100 rounded-lg p-3 flex items-center gap-3"
        >
          <InfoIcon width={18} height={18} className="text-blue shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-info-800">
              Les flashnotes sont temporaires. Pour les conserver de façon permanente,{' '}
              <span className="font-semibold">connectez-vous</span>.
            </p>
          </div>
        </motion.div>
      )}

      {/* Éditeur */}
      {isLoading ? (
        <div className="flex-1 bg-fondcardNote rounded-lg flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-textcardNote text-sm font-medium">Chargement...</p>
          </motion.div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="relative flex-1 bg-fondcardNote text-textcardNote p-4 rounded-lg overflow-visible"
        >
          {/* Indicateur de sauvegarde */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="group relative">
              {(isSavingContent || isTyping) ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              ) : (
                <CheckIcon width={20} height={20} className="h-5 w-5 text-primary" />
              )}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-primary text-background text-xs rounded py-1 px-2 whitespace-nowrap">
                Enregistrement automatique de votre note temporaire
                <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
              </div>
            </div>
          </div>

          <DrawingBoard
            isOpen={isDrawingBoardOpen}
            onSave={handleDrawingSave}
            onClose={handleDrawingBoardClose}
            initialImage={editingImageSrc}
          />

          <LexicalComposer initialConfig={initialConfig} key={initialEditorState}>
            <ToolbarPlugin onOpenDrawingBoard={() => setIsDrawingBoardOpen(true)} />
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder="Votre Flash Note..."
                  placeholder={
                    <p className="absolute top-4 md:top-20 left-4 text-textcardNote select-none pointer-events-none opacity-50">
                      Votre Flash Note...
                    </p>
                  }
                  className="editor-root md:mt-2 focus:outline-none min-h-[200px]"
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <ImageClickPlugin onClick={handleImageClick} />
            <OnChangeBehavior />
            <AutoFocusPlugin />
          </LexicalComposer>
        </div>
      )}
    </div>
  );
}
