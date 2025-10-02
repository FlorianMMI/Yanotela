"use client";
import React from "react";
import { $getRoot, EditorState } from "lexical";
import { useEffect, useState, use } from "react";

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
import NoteMore from "@/components/noteMore/NoteMore";
import { useRouter } from "next/navigation";

import { GetNoteById } from "@/loader/loader";
import { SaveNote } from "@/loader/loader";

import ErrorFetch from "@/ui/note/errorFetch";

const theme = {
  // Theme styling goes here
  //...
};

function onError(error: string | Error) {
  console.error(error);
}

function uploadContent(id: string, noteTitle: string, editorContent: string) {
  SaveNote(id, {
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
  const [noteTitle, setNoteTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [initialEditorState, setInitialEditorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [showNoteMore, setShowNoteMore] = useState(false);

  // Unwrap params using React.use()
  const { id } = use(params);


  function updateNoteTitle(newTitle: string) {
    setNoteTitle(newTitle);
    uploadContent(id, newTitle, editorContent);
  }

  useEffect(() => {
    const fetchNote = async () => {
      // Récupération de l'ID depuis les params unwrappés (garder comme string)
      const noteId = id;

      if (noteId) {
        const note = await GetNoteById(noteId);
        if (note) {
          setNoteTitle(note.Titre);
          // Si on a du contenu, on le parse pour l'éditeur
          if (note.Content) {
            try {
              // Vérifier si c'est déjà du JSON valide
              const parsedContent = JSON.parse(note.Content);
              setInitialEditorState(note.Content);
            } catch {
              // Si ce n'est pas du JSON, on crée un état d'éditeur simple avec le texte
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
          }
          setEditorContent(note.Content || "");
        }
        else {

          setHasError(true);
        }
      }
      setIsLoading(false);
    };

    fetchNote();
  }, [id]); // Dépendance sur l'ID unwrappé

  const initialConfig = {
    namespace: "Editor",
    theme,
    onError,
    // Utiliser l'état initial si disponible
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
    // Si on clique directement sur la zone d'édition (mais pas sur du texte)
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

    // Debounced callback for logging editor state
    const debouncedLog = useDebouncedCallback(
      (editorState: EditorState) => {
        saveContent(editorState);
      },
      1000 // 1-second debounce
    );

    function saveContent(editorState: EditorState) {
      // Call toJSON on the EditorState object, which produces a serialization safe string
      const editorStateJSON = editorState.toJSON();
      // However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
      setEditorContent(JSON.stringify(editorStateJSON));
      uploadContent(id, noteTitle, JSON.stringify(editorStateJSON));

    }

    useEffect(() => {
      const unregisterListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
        // Only trigger the debounced log if there are changes to the content
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          debouncedLog(editorState);
        }
      });

      return () => {
        unregisterListener();
      };
    }, [editor, debouncedLog]);

    return null;
  }

  return (
    <div className="flex flex-col p-2.5 h-fit min-h-full gap-2.5">
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
              onChange={(e) => setNoteTitle(e.target.value)}
              onBlur={(e) => updateNoteTitle(e.target.value)}
              className="w-full font-semibold bg-transparent p-1 placeholder:text-textcardNote placeholder:font-medium focus:outline-white"
              placeholder="Titre de la note"
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
                <div className="absolute right-0 mt-2 z-20">
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
            <div onClick={handleClick} className="relative bg-fondcardNote text-textcardNote p-4 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-auto">
              <LexicalComposer initialConfig={initialConfig} key={initialEditorState}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      aria-placeholder={"Commencez à écrire..."}
                      placeholder={
                        <p className="absolute top-4 left-4 text-textcardNote select-none pointer-events-none">
                          Commencez à écrire...
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
          </>
        )
      }

    </div>
  );
}
