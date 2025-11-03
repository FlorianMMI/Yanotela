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

  // Log des informations du dossier pour déboguer
  console.log(`[DEBUG Folder] Dossier: "${folder.Nom}", noteCount: ${folder.noteCount || 0}, ID: ${folder.id}`);

  const handleFolderClick = () => {
    router.push(`/folder/${folder.id}`);
  };

  // Couleur par défaut si non définie
  const backgroundColor = folder.CouleurTag || '#D4AF37';

  return (
    <motion.div
      className="relative w-full h-[110px] md:w-65 md:h-50 cursor-pointer group"
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
      <svg width="100%" height="100%" viewBox="0 0 108 87" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.1752 82.8919C5.2884 84.9965 7.83 86.0488 10.8 86.0488H97.2C100.174 86.0524 102.717 85.0001 104.83 82.8919C106.943 80.7837 108 78.2506 108 75.2927V21C108 15 103 11 98 11H54L43.2 0H10.8C7.8336 0.00358537 5.292 1.05768 3.1752 3.16229C1.0584 5.2669 0 7.79817 0 10.7561V75.2927C0.0036 78.2542 1.062 80.7873 3.1752 82.8919Z" fill="currentColor"/>
</svg>

      {/* Container du texte - positionné en bas à gauche de l'icône */}
      <div className="absolute bottom-3 left-6 md:bottom-3 md:left-3 lg:bottom-4 lg:left-4 pointer-events-none z-10">
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

      
      
    </motion.div>
  );
}
