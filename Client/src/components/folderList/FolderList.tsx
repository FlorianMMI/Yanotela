import React from 'react';
import Folder from '@/ui/folder/Folder';
import FolderSkeleton from '@/ui/folder/FolderSkeleton';
import { Folder as FolderType } from '@/type/Folder';
import { CreateFolder } from '@/loader/loader';
import { useRouter } from 'next/navigation';
import Icon from '@/ui/Icon';
import { motion } from 'framer-motion';

interface FolderListProps {
  folders: FolderType[];
  onFolderCreated?: () => void; // Callback pour refresh après création
  isLoading?: boolean; // État de chargement
}

export default function FolderList({ folders, onFolderCreated, isLoading = false }: FolderListProps) {
  const router = useRouter();

  const handleCreateFolder = async () => {
    const { folder, redirectUrl } = await CreateFolder();
    
    if (folder && redirectUrl) {
      if (onFolderCreated) {
        onFolderCreated(); // Déclencher le refresh des dossiers
      }
      router.push(redirectUrl);
    } else {
      console.error("Erreur : Impossible de créer le dossier.");
      alert("Erreur lors de la création du dossier. Veuillez réessayer.");
    }
  };

  return (
    <main className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] max-w-[1400px] mx-auto gap-3 md:gap-4 justify-items-center">

        {/* Add Folder Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.25)" }}
          whileTap={{ scale: 0.95 }}
          className="border-2 border-primary border-opacity-75 rounded-xl p-8 flex items-center justify-center hover:bg-[#ffffff5a] active:bg-primary transition-colors cursor-pointer group text-primary w-full h-[110px] md:w-65 md:h-50"
          onClick={handleCreateFolder}
          aria-label="Créer un nouveau dossier"
          title="Créer un nouveau dossier"
        >
          <Icon
            name="plus"
            size={48}
            className="group-hover:scale-110 transition-transform"
          />
        </motion.button>

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
          <Folder key={folder.id} folder={folder} />
        ))}

        {/* Message si aucun dossier et pas en chargement */}
        {!isLoading && folders.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-element text-lg font-gant">
              Aucun dossier trouvé. Créez votre premier dossier !
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
