"use client";
import React from "react";
import { useState, useEffect, Suspense } from "react";
import { Folder } from "@/type/Folder";
import FolderHeader from "@/components/folderHeader/FolderHeader";
import FolderList from "@/components/folderList/FolderList";
import { GetFolders } from "@/loader/loader";
import { SearchMode } from "@/ui/searchbar";

// Métadonnées SEO gérées côté serveur dans layout.tsx

export default function FoldersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title"); // Force title mode pour les dossiers
  const [sortBy, setSortBy] = useState<"recent" | "creation">("recent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [colorFilters, setColorFilters] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les dossiers au montage du composant
  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      
      const response = await GetFolders();
      setFolders(response.folders || []);
    } catch (error) {
      console.error("Error loading folders:", error);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les dossiers
  const filteredFolders = Array.isArray(folders) ? folders
    .filter(folder => {
      // Filtre de recherche - seulement dans le titre
      const matchesSearch = !searchTerm || 
        folder.Nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      
      // Filtre de couleur avec normalisation
      const matchesColor = colorFilters.length === 0 || 
        colorFilters.some((filterColor: string) => {
          const folderColor = folder.CouleurTag || '#882626';
          // Normaliser var(--primary) et #882626 comme équivalents
          const normalizedFolderColor = (folderColor === 'var(--primary)' || folderColor === '#882626') ? 'var(--primary)' : folderColor;
          const normalizedFilterColor = (filterColor === 'var(--primary)' || filterColor === '#882626') ? 'var(--primary)' : filterColor;
          return normalizedFolderColor === normalizedFilterColor;
        });
      
      return matchesSearch && matchesColor;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        const da = new Date(a.ModifiedAt).getTime();
        const db = new Date(b.ModifiedAt).getTime();
        return sortDir === "desc" ? db - da : da - db;
      } else {
        const da = new Date(a.CreatedAt).getTime();
        const db = new Date(b.CreatedAt).getTime();
        return sortDir === "desc" ? db - da : da - db;
      }
    }) : [];

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6">
      <FolderHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        colorFilters={colorFilters}
        setColorFilters={setColorFilters}
      />

      <div className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-11rem)] md:max-h-none">
        <Suspense fallback={
          <div className="p-4">
            <div className="text-center text-gray-100">Chargement des dossiers...</div>
          </div>
        }>
          <FolderList
            folders={filteredFolders}
            onFolderCreated={fetchFolders}
            isLoading={loading}
          />
        </Suspense>
      </div>
    </div>
  );
}
