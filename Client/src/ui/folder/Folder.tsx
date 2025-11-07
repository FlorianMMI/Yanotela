import React, { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Folder as FolderType } from '@/type/Folder';
import { FOLDER_COLORS } from '@/hooks/folderColors';
import { motion } from "motion/react";
import Icon from '@/ui/Icon';
import FolderMore from '@/components/folderMore/FolderMore';

interface FolderProps {
  folder: FolderType;
  onFolderUpdated?: () => void; // Callback pour rafraîchir la liste après modification/suppression
}

export default function Folder({ folder, onFolderUpdated }: FolderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const folderRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Vérifier si on est dans la corbeille
  const isInTrash = pathname?.includes('/trash') || pathname?.includes('/corbeille');

  const handleFolderClick = (e: React.MouseEvent) => {
    // Ne pas naviguer si le modal est ouvert
    if (showMoreModal) {
      e.preventDefault();
      return;
    }
    router.push(`/folder/${folder.id}`);
  };

  const openContextMenu = (clientX: number, clientY: number) => {
    if (isInTrash) return;

    // Calculer la position du modal par rapport à l'élément
    if (folderRef.current) {
      const rect = folderRef.current.getBoundingClientRect();
      
      // Positionner le modal juste en dessous du dossier
      let x = rect.left;
      let y = rect.bottom + 8; // 8px d'espacement

      // Vérifier si le modal dépasse de l'écran
      const modalWidth = 280; // Largeur réduite du modal
      const modalHeight = 250; // Hauteur estimée du modal

      // Ajuster horizontalement si ça dépasse à droite
      if (x + modalWidth > window.innerWidth) {
        x = window.innerWidth - modalWidth - 16;
      }

      // Ajuster verticalement si ça dépasse en bas
      if (y + modalHeight > window.innerHeight) {
        y = rect.top - modalHeight - 8; // Afficher au-dessus
      }

      setModalPosition({ x, y });
      setShowMoreModal(true);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY);
  };

  // Support tactile : maintien appuyé (long press)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isInTrash) return;

    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      openContextMenu(touch.clientX, touch.clientY);
      // Vibration pour retour haptique sur mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms pour le long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    // Annuler le long press si l'utilisateur déplace son doigt
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCloseModal = () => {
    setShowMoreModal(false);
  };

  const handleUpdateFolder = async (name: string, description: string, color: string) => {
    // Cette fonction sera appelée par FolderMore pour mettre à jour le dossier
    // Appeler le callback parent pour rafraîchir la liste
    if (onFolderUpdated) {
      onFolderUpdated();
    }
    window.dispatchEvent(new Event('auth-refresh'));
  };

  const handleDeleteFolder = () => {
    // Cette fonction sera appelée après la suppression du dossier
    // Appeler le callback parent pour rafraîchir la liste
    if (onFolderUpdated) {
      onFolderUpdated();
    }
    window.dispatchEvent(new Event('auth-refresh'));
  };

  // Déterminer la couleur de fond du dossier
  const folderColorObj = FOLDER_COLORS.find(color => color.value === folder.CouleurTag);
  const backgroundColor = folderColorObj ? folderColorObj.value : 'var(--primary)';

  return (
    <>
    <motion.div
      ref={folderRef}
      className="relative w-fit h-[110px] md:w-65 md:h-50 cursor-pointer group"
      whileHover={{ scale: 1.05, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: "easeInOut" } }}
      onClick={handleFolderClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir le dossier ${folder.Nom}`}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleFolderClick(e as any);
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
          className="font-geologica text-white font-bold truncate drop-shadow-md text-xs md:text-sm lg:text-base leading-tight  md:max-w-[100px] lg:max-w-[120px]"
          title={folder.Nom}
        >
          {folder.Nom}
        </h3>
      </div>

    </motion.div>

    {/* Modal FolderMore - affiché en mode contextuel réduit */}
    {showMoreModal && (
      <>
        {/* Overlay transparent pour fermer le modal */}
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleCloseModal}
        />
        {/* Modal positionné */}
        <div 
          className="fixed z-50"
          style={{ 
            left: `${modalPosition.x}px`, 
            top: `${modalPosition.y}px`,
            maxHeight: 'calc(100vh - 100px)'
          }}
        >
          <div className="context-menu-compact">
            <FolderMore
              folder={folder}
              folderId={folder.id}
              folderName={folder.Nom}
              folderDescription={folder.Description || ''}
              folderColor={folder.CouleurTag || '#882626'}
              noteCount={folder.noteCount || 0}
              onUpdate={handleUpdateFolder}
              onDelete={handleDeleteFolder}
              onClose={handleCloseModal}
            />
          </div>
        </div>
      </>
    )}
    </>
  );
}
