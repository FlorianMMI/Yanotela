"use client";

import React from "react";
import Icon from "@/ui/Icon";
import SearchBar from "@/ui/searchbar";
import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

interface NoteHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "recent" | "creation";
  setSortBy: (sort: "recent" | "creation") => void;
}

export default function NoteHeader({ searchTerm, setSearchTerm, sortBy, setSortBy }: NoteHeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
        {/*
        <div className="flex items-stretch justify-center gap-3 p-6 h-full">

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

          <motion.button 
            className="p-2 text-primary border-transparent flex justify-center items-center hover:border-primary border hover:bg-white rounded-lg cursor-pointer"
          >
            <Icon name="filtre" size={24} />
          </motion.button>
        </div>
        */}

      </div>
    </>
  );
}
