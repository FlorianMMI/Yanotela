"use client";

import React from "react";
import { $getRoot, EditorState, $getSelection, $isRangeSelection } from "lexical";
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
import Icons from '@/ui/Icon';
import SaveFlashNoteButton from "@/components/flashnote/SaveFlashNoteButton";
import DrawingBoard, { DrawingData } from "../drawingBoard/drawingBoard";
import { ImageNode, $createImageNode } from "./ImageNode";
import { $insertNodes } from "lexical";

const theme = {};

function onError(error: string | Error) {
  console.error(error);
}

// Clés localStorage pour Flash Note
const FLASH_NOTE_TITLE_KEY = "yanotela:flashnote:title";
const FLASH_NOTE_CONTENT_KEY = "yanotela:flashnote:content";

export default function FlashNoteWidget() {
  const [editorContent, setEditorContent] = useState("");
  const [initialEditorState, setInitialEditorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editor, setEditor] = useState<any>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Charger les données depuis localStorage
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem(FLASH_NOTE_CONTENT_KEY);
      if (savedContent) {
        try {
          JSON.parse(savedContent);
          setInitialEditorState(savedContent);
          setEditorContent(savedContent);
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
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initialConfig = {
    namespace: "FlashNoteWidget",
    theme,
    onError,
    nodes: [ImageNode], // Register the ImageNode
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

        setTimeout(() => {
          setIsSavingContent(false);
        }, 300);
      } catch (error) {
        console.error('Erreur localStorage contenu:', error);
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
    <div className="h-full flex flex-col p-4 gap-3">
      {/* En-tête avec titre et bouton de sauvegarde */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons name="flash" size={24} strokeWidth={12} className="text-primary" />
          <h2 className="text-xl font-semibold text-clrprincipal">Flash Note</h2>
        </div>
        <SaveFlashNoteButton variant="default" />
      </div>

      {/* Bandeau d'information */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3"
      >
        <Icons name="info" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-blue-800">
            Les flashnotes sont temporaires. Pour les conserver de façon permanente,{' '}
            <span className="font-semibold">connectez-vous</span>.
          </p>
        </div>
      </motion.div>

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
          className="relative flex-1 bg-fondcardNote text-textcardNote p-4 rounded-lg overflow-auto"
        >
          {/* Indicateur de sauvegarde */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="group relative">
              {(isSavingContent || isTyping) ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              ) : (
              <Icons name="Checkk" size={20} className="h-5 w-5 text-primary" />
              )}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-primary text-background text-xs rounded py-1 px-2 whitespace-nowrap">
                Enregistrement automatique de votre note temporaire
                <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
              </div>
            </div>
          </div>

          <DrawingBoard isOpen={false} onSave={handleDrawingSave} />

          <LexicalComposer initialConfig={initialConfig} key={initialEditorState}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder="Votre Flash Note..."
                  placeholder={
                    <p className="absolute top-4 left-4 text-textcardNote select-none pointer-events-none opacity-50">
                      Votre Flash Note...
                    </p>
                  }
                  className="h-full focus:outline-none min-h-[200px]"
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <OnChangeBehavior />
            <AutoFocusPlugin />
          </LexicalComposer>
        </div>
      )}
    </div>
  );
}
