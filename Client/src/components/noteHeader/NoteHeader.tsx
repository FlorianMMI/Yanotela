"use client";

import React from "react";
import { RechercheIcon, RecentIcon, FiltreIcon } from "@/libs/Icons";
import SearchBar, { SearchMode } from "@/ui/searchbar";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { FOLDER_COLORS } from '@/hooks/folderColors';

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
  const [showTagColorMenu, setShowTagColorMenu] = useState(false);
  const tagColorMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showTagColorMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        tagColorMenuRef.current &&
        !tagColorMenuRef.current.contains(event.target as Node)
      ) {
        setShowTagColorMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagColorMenu]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <>
      {/* Header Mobile */}
      <div className="block xl:hidden md:block">
        <header className="p-4 ">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Mes Notes</h1>
            
            <div className="flex items-center gap-2">
              {/* Bouton Recherche */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Rechercher"
              >
                <RechercheIcon className="text-primary" width={24} height={24} />
              </button>

              {/* Bouton Filtre */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`flex p-2 rounded-lg transition-colors ${
                  collaborationFilter !== "all" 
                    ? "bg-primary" 
                    : "hover:bg-gray-100"
                }`}
                aria-label="Filtrer"
              >
                <FiltreIcon 
                width={24}
                height={24}
                className={collaborationFilter !== "all" ? "text-white" : "text-primary"}
                />
              </button>
            </div>
          </div>

          {/* Barre de recherche mobile */}
          <AnimatePresence>
            {showMobileSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 overflow-hidden"
              >
                <SearchBar 
                  searchTerm={searchTerm} 
                  setSearchTerm={setSearchTerm}
                  searchMode={searchMode}
                  setSearchMode={setSearchMode}
                  showModeSelector={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Menu filtres mobile */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="space-y-2">
                  {/* Tri */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Trier par</p>
                    <div>
                      <button
                        onClick={() => {
                          // Only recent sort for notes: toggle direction
                          setSortDir(sortDir === "desc" ? "asc" : "desc");
                          setShowMobileFilters(false);
                        }}
                        className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                          "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <RecentIcon width={20} height={20} className={"text-gray-700"} />
                        Récents {sortDir === "desc" ? "▼" : "▲"}
                      </button>
                    </div>
                  </div>

                  {/* Type de note */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Type de note</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setCollaborationFilter("all");
                          setShowMobileFilters(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          collaborationFilter === "all" 
                            ? "bg-primary text-white font-medium" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Toutes
                      </button>
                      <button
                        onClick={() => {
                          setCollaborationFilter("solo");
                          setShowMobileFilters(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          collaborationFilter === "solo" 
                            ? "bg-primary text-white font-medium" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Personnelles
                      </button>
                      <button
                        onClick={() => {
                          setCollaborationFilter("collaborative");
                          setShowMobileFilters(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          collaborationFilter === "collaborative" 
                            ? "bg-primary text-white font-medium" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Collaboratives
                      </button>
                    </div>
                  </div>
                  {/* Filtre par couleur de tag */}
                  <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Couleur du tag</p>
                    <div className="flex flex-wrap gap-2">
                      {FOLDER_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => {
                            setTagColorFilter(color.value);
                            setShowMobileFilters(false);
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-colors ${
                            tagColorFilter === color.value
                              ? 'border-primary ring-2 ring-primary'
                              : 'border-gray-300 hover:border-primary'
                          }`}
                          style={{ backgroundColor: color.value }}
                          aria-label={color.label}
                        />
                      ))}
                      <button
                        onClick={() => {
                          setTagColorFilter('');
                          setShowMobileFilters(false);
                        }}
                        className={`w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs bg-white`}
                        aria-label="Toutes les couleurs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      {/* Barre de recherche et filtre desktop */}
      <div className="hidden xl:block md:hidden flex justify-center">
        
        <div className="flex flex-wrap items-stretch justify-center gap-3 p-6 h-full">

            <SearchBar 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm}
              searchMode={searchMode}
              setSearchMode={setSearchMode}
              showModeSelector={true}
            />

          <div className="flex gap-2">
            <motion.button
              onClick={() => {
                setSortDir(sortDir === "desc" ? "asc" : "desc");
              }}
              className={`flex flex-row items-center grow cursor-pointer p-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full min-w-max ${
                "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              <RecentIcon width={20} height={20} className={"text-gray-700"} />
              Récents {sortDir === "desc" ? "▼" : "▲"}
            </motion.button>

            {/* Bouton filtre type de note */}
            <motion.button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex flex-row items-center cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full ${
                collaborationFilter !== "all" 
                  ? "bg-primary text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              <FiltreIcon
                width={20}
                height={20}
                className={collaborationFilter !== "all" ? "text-white" : "text-gray-700"}
              />
              {collaborationFilter === "all" && "Toutes"}
              {collaborationFilter === "solo" && "Personnelles"}
              {collaborationFilter === "collaborative" && "Collaboratives"}
            </motion.button>

            {/* Bouton filtre couleur de tag */}
            <motion.button
              onClick={() => setShowTagColorMenu(!showTagColorMenu)}
              className={`flex flex-row items-center cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full ${
                tagColorFilter
                  ? "border-2 border-primary ring-2 ring-primary"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 1 }}
              aria-label="Filtrer par couleur de tag"
            >
              <span className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: tagColorFilter || 'var(--primary)' }}></span>
            
            Tags

            </motion.button>
          </div>

          {/* Menu dropdown pour le filtre de collaboration */}
          <div className="relative">
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Type de note</p>
                    <div className="flex flex-col gap-1 mb-2">
                      <button
                        onClick={() => {
                          setCollaborationFilter("all");
                          setShowFilterMenu(false);
                        }}
                        className={`text-left px-2 py-1 rounded transition-colors ${
                          collaborationFilter === "all" ? "bg-primary text-white font-medium" : "hover:bg-gray-100"
                        }`}
                      >Toutes</button>
                      <button
                        onClick={() => {
                          setCollaborationFilter("solo");
                          setShowFilterMenu(false);
                        }}
                        className={`text-left px-2 py-1 rounded transition-colors ${
                          collaborationFilter === "solo" ? "bg-primary text-white font-medium" : "hover:bg-gray-100"
                        }`}
                      >Personnelles</button>
                      <button
                        onClick={() => {
                          setCollaborationFilter("collaborative");
                          setShowFilterMenu(false);
                        }}
                        className={`text-left px-2 py-1 rounded transition-colors ${
                          collaborationFilter === "collaborative" ? "bg-primary text-white font-medium" : "hover:bg-gray-100"
                        }`}
                      >Collaboratives</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Menu dropdown pour le filtre couleur de tag */}
          <div className="relative">
            <AnimatePresence>
              {showTagColorMenu && (
                <motion.div
                  ref={tagColorMenuRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Couleur du tag</p>
                    <div className="flex flex-wrap gap-2">
                      {FOLDER_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => {
                            setTagColorFilter(color.value);
                            setShowTagColorMenu(false);
                          }}
                          className={`w-7 h-7 rounded-full border-2 transition-colors ${
                            tagColorFilter === color.value
                              ? 'border-primary ring-2 ring-primary'
                              : 'border-gray-300 hover:border-primary'
                          }`}
                          style={{ backgroundColor: color.value }}
                          aria-label={color.label}
                        ></button>
                      ))}
                      <button
                        onClick={() => {
                          setTagColorFilter('');
                          setShowTagColorMenu(false);
                        }}
                        className={`w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs bg-white`}
                        aria-label="Toutes les couleurs"
                      >✕</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </>
  );
}
