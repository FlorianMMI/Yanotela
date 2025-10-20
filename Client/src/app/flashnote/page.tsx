"use client";
import React from "react";
import { $getRoot, EditorState } from "lexical";
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

const theme = {
  // Theme styling goes here
  //...
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
    if (e.target === editorElem) {
      focusAtEnd();
    }
  };

  // Sauvegarder le titre dans localStorage
  function updateNoteTitle(newTitle: string) {
    const finalTitle = newTitle.trim() === '' ? 'Flash:' : newTitle;
    setNoteTitle(finalTitle);

    try {
      localStorage.setItem(FLASH_NOTE_TITLE_KEY, finalTitle);
      // Émettre un événement pour synchroniser avec le breadcrumb
      window.dispatchEvent(new CustomEvent('flashnote-title-updated'));
      setSuccess('Titre sauvegardé localement');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Erreur localStorage titre:', error);
      setError('Erreur lors de la sauvegarde du titre');
      setTimeout(() => setError(null), 3000);
    }
  }

  // Gérer les changements de titre en temps réel
  const handleTitleChange = (newTitle: string) => {
    setNoteTitle(newTitle);
    // Sauvegarder immédiatement dans localStorage pour que le composant SaveFlashNoteButton puisse y accéder
    try {
      // Ne pas sauvegarder une chaîne vide, garder au moins "Flash:"
      const titleToSave = newTitle.trim() === '' ? 'Flash:' : newTitle;
      localStorage.setItem(FLASH_NOTE_TITLE_KEY, titleToSave);
      // Émettre un événement pour synchroniser avec le breadcrumb
      window.dispatchEvent(new CustomEvent('flashnote-title-updated'));
    } catch (error) {
      console.error('Erreur localStorage titre:', error);
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
      const unregisterListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }: any) => {
        if (dirtyElements?.size > 0 || dirtyLeaves?.size > 0) {
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
        <div onClick={handleClick} className="relative bg-fondcardNote text-textcardNote p-4 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-auto">
          {/* Indicateur de sauvegarde */}
          <div className="absolute bottom-4 right-4 z-10">
            {(isSavingContent || isTyping) ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            ) : (
              <Icons name="save" size={20} className="h-5 w-5 text-primary" />
            )}
          </div>

          <LexicalComposer initialConfig={initialConfig} key={initialEditorState}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  aria-placeholder="Votre Flash Note..."
                  placeholder={
                    <p className="absolute top-4 left-4 text-textcardNote select-none pointer-events-none">
                      Votre Flash Note...
                    </p>
                  }
                  className="h-full focus:outline-none"
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