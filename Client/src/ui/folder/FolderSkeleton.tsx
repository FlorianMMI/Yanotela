import React from 'react';

export default function FolderSkeleton() {
  return (
    <div className="bg-fondcardNote rounded-xl shadow-sm border border-clrsecondaire overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="m-2 h-[2rem] bg-gray-300 rounded-lg"></div>

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col h-32">
        {/* Description lines */}
        <div className="space-y-2 mb-auto flex-grow">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>

        {/* Date skeleton */}
        <div className="mt-4 pt-2 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  );
}
