"use client";

import { useState } from "react";
import { Note } from "@/type/Note";
import NoteHeader from "@/components/noteHeader/NoteHeader";
import NoteList from "@/components/noteList/NoteList";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "creation">("recent");

  // Filtrer et trier les notes

  return (
    <div className="min-h-screen bg-gray-50">
      <NoteHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      {/* <NoteList notes={filteredNotes} /> */}
    </div>
  );
}
