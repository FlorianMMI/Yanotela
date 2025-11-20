"use client";

import React from "react";
import SearchBar, { SearchMode } from "@/ui/searchbar";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import ReturnButton from "@/ui/returnButton";
import { FOLDER_COLORS } from "@/hooks/folderColors";
import { FiltreIcon, MoreIcon, RecentIcon, RechercheIcon } from "@/libs/Icons";

// Hook pour détecter la largeur de l'écran
function useWindowWidth() {
  const [width, setWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  React.useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

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
  sortBy,
  setSortBy,
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const windowWidth = useWindowWidth();

  return (
    <>
      {/* Header Mobile */}
      <div
        className="md:flex xl:hidden md:bg-none flex flex-col rounded-lg text-white md:text-primary sticky top-2 z-10"
        style={
          windowWidth < 768
            ? { backgroundColor: folderColor || "#882626" }
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

          {/* Boutons d'actions */}
          <div className="flex items-center gap-2">
            {/* Bouton Recherche */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="flex p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Rechercher"
            >
              <RechercheIcon
                width={20}
                height={20}
                className="text-white md:text-primary"
              />
            </button>

            {/* Bouton Filtre */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`flex p-2 rounded-lg transition-colors ${
                collaborationFilter !== "all"
                  ? "bg-white/30"
                  : "hover:bg-white/20"
              }`}
              aria-label="Filtrer"
            >
              <FiltreIcon
                width={20}
                height={20}
                className="text-white md:text-primary"
              />
            </button>

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

        {/* Barre de recherche mobile */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-2.5 pb-2.5 overflow-hidden"
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
              className="px-2.5 pb-2.5 overflow-hidden"
            >
              <div className="bg-white rounded-lg p-3 space-y-2">
                {/* Tri */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Trier par
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (sortBy === "recent") {
                          setSortDir(sortDir === "desc" ? "asc" : "desc");
                        } else {
                          setSortBy("recent");
                          setSortDir("desc");
                        }
                        setShowMobileFilters(false);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors min-w-max ${
                        sortBy === "recent"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <RecentIcon
                        width={20}
                        height={20}
                        className={
                          sortBy === "recent" ? "text-white" : "text-gray-700"
                        }
                      />
                      Récents{" "}
                      {sortBy === "recent" && (sortDir === "desc" ? "▼" : "▲")}
                    </button>
                  </div>
                </div>

                {/* Type de note */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Type de note
                  </p>
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
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Couleur du tag
                  </p>
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
                            ? "border-primary ring-2 ring-primary"
                            : "border-gray-300 hover:border-primary"
                        }`}
                        style={{ backgroundColor: color.value }}
                        aria-label={color.label}
                      />
                    ))}
                    <button
                      onClick={() => {
                        setTagColorFilter("");
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
      </div>

      {/* Barre de recherche et filtre - Version Desktop */}
      <div className="hidden xl:block md:hidden">
        <div className="flex flex-wrap items-stretch justify-center gap-3 p-6 ">
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
                if (sortBy === "recent") {
                  setSortDir(sortDir === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("recent");
                  setSortDir("desc");
                }
              }}
              className={`flex flex-row items-center grow cursor-pointer p-2 gap-2 rounded-lg font-medium text-sm transition-colors  ${
                sortBy === "recent"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              <RecentIcon
                width={20}
                height={20}
                className={sortBy === "recent" ? "text-white" : "text-gray-700"}
              />
              Récents {sortBy === "recent" && (sortDir === "desc" ? "▼" : "▲")}
            </motion.button>
          </div>

          {/* Filtre de collaboration */}
          <div className="relative">
            <motion.button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex flex-row items-center cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors  ${
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
                className={
                  collaborationFilter !== "all" ? "text-white" : "text-gray-700"
                }
              />
              {collaborationFilter === "all" && "Toutes"}
              {collaborationFilter === "solo" && "Personnelles"}
              {collaborationFilter === "collaborative" && "Collaboratives"}
            </motion.button>

            {/* Menu dropdown pour le filtre de collaboration */}
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                >
                  <button
                    onClick={() => {
                      setCollaborationFilter("all");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg ${
                      collaborationFilter === "all"
                        ? "bg-gray-100 font-medium"
                        : ""
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => {
                      setCollaborationFilter("solo");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                      collaborationFilter === "solo"
                        ? "bg-gray-100 font-medium"
                        : ""
                    }`}
                  >
                    Personnelles
                  </button>
                  <button
                    onClick={() => {
                      setCollaborationFilter("collaborative");
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 last:rounded-b-lg ${
                      collaborationFilter === "collaborative"
                        ? "bg-gray-100 font-medium"
                        : ""
                    }`}
                  >
                    Collaboratives
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
            <span
              className="w-5 h-5 rounded-full border border-gray-300"
              style={{ backgroundColor: tagColorFilter || "var(--primary)" }}
            ></span>
            Tags
          </motion.button>
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
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Couleur du tag
                    </p>
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
                              ? "border-primary ring-2 ring-primary"
                              : "border-gray-300 hover:border-primary"
                          }`}
                          style={{ backgroundColor: color.value }}
                          aria-label={color.label}
                        ></button>
                      ))}
                      <button
                        onClick={() => {
                          setTagColorFilter("");
                          setShowTagColorMenu(false);
                        }}
                        className={`w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs bg-white`}
                        aria-label="Toutes les couleurs"
                      >
                        ✕
                      </button>
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
