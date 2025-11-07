"use client";

import React from "react";
import Icon from "@/ui/Icon";
import SearchBar from "@/ui/searchbar";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useState } from "react";

interface NoteHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "recent";
  setSortBy: (sort: "recent") => void;
  collaborationFilter: "all" | "collaborative" | "solo";
  setCollaborationFilter: (filter: "all" | "collaborative" | "solo") => void;
}

export default function NoteHeader({ searchTerm, setSearchTerm, sortBy, setSortBy, collaborationFilter, setCollaborationFilter }: NoteHeaderProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <>
      {/* Header Mobile */}
      <div className="block md:hidden">
        <header className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Mes Notes</h1>
            
            <div className="flex items-center gap-2">
              {/* Bouton Recherche */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Rechercher"
              >
                <Icon name="recherche" size={24} className="text-primary" />
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
                <Icon 
                  name="filtre" 
                  size={24} 
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
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
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
                  {/* <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Trier par</p>
                    <button
                      onClick={() => setSortBy("recent")}
                      className="w-full flex items-center gap-2 p-3 rounded-lg bg-primary text-white"
                    >
                      <Icon name="recent" size={20} className="text-white" />
                      Récents
                    </button>
                  </div> */}

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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      {/* Barre de recherche et filtre */}
      <div className="hidden md:block">
        
        <div className="flex items-stretch justify-center gap-3 p-6 h-full" name="filter-bar">

          <div className="flex justify-center items-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          {/* <div className="flex gap-2">
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
          </div> */}

          {/* Filtre de collaboration */}
          <div className="relative">
            <motion.button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex flex-row items-center cursor-pointer px-4 py-2 gap-2 rounded-lg font-medium text-sm transition-colors ${
                collaborationFilter !== "all" 
                  ? "bg-primary text-white" 
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
            >
              <Icon 
                name="filtre" 
                size={20} 
                className={collaborationFilter !== "all" ? "text-white" : "text-gray-700"}
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
                      collaborationFilter === "all" ? "bg-gray-100 font-medium" : ""
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
                      collaborationFilter === "solo" ? "bg-gray-100 font-medium" : ""
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
                      collaborationFilter === "collaborative" ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    Collaboratives
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </>
  );
}
