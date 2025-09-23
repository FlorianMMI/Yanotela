"use client";

import { useState, useEffect } from "react";
import { Note } from "@/type/Note";
import NoteHeader from "@/components/noteHeader/NoteHeader";
import NoteList from "@/components/noteList/NoteList";
import { GetNotes } from "@/loader/loader";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "creation">("recent");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les notes au montage du composant
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const fetchedNotes = await GetNotes();
        console.log('Notes récupérées:', fetchedNotes);
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Filtrer et trier les notes
  const filteredNotes = notes
    .filter(note => 
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="min-h-screen">
      <NoteHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <NoteList notes={filteredNotes} />
    </div>
  );
}
