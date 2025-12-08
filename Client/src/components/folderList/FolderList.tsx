import React from 'react';
import Folder from '@/ui/folder/Folder';
import FolderSkeleton from '@/ui/folder/FolderSkeleton';
import { Folder as FolderType } from '@/type/Folder';
import { CreateFolder } from '@/loader/loader';
import { useRouter } from 'next/navigation';

import { motion } from "motion/react";
import { PlusIcon } from '@/libs/Icons';

interface FolderListProps {
  folders: FolderType[];
  onFolderCreated?: () => void; // Callback pour refresh après création
  isLoading?: boolean; // État de chargement
}

export default function FolderList({ folders, onFolderCreated, isLoading = false }: FolderListProps) {

  const handleCreateFolder = async () => {
    const { folder } = await CreateFolder();
    
    if (folder) {
      if (onFolderCreated) {
        onFolderCreated(); // Déclencher le refresh des dossiers
      }
    } else {
      console.error("Erreur : Impossible de créer le dossier.");
      
    }
  };

  return (
    <main className="p-4">
      <div
        className="grid gap-3 md:gap-4 max-w-full justify-items-center"
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(140px, 1fr))',
        }}
      >
        {/* Add Folder Button - Toujours visible */}
        <div
          className="relative group w-full aspect-[108/87] rounded-xl flex items-center justify-center transition-colors cursor-pointer text-primary"
          style={{ minWidth: 0, minHeight: 0, maxWidth: 260 }}
        >
          <motion.svg
            whileHover={{ scale: 1.03, filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18))" }}
            whileTap={{ scale: 0.97, filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.12))" }}
            onClick={handleCreateFolder}
            role="button"
            tabIndex={0}
            className="w-full h-full text-primary overflow-visible cursor-pointer focus:outline-none focus-visible:outline-none"
            style={{ transition: 'filter 180ms ease, transform 180ms ease', outline: 'none' }}
            width="108"
            height="87"
            viewBox="0 0 108 87"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.1752 82.8919C5.2884 84.9965 7.83 86.0488 10.8 86.0488H97.2C100.174 86.0524 102.717 85.0001 104.83 82.8919C106.943 80.7837 108 78.2506 108 75.2927V21C108 15 103 11 98 11H54L43.2 0H10.8C7.8336 0.00358537 5.292 1.05768 3.1752 3.16229C1.0584 5.2669 0 7.79817 0 10.7561V75.2927C0.0036 78.2542 1.062 80.7873 3.1752 82.8919Z" fill="none"/>
          </motion.svg>
          <PlusIcon
            width={48}
            height={48}
            strokeWidth={1}
            className="absolute z-10 group-hover:scale-110 transition-transform pointer-events-none"
            aria-hidden={true}
          />
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <>
            {Array.from({ length: 8 }).map((_, index) => (
              <FolderSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}

        {/* Folders Grid */}
        {!isLoading && folders.map((folder) => (
          <div key={folder.id} className="w-full aspect-108/87 max-w-[260px] min-w-0 min-h-0">
            <Folder folder={folder} onFolderUpdated={onFolderCreated} />
          </div>
        ))}
      </div>

      {/* Message si aucun dossier */}
      {!isLoading && folders.length === 0 && (
        <div className="text-center py-16 px-4 pointer-events-none select-none">
          <p className="text-element font-geo text-xl italic">
            Aucun dossier pour le moment
          </p>
          <p className="text-element/70 font-gant text-sm mt-2">
            Appuyez sur + pour créer votre premier dossier
          </p>
        </div>
      )}
    </main>
  );
}
