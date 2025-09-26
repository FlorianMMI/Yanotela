"use client";

import { useState, useEffect, Suspense } from "react";
import { Note } from "@/type/Note";
import NoteHeader from "@/components/noteHeader/NoteHeader";
import NoteList from "@/components/noteList/NoteList";
import { GetNotes } from "@/loader/loader";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuthRedirect();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "creation">("recent");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  // Charger les notes au montage du composant
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await GetNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les notes (utilise les propriétés du serveur)
  const filteredNotes = notes
    .filter(note =>
      note.Titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.Content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Tri par date de modification (plus récent en premier)
      return new Date(b.ModifiedAt).getTime() - new Date(a.ModifiedAt).getTime();
    });

  // Afficher un spinner pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">

      <NoteHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <Suspense fallback={
        <div className="p-4">
          <div className="text-center text-gray-500">Chargement des notes...</div>
        </div>
      }>
        <NoteList
          notes={filteredNotes}
          onNoteCreated={fetchNotes}
          isLoading={loading}
        />
      </Suspense>
      
    </div>
  );
}
