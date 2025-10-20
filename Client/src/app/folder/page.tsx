"use client";
import React from "react";
import { useState, useEffect, Suspense } from "react";
import { Folder } from "@/type/Folder";
import FolderHeader from "@/components/folderHeader/FolderHeader";
import FolderList from "@/components/folderList/FolderList";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { GetFolders } from "@/loader/loader";

export default function FoldersPage() {
  const { isAuthenticated, loading: authLoading } = useAuthRedirect();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "creation">("recent");
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
    .filter(folder =>
      folder.Nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      folder.Description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Tri par date de modification (plus récent en premier)
      return new Date(b.ModifiedAt).getTime() - new Date(a.ModifiedAt).getTime();
    }) : [];

  return (
    <div className="h-full w-full">
      <FolderHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <Suspense fallback={
        <div className="p-4">
          <div className="text-center text-gray-500">Chargement des dossiers...</div>
        </div>
      }>
        <FolderList
          folders={filteredFolders}
          onFolderCreated={fetchFolders}
          isLoading={loading}
        />
      </Suspense>
    </div>
  );
}
