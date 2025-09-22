

"use client";

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
            <h1 className="text-2xl font-bold text-red-800">Mes Notes</h1>
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
        <div className="bg-red-800 h-2"></div>
        <header className="bg-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-red-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <span className="text-lg font-medium text-gray-800">Mes notes</span>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Recherche de notes"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <Image
                  src="/recherche.svg"
                  alt="Recherche"
                  width={20}
                  height={20}
                  className="absolute right-3 top-2.5"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setSortBy("recent")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  sortBy === "recent" 
                    ? "bg-red-700 text-white" 
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                </svg>
                Récents
              </button>
              
              <button 
                onClick={() => setSortBy("creation")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  sortBy === "creation" 
                    ? "bg-red-700 text-white" 
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Dates de création
              </button>
            </div>
            
            <button className="p-2 text-red-800 hover:bg-gray-100 rounded-lg">
              <Image
                src="/filtre.svg"
                alt="Filtre"
                width={24}
                height={24}
              />
            </button>
          </div>
        </header>
      </div>
    </>
  );
}