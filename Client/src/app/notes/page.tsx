"use client";
import React from "react";

import { useState, useEffect, Suspense } from "react";
import { Note } from "@/type/Note";
import NoteHeader from "@/components/noteHeader/NoteHeader";
import NoteList from "@/components/noteList/NoteList";
import { GetNotes } from "@/loader/loader";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import SearchBar from "@/ui/searchbar";
import FlashNoteButton from '@/ui/flash-note-button'; 

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuthRedirect();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent">("recent");
  const [collaborationFilter, setCollaborationFilter] = useState<"all" | "collaborative" | "solo">("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Charger les notes au montage du composant
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await GetNotes();
      setNotes(response.notes || []);
    } catch (error) {
      console.error("Error loading notes:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les notes
  const filteredNotes = Array.isArray(notes) ? notes
    .filter(note => {
      // Filtre de recherche
      const matchesSearch = note.Titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.Content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre de collaboration
      // Personnelles : 1 seul utilisateur (nous, collaboratorCount = 0 ou undefined ou = 1)
      // Collaboratives : 2 utilisateurs ou plus (collaboratorCount >= 2)
      const matchesCollaboration = 
        collaborationFilter === "all" ? true :
        collaborationFilter === "collaborative" ? (note.collaboratorCount && note.collaboratorCount >= 2) :
        collaborationFilter === "solo" ? (!note.collaboratorCount || note.collaboratorCount <= 1) :
        true;
      
      return matchesSearch && matchesCollaboration;
    })
    .sort((a, b) => {
      // Tri par date de modification (plus récent en premier)
      return new Date(b.ModifiedAt).getTime() - new Date(a.ModifiedAt).getTime();
    }) : [];

  return (
    <div className="h-full w-full">

      <NoteHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        collaborationFilter={collaborationFilter}
        setCollaborationFilter={setCollaborationFilter}
      />

      <Suspense fallback={<div></div>}>
        <NoteList
          notes={filteredNotes}
          onNoteCreated={fetchNotes}
          isLoading={loading}
        />
      </Suspense>

      {/* Flash Note Button - Mobile Only - Full width */}
      <div className="fixed inset-x-4 bottom-6 md:hidden z-50">
        <FlashNoteButton
          isOpen={true}
          isActive={false}
          onClick={() => {
            window.location.href = '/flashnote';
          }}
          className="w-full"
        />
      </div>

    </div>
  );
}
