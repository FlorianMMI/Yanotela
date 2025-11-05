import React from 'react';

export default function NoteSkeleton() {
  return (
    <div className="rounded-xl shadow-sm border overflow-hidden animate-pulse w-full h-[110px] md:w-65 md:h-50">
      
      {/* Header Skeleton - simule le titre et les collaborateurs */}
      <div className="flex justify-between m-2 items-center gap-3 rounded-lg bg-gray-300 h-12">
        {/* Titre skeleton */}
        <div className="flex-1 ml-2">
          <div className="h-4 bg-gray-400 rounded w-3/4"></div>
        </div>
        
        {/* Icon skeleton */}
        <div className="p-3 shrink-0">
          <div className="w-5 h-5 bg-gray-400 rounded"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-2 flex flex-col h-[78px] md:p-4 md:h-40">
        
        {/* Contenu skeleton - lignes de texte */}
        <div className="flex-grow space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          <div className="h-3 bg-gray-200 rounded w-3/5"></div>
        </div>

        {/* Date skeleton */}
        <div className="mt-auto pt-1 border-t border-gray-100 md:pt-2">
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}