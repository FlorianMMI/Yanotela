"use client";

import React from "react";
import Icon from "@/ui/Icon";
import SearchBar from "@/ui/searchbar";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { FOLDER_COLORS } from "@/hooks/folderColors";

interface FolderHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "recent" | "creation";
  setSortBy: (sort: "recent" | "creation") => void;
  colorFilters: string[];
  setColorFilters: (colors: string[]) => void;
}

export default function FolderHeader({ searchTerm, setSearchTerm, sortBy, setSortBy, colorFilters, setColorFilters }: FolderHeaderProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
      <div className="block md:hidden">
        <header className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Mes Dossiers</h1>
          </div>
        </header>
      </div>

      {/* Barre de recherche et filtre - Desktop */}
      <div className="hidden md:block">
        
        <div className="flex items-stretch justify-center gap-3 p-6 h-full" name="filter-bar">
          <div className="flex justify-center items-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={() => setSortBy("recent")}
              className={`flex flex-row items-center grow cursor-pointer p-2 gap-2 rounded-lg font-medium text-sm transition-colors ${
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
              Récents
            </motion.button>

            <motion.button
              onClick={() => setSortBy("creation")}
              className={`px-4 py-2 grow items-center justify-center cursor-pointer rounded-lg font-medium text-sm transition-colors ${
                sortBy === "creation"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              Dates de création
            </motion.button>
          </div>

          {/* Filtre par couleur */}
          <div className="relative">
            <motion.button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex flex-row items-center grow cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors ${
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
