

"use client";

import SearchBar from "@/ui/searchbar";
import Image from "next/image";

interface NoteHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: "recent" | "creation";
  setSortBy: (sort: "recent" | "creation") => void;
}

export default function NoteHeader({ searchTerm, setSearchTerm, sortBy, setSortBy }: NoteHeaderProps) {
  return (
    <>
      {/* Header Mobile */}
      <div className="block md:hidden">
        <header className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Mes Notes</h1>
            <div className="flex items-center gap-4">
              <Image
                src="/recherche.svg"
                alt="Recherche"
                width={24}
                height={24}
                className="cursor-pointer"
              />
              <Image
                src="/filtre.svg"
                alt="Menu"
                width={24}
                height={24}
                className="cursor-pointer"
              />
            </div>
          </div>
        </header>
      </div>

      {/* Header Desktop */}
      <div className="hidden md:block">

        <header className="bg-gray-200 p-3 border-primary border-b-25">
          <div className="flex items-center gap-2 ">
            <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <span className="text-lg font-medium text-gray-800">Mes notes</span>
          </div>


        </header>

        <div className="flex items-center justify-center gap-3 p-6">

          {/* Search Bar */}
          <div className="flex justify-center items-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>

          {/* Sort Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${sortBy === "recent"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" />
              </svg>
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

      </div>
    </>
  );
}