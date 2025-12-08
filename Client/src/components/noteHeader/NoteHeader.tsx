"use client";

import React from "react";
import { SearchMode } from "@/ui/searchbar";
import { NoteFiltersBar } from "@/components/noteFilters/NoteFiltersBar";

interface NoteHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "recent";
  setSortBy: (sort: "recent") => void;
  sortDir: "asc" | "desc";
  setSortDir: (d: "asc" | "desc") => void;
  collaborationFilter: "all" | "collaborative" | "solo";
  setCollaborationFilter: (filter: "all" | "collaborative" | "solo") => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  tagColorFilter: string;
  setTagColorFilter: (color: string) => void;
}

export default function NoteHeader({ 
  searchTerm, 
  setSearchTerm, 
  sortDir, 
  setSortDir, 
  collaborationFilter, 
  setCollaborationFilter,
  searchMode,
  setSearchMode,
  tagColorFilter,
  setTagColorFilter
}: NoteHeaderProps) {
  return (
    <NoteFiltersBar
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      searchMode={searchMode}
      setSearchMode={setSearchMode}
      showSearchMode={true}
      sortDir={sortDir}
      setSortDir={setSortDir}
      collaborationFilter={collaborationFilter}
      setCollaborationFilter={setCollaborationFilter}
      tagColorFilter={tagColorFilter}
      setTagColorFilter={setTagColorFilter}
      mobileTitle="Mes Notes"
    />
  );
}
