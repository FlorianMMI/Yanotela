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

  return (
    <>
      {/* Header Mobile */}
      <div className="block md:hidden">
        <header className=" p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Mes Notes</h1>
            
          </div>
        </header>

      </div>

      {/* Barre de recherche et filtre */}
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
          </div>

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
