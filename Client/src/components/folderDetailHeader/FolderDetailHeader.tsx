"use client";

import React from "react";
import { SearchMode } from "@/ui/searchbar";
import { NoteFiltersBar } from "@/components/noteFilters/NoteFiltersBar";
import ReturnButton from "@/ui/returnButton";
import { MoreIcon } from "@/libs/Icons";
import { useWindowWidth } from "@/hooks/useWindowWidth";

interface FolderDetailHeaderProps {
  folderName: string;
  folderColor: string;
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
  onMoreClick: () => void;
  tagColorFilter: string;
  setTagColorFilter: (color: string) => void;
}

export default function FolderDetailHeader({
  folderName,
  folderColor,
  searchTerm,
  setSearchTerm,
  sortDir,
  setSortDir,
  collaborationFilter,
  setCollaborationFilter,
  searchMode,
  setSearchMode,
  onMoreClick,
  tagColorFilter,
  setTagColorFilter,
}: FolderDetailHeaderProps) {
  const windowWidth = useWindowWidth();

  return (
    <>
      {/* Header mobile personnalisé pour les dossiers */}
      <div
        className="md:flex xl:hidden md:bg-none flex flex-col rounded-lg text-white md:text-primary sticky top-2 z-10 mb-4"
        style={
          windowWidth < 768
            ? { backgroundColor: folderColor || "var(--primary)" }
            : undefined
        }
      >
        <div className="flex p-2.5 items-center gap-2">
          <div className="md:hidden block">
            <ReturnButton />
          </div>

          {/* Nom du dossier */}
          <h2 className="flex-1 font-semibold text-base truncate">
            {folderName}
          </h2>

          {/* Bouton More */}
          <button
            onClick={onMoreClick}
            aria-label="Options du dossier"
            className="flex md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <MoreIcon
              width={20}
              height={20}
              className="text-white md:text-primary"
            />
          </button>
        </div>
      </div>

      {/* Barre de filtres standard */}
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
        mobileTitle={folderName}
        hideMobileHeader={true} // On utilise notre header personnalisé ci-dessus
      />
    </>
  );
}
