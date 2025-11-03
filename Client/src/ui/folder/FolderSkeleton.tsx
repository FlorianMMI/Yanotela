import React from 'react';

export default function FolderSkeleton() {
  return (
    <div className="relative overflow-hidden animate-pulse w-full h-[110px] md:w-65 md:h-50 text-gray-300">
      {/* Icône du dossier qui sert de conteneur avec couleur skeleton */}
      <svg width="100%" height="100%" viewBox="0 0 108 87" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.1752 82.8919C5.2884 84.9965 7.83 86.0488 10.8 86.0488H97.2C100.174 86.0524 102.717 85.0001 104.83 82.8919C106.943 80.7837 108 78.2506 108 75.2927V21C108 15 103 11 98 11H54L43.2 0H10.8C7.8336 0.00358537 5.292 1.05768 3.1752 3.16229C1.0584 5.2669 0 7.79817 0 10.7561V75.2927C0.0036 78.2542 1.062 80.7873 3.1752 82.8919Z" fill="currentColor"/>
      </svg>

      {/* Container du texte skeleton - positionné en bas à gauche de l'icône */}
      <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 lg:bottom-4 lg:left-4 pointer-events-none z-10">
        {/* Nombre de notes skeleton */}
        <div className="mb-0.5">
          <div className="h-3 bg-gray-400 rounded w-12 md:w-16"></div>
        </div>

        {/* Nom du dossier skeleton */}
        <div className="h-3 bg-gray-400 rounded w-16 md:w-20"></div>
      </div>
    </div>
  );
}
