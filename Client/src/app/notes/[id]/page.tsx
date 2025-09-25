"use client";

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

import { useRouter } from "next/navigation";

import { GetNoteById } from "@/loader/loader";

const theme = {
  // Theme styling goes here
  //...
};

function onError(error: string | Error) {
  console.error(error);
}

export default function NoteEditor() {
  const [noteTitle, setNoteTitle] = useState("Titre de la note");
  const [editorContent, setEditorContent] = useState("");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      // Extract note id from the URL
      const pathParts = window.location.pathname.split("/");
      const noteId = parseInt(pathParts[pathParts.length - 1]);

      if (noteId) {
        const note = await GetNoteById(noteId);
        if (note) {
          setNoteTitle(note.Titre || "Titre de la note");
          setEditorContent(note.Content || "");
        }
        else {
          setError("Note introuvable.");
        }
      }
    };

    fetchNote();
  }, []);

  const initialConfig = {
    namespace: "Editor",
    theme,
    onError,
  };

  function OnChangeBehavior() {
    const [editor] = useLexicalComposerContext();

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
      console.log("Editor State JSON:", editorStateJSON);
      // However, we still have a JavaScript object, so we need to convert it to an actual string with JSON.stringify
      setEditorContent(JSON.stringify(editorStateJSON));
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
    <div className="flex flex-col p-2.5 bg-background h-full gap-2.5">
      <div className="flex rounded-lg p-2.5 items-center bg-primary text-white">
        <ReturnButton />
        {
          error ?
            <p className="w-full font-semibold bg-transparent p-1">Erreur</p>
          :
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full font-semibold bg-transparent p-1 placeholder:text-gray-300 placeholder:font-medium focus:outline-white"
              placeholder="Titre de la note"
            />
        }

      </div>
      {
        error ? (
          // Si erreur :
          <div className="text-red-500">
            {error}
          </div>
        ) : (
          // Si pas d'erreur :
          <>
            <div className="relative bg-white p-4 rounded-lg h-full">
              <LexicalComposer initialConfig={initialConfig}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      aria-placeholder={"Commencez à écrire..."}
                      placeholder={
                        <p className="absolute top-4 left-4 text-gray-500">
                          Commencez à écrire...
                        </p>
                      }
                      className="h-full focus:outline-none"
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <AutoFocusPlugin />
                <OnChangeBehavior />
              </LexicalComposer>
            </div>
          </>
        )
      }

    </div>
  );
}
