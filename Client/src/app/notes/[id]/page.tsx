"use client";
import React from "react";
import { useEffect, useState, use } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import ReturnButton from "@/ui/returnButton";
import Icons from "@/ui/Icon";
import NoteMore from "@/components/noteMore/NoteMore";
import ErrorFetch from "@/ui/note/errorFetch";
import CollaborativeEditor from "@/components/editor/CollaborativeEditor";

import { GetNoteById, SaveNote } from "@/loader/loader";

interface NoteEditorProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NoteEditor({ params }: NoteEditorProps) {
  const [noteTitle, setNoteTitle] = useState("");
  const [initialEditorState, setInitialEditorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Unwrap params
  const { id } = use(params);

  // Hook pour détecter les changements
  useEffect(() => {
    const handleResize = () => {
      setLastFetchTime(Date.now());
    };

    const handleTitleUpdate = (event: CustomEvent) => {
      const { noteId, title } = event.detail;
      if (noteId === id) {
        setNoteTitle(title);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("noteTitleUpdated", handleTitleUpdate as EventListener);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("noteTitleUpdated", handleTitleUpdate as EventListener);
    };
  }, [id]);

  function updateNoteTitle(newTitle: string) {
    if (isReadOnly) return;

    const finalTitle = newTitle.trim() === "" ? "Titre de la note" : newTitle;

    setNoteTitle(finalTitle);
    SaveNote(id, {
      Titre: finalTitle,
      Content: initialEditorState || "",
    });

    window.dispatchEvent(
      new CustomEvent("noteTitleUpdated", {
        detail: { noteId: id, title: finalTitle },
      })
    );
  }

  useEffect(() => {
    const fetchNote = async () => {
      const noteId = id;

      if (noteId) {
        const note = await GetNoteById(noteId);
        if (note && !("error" in note)) {
          setNoteTitle(note.Titre);
          setUserRole((note as any).userRole !== undefined ? (note as any).userRole : null);
          setIsReadOnly((note as any).userRole === 3);

          // Stocker le contenu initial pour la collaboration
          if (note.Content) {
            setInitialEditorState(note.Content);
          }
        } else {
          setHasError(true);
        }
      }
      setIsLoading(false);
    };

    fetchNote();
  }, [id, lastFetchTime]);

  return (
    <div className="flex flex-col p-2.5 h-fit min-h-full gap-2.5">
      {/* Header mobile */}
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
                isReadOnly ? "cursor-not-allowed" : ""
              }`}
              disabled={isReadOnly}
            />
            <div className="relative">
              <span onClick={() => setShowNoteMore((prev) => !prev)}>
                <Icons name="more" size={20} className="text-white cursor-pointer" />
              </span>
              {showNoteMore && (
                <div className="absolute right-0 mt-2 z-20">
                  <NoteMore noteId={id} onClose={() => setShowNoteMore(false)} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Contenu */}
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
        <CollaborativeEditor
          noteId={id}
          isReadOnly={isReadOnly}
          initialEditorState={initialEditorState}
        />
      )}
    </div>
  );
}