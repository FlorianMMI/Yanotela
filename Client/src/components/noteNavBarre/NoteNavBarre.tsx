

"use client";

import SearchBar from "@/ui/searchbar";
import Image from "next/image";
import { useState } from "react";

interface NoteNavBarreProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "recent" | "creation";
  setSortBy: (sort: "recent" | "creation") => void;
}

export default function NoteNavBarre({ searchTerm, setSearchTerm, sortBy, setSortBy }: NoteNavBarreProps) {
  
  return (
    <>
      <div className=" items-center justify-center gap-3 p-6 md:flex hidden">

          {/* Search Bar */}
          <div className="flex justify-center items-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          {/* Sort Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("recent")}
              className={`flex flex-row p-2 gap-2 rounded-lg font-medium text-sm transition-colors ${sortBy === "recent"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
            >
              <Image
                src="/recent.svg"
                alt="Récents"
                width={24}
                height={24}
                color="white"
              />
              Récents
            </button>

            <button
              onClick={() => setSortBy("creation")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${sortBy === "creation"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
            >
              Dates de création
            </button>
          </div>

          {/* Filter Button */}
          <button className="p-2 text-primary hover:bg-gray-100 rounded-lg">
            <Image
              src="/filtre.svg"
              alt="Filtre"
              width={24}
              height={24}
            />
          </button>
        </div>
    </>
  );
}