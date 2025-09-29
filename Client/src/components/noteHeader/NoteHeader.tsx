"use client";

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
            {/*<div className="flex items-center gap-4">
              <Image
                src="/recherche.svg"
                alt="Recherche"
                width={24}
                height={24}
                className="cursor-pointer"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
              />
              <Image
                src="/filtre.svg"
                alt="Menu"
                width={24}
                height={24}
                className="cursor-pointer"
              />
            </div>*/}
          </div>
        </header>

        {/* Mobile Search Panel - Appears when search icon is clicked */}
        {/* {showMobileSearch && (
          <div className=" border-b border-gray-200 p-4 animate-in slide-in-from-top duration-300">
            {/* Search Bar */}
            {/* <div className="mb-4">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>

            {/* Sort Buttons */}
            {/* <div className="flex gap-2 mb-2">
              <button
                onClick={() => setSortBy("recent")}
                className={`flex flex-row items-center p-2 gap-2 rounded-lg font-medium text-sm transition-colors flex-1 justify-center ${sortBy === "recent"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <Image
                  src="/recent.svg"
                  alt="Récents"
                  width={20}
                  height={20}
                />
                Récents
              </button>

              <button
                onClick={() => setSortBy("creation")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-1 ${sortBy === "creation"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                Dates de création
              </button>
            </div>
          </div> 
        )} */}
      </div>

      {/* Header Desktop */}
      <div className="hidden md:block">

        <header className="bg-white p-3 border-primary border-b-2">

          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <span className="text-2xl font-bold text-primary">Mes notes</span>
          </div>
        </header>

        <div className="flex items-stretch justify-center gap-3 p-6 h-full">

          {/* Search Bar */}
          <div className="flex justify-center items-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          {/* Sort Buttons */}
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
              className={`px-4 py-2 grow items-center cursor-pointer rounded-lg font-medium text-sm transition-colors ${
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

          {/* Filter Button */}
          <motion.button 
            className="p-2 text-primary hover:border-primary hover:border hover:bg-white rounded-lg cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 1 }}
          >
            <Image src="/filtre.svg" alt="Filtre" width={24} height={24} />
          </motion.button>
        </div>

      </div>
    </>
  );
}
