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
  const backgroundColor = folder.CouleurTag || '#D4AF37'; // Or par défaut

  return (
    <motion.div 
      whileHover={{ scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.25)" }}
      whileTap={{ scale: 1 }}
      className="bg-fondcardNote rounded-xl shadow-sm border border-clrsecondaire cursor-pointer group overflow-hidden"
      onClick={handleFolderClick}
    >
      {/* Header - Nom du dossier avec icône */}
      <div 
        className="flex justify-between m-2 items-center gap-3 rounded-lg h-[2rem] px-3"
        style={{ backgroundColor }}
      >
        {/* Icône dossier */}
        <Icon 
          name="folder" 
          size={20} 
          className="text-white flex-shrink-0"
        />

        {/* Folder Name */}
        <h3
          className="font-geologica text-xs md:text-base text-white h-fit w-full align-middle truncate flex-1"
          title={folder.Nom}
        >
          {folder.Nom}
        </h3>

        {/* Nombre de notes */}
        <div className="flex items-center min-w-[32px] h-full gap-1 flex-shrink-0">
          <p className='text-white font-bold text-xs'>{folder.noteCount || 0}</p>
        </div>
      </div>

      {/* Content - Description du dossier */}
      <div className="p-4 bg-fondcardNote flex flex-col h-32">
        {/* Folder Description */}
        <div className="font-gantari text-sm text-textcardNote leading-relaxed mb-auto line-clamp-2 flex-grow">
          {folder.Description ? (
            <p>{folder.Description}</p>
          ) : (
            <p className="text-element italic">Aucune description</p>
          )}
        </div>

        {/* Date de modification */}
        <div className="mt-4 pt-2 border-t border-gray-100">
          <p className="font-gantari text-xs text-element italic">
            Modifié le {new Date(folder.ModifiedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
