"use client";

import React from "react";
import Icon from "@/ui/Icon";
import SearchBar, { SearchMode } from "@/ui/searchbar";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { FOLDER_COLORS } from "@/hooks/folderColors";

interface FolderHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "recent" | "creation";
  setSortBy: (sort: "recent" | "creation") => void;
  sortDir: "asc" | "desc";
  setSortDir: (d: "asc" | "desc") => void;
  colorFilters: string[];
  setColorFilters: (colors: string[]) => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
}

export default function FolderHeader({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  sortDir, 
  setSortDir, 
  colorFilters, 
  setColorFilters,
  searchMode,
  setSearchMode
}: FolderHeaderProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleColorFilter = (color: string) => {
    if (colorFilters.includes(color)) {
      setColorFilters(colorFilters.filter(c => c !== color));
    } else {
      setColorFilters([...colorFilters, color]);
    }
  };

  return (
    <>
      {/* Header Mobile */}
      <div className="block xl:hidden md:block">
        <header className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Mes Dossiers</h1>
            
            <div className="flex items-center gap-2">
              {/* Bouton Recherche */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Rechercher"
              >
                <Icon name="recherche" size={24} className="text-primary" />
              </button>

              {/* Bouton Filtre */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`flex p-2 rounded-lg transition-colors ${
                  colorFilters.length > 0 || sortBy === "creation"
                    ? "bg-primary" 
                    : "hover:bg-gray-100"
                }`}
                aria-label="Filtrer"
              >
                <Icon 
                  name="filtre" 
                  size={24} 
                  className={colorFilters.length > 0 || sortBy === "creation" ? "text-white" : "text-primary"}
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
                  showModeSelector={false}
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
                <div className="space-y-3">
                  {/* Tri */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Trier par</p>
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
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                                  sortBy === "recent" 
                                    ? "bg-primary text-white" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                <Icon name="recent" size={20} className={sortBy === "recent" ? "text-white" : "text-gray-700"} />
                                Récents {sortBy === "recent" && (sortDir === "desc" ? "▼" : "▲")}
                              </button>
                              <button
                                onClick={() => {
                                  if (sortBy === "creation") {
                                    setSortDir(sortDir === "desc" ? "asc" : "desc");
                                  } else {
                                    setSortBy("creation");
                                    setSortDir("desc");
                                  }
                                  setShowMobileFilters(false);
                                }}
                                className={`flex-1 p-3 rounded-lg transition-colors ${
                                  sortBy === "creation" 
                                    ? "bg-primary text-white" 
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                Création {sortBy === "creation" && (sortDir === "desc" ? "▼" : "▲")}
                              </button>
                    </div>
                  </div>

                  {/* Couleurs */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Filtrer par couleur</p>
                    <div className="grid grid-cols-3 gap-2 bg-gray-100 p-[0.5em] rounded-lg">
                      {FOLDER_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => toggleColorFilter(color.value)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            colorFilters.includes(color.value)
                              ? "border-primary bg-primary/10"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div 
                            className="w-5 h-5 rounded border border-gray-300 shrink-0"
                            style={{ backgroundColor: color.value === 'var(--primary)' ? 'var(--primary)' : color.value }}
                          />
                          <span className="text-xs truncate">{color.label}</span>
                          {colorFilters.includes(color.value) && (
                            <span className="ml-auto text-primary font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {colorFilters.length > 0 && (
                      <button
                        onClick={() => setColorFilters([])}
                        className="w-full mt-2 px-3 py-2 text-sm text-primary hover:bg-gray-100 rounded-lg font-medium"
                      >
                        Réinitialiser les couleurs
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      {/* Barre de recherche et filtre - Desktop */}
      <div className="hidden xl:block md:hidden">
        
        <div className="flex flex-wrap items-stretch justify-center gap-3 p-6 h-full" name="filter-bar">
          
            <SearchBar 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm}
              searchMode={searchMode}
              setSearchMode={setSearchMode}
              showModeSelector={false}
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
              className={`flex flex-row items-center grow cursor-pointer p-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full ${
                sortBy === "recent"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              <Icon
                name="recent"
                size={20}
                className={sortBy === "recent" ? "text-white" : "text-gray-700"}
              />
              Récents {sortBy === "recent" && (sortDir === "desc" ? "▼" : "▲")}
            </motion.button>

            <motion.button
              onClick={() => {
                if (sortBy === "creation") {
                  setSortDir(sortDir === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("creation");
                  setSortDir("desc");
                }
              }}
              className={`px-4 py-2 grow items-center justify-center cursor-pointer rounded-lg font-medium text-sm transition-colors h-full ${
                sortBy === "creation"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              Dates de création {sortBy === "creation" && (sortDir === "desc" ? "▼" : "▲")}
            </motion.button>
          </div>

          {/* Filtre par couleur */}
          <div className="relative">
            <motion.button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex flex-row items-center grow cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors h-full ${
                colorFilters.length > 0 
                  ? "bg-primary text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              <Icon 
                name="filtre" 
                size={20} 
                className={colorFilters.length > 0 ? "text-white" : "text-gray-700"}
              />
              Couleurs
              {colorFilters.length > 0 && (
                <span className="ml-1 bg-white text-primary text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {colorFilters.length}
                </span>
              )}
            </motion.button>

            {/* Menu dropdown pour le filtre de couleur */}
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3"
                >
                  <div className="text-sm font-medium text-gray-700 mb-2 px-1">
                    Filtrer par couleur
                  </div>
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => toggleColorFilter(color.value)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded border-2 border-gray-300"
                          style={{ backgroundColor: color.value === 'var(--primary)' ? '#882626' : color.value }}
                        />
                        <span className="text-sm">{color.label}</span>
                      </div>
                      {colorFilters.includes(color.value) && (
                        <span className="ml-auto text-primary font-bold text-lg">✓</span>
                      )}
                    </button>
                  ))}
                  {colorFilters.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 my-2" />
                      <button
                        onClick={() => setColorFilters([])}
                        className="w-full text-center px-3 py-2 text-sm text-primary hover:bg-gray-100 rounded font-medium"
                      >
                        Réinitialiser
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
      </div>
    </>
  );
}
