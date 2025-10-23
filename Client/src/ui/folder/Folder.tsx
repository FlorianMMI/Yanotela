import React from 'react';
import { useRouter } from 'next/navigation';
import { Folder as FolderType } from '@/type/Folder';
import { motion } from 'framer-motion';
import Icon from '@/ui/Icon';

interface FolderProps {
  folder: FolderType;
}

export default function Folder({ folder }: FolderProps) {
  const router = useRouter();

  const handleFolderClick = () => {
    router.push(`/folder/${folder.id}`);
  };

  // Couleur par défaut si non définie
  const backgroundColor = folder.CouleurTag || '#D4AF37';

  return (
    <motion.div
      className="relative w-full aspect-[4/3] cursor-pointer group"
      whileHover={{ scale: 1.05, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: "easeInOut" } }}
      onClick={handleFolderClick}
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir le dossier ${folder.Nom}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleFolderClick();
        }
      }}
      style={{ color: backgroundColor }}
    >
      {/* Icône du dossier qui sert de conteneur */}
      <Icon
        name="folder"
        size={200}
        className="w-full h-full transition-all duration-200 ease-out group-hover:brightness-110"
      />

      {/* Container du texte - positionné en bas à gauche de l'icône */}
      <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 lg:bottom-4 lg:left-4 pointer-events-none z-10">
        {/* Nombre de notes */}
        <p className="font-geologica italic text-white font-medium drop-shadow-lg text-sm md:text-base lg:text-lg leading-tight mb-0.5">
          {folder.noteCount || 0} notes
        </p>

        {/* Nom du dossier */}
        <h3
          className="font-geologica text-white font-bold truncate drop-shadow-md text-xs md:text-sm lg:text-base leading-tight max-w-[80px] md:max-w-[100px] lg:max-w-[120px]"
          title={folder.Nom}
        >
          {folder.Nom}
        </h3>
      </div>

      {/* Overlay subtil pour améliorer la lisibilité du texte */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 via-black/15 to-transparent 
                   pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity duration-200"
      />
    </motion.div>
  );
}
