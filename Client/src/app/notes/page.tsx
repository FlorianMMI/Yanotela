"use client";
import React, { useRef, useCallback } from "react";

import { useState, useEffect, Suspense } from "react";
import { Note } from "@/type/Note";
import NoteHeader from "@/components/noteHeader/NoteHeader";
import NoteList from "@/components/noteList/NoteList";
import { GetNotes } from "@/loader/loader";
import  { SearchMode } from "@/ui/searchbar";
import FlashNoteButton from '@/ui/flash-note-button'; 
import { useRouter } from "next/navigation";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent">("recent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [collaborationFilter, setCollaborationFilter] = useState<"all" | "collaborative" | "solo">("all");
  const [searchMode, setSearchMode] = useState<SearchMode>("all");
  const [tagColorFilter, setTagColorFilter] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const hasFetched = useRef(false);
  
  // Charger les notes au montage du composant (évite double appel en Strict Mode)
  const fetchNotes = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchNotes();
  }, [fetchNotes]);

  // Filtrer et trier les notes
  const filteredNotes = Array.isArray(notes) ? notes
    .filter(note => {
      // Filtre de recherche
      let matchesSearch = true;
      if (searchTerm) {
        switch (searchMode) {
          case 'title':
            matchesSearch = note.Titre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
            break;
          case 'content':
            matchesSearch = note.Content?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
            break;
          case 'all':
          default:
            matchesSearch = (note.Titre?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                           (note.Content?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
            break;
        }
      }

      // Filtre de collaboration
      const matchesCollaboration = 
        collaborationFilter === "all" ? true :
        collaborationFilter === "collaborative" ? (note.collaboratorCount && note.collaboratorCount >= 2) :
        collaborationFilter === "solo" ? (!note.collaboratorCount || note.collaboratorCount <= 1) :
        true;

      // Filtre par couleur de tag
      let matchesTagColor = true;
      if (tagColorFilter) {
        if (tagColorFilter === 'var(--primary)') {
          matchesTagColor = !note.tag || note.tag === '' || note.tag === 'var(--primary)';
        } else {
          matchesTagColor = note.tag === tagColorFilter;
        }
      }

      return matchesSearch && matchesCollaboration && matchesTagColor;
    })
    .sort((a, b) => {
      // Notes sorted by ModifiedAt (no CreatedAt in schema)
      const da = new Date(a.ModifiedAt).getTime();
      const db = new Date(b.ModifiedAt).getTime();
      return sortDir === "desc" ? db - da : da - db;
    }) : [];

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6">

      <NoteHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        collaborationFilter={collaborationFilter}
        setCollaborationFilter={setCollaborationFilter}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        tagColorFilter={tagColorFilter}
        setTagColorFilter={setTagColorFilter}
      />

      {/* Limiter la hauteur visible en mobile pour que seul ce conteneur soit scrollable.
          calc(100vh - 5.5rem) = viewport minus header + paddings approximatifs.
          Ajuster la valeur si votre header a une hauteur différente. */}
      <div className="flex-1 min-h-0 overflow-y-auto md:max-h-none custom-scrollbar">
        <Suspense fallback={<div></div>}>
          <NoteList
            notes={filteredNotes}
            onNoteCreated={fetchNotes}
            isLoading={loading}
            searchTerm={searchTerm}
            searchMode={searchMode}
          />
        </Suspense>
      </div>

      {/* Flash Note Button - Mobile Only - Full width */}
      <div className="fixed inset-x-4 bottom-16 md:hidden z-50">
        <FlashNoteButton
          isOpen={true}
          isActive={false}
          onClick={() => {
            router.push('/flashnote');
          }}
          className="w-full"
        />
      </div>

    </div>
  );
}
