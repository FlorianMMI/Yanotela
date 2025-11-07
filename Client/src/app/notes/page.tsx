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
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [collaborationFilter, setCollaborationFilter] = useState<"all" | "collaborative" | "solo">("all");
  const [searchInContent, setSearchInContent] = useState(false);
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
      let matchesSearch = true;
      if (searchTerm) {
        if (searchInContent) {
          // Rechercher dans le contenu
          matchesSearch = note.Content?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        } else {
          // Rechercher par titre (par défaut)
          matchesSearch = note.Titre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        }
      }
      
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
      // Notes sorted by ModifiedAt (no CreatedAt in schema)
      const da = new Date(a.ModifiedAt).getTime();
      const db = new Date(b.ModifiedAt).getTime();
      return sortDir === "desc" ? db - da : da - db;
    }) : [];

  return (
    <div className="h-full w-full">

      <NoteHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        collaborationFilter={collaborationFilter}
        setCollaborationFilter={setCollaborationFilter}
        searchInContent={searchInContent}
        setSearchInContent={setSearchInContent}
      />

      <Suspense fallback={<div></div>}>
        <NoteList
          notes={filteredNotes}
          onNoteCreated={fetchNotes}
          isLoading={loading}
          searchTerm={searchTerm}
          searchInContent={searchInContent}
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
