"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import SearchBar, { SearchMode } from '@/ui/searchbar';
import { SortButton } from '@/ui/sort-button';
import { CollaborationFilterDropdown } from '@/ui/collaboration-filter-dropdown';
import { ColorFilterDropdown } from '@/ui/color-filter-dropdown';
import { RechercheIcon, FiltreIcon } from '@/libs/Icons';
import { FOLDER_COLORS } from '@/hooks/folderColors';

export interface NoteFiltersBarProps {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  showSearchMode?: boolean;
  
  // Sort
  sortDir: 'asc' | 'desc';
  setSortDir: (dir: 'asc' | 'desc') => void;
  
  // Collaboration filter
  collaborationFilter: 'all' | 'collaborative' | 'solo';
  setCollaborationFilter: (filter: 'all' | 'collaborative' | 'solo') => void;
  
  // Tag color filter
  tagColorFilter: string;
  setTagColorFilter: (color: string) => void;
  
  // Mobile header customization (optional)
  mobileTitle?: string;
  hideMobileHeader?: boolean;
}

/**
 * Unified filters bar component
 * Replaces duplicate code in NoteHeader and FolderDetailHeader
 * Provides responsive mobile/desktop filtering UI
 */
export function NoteFiltersBar({
  searchTerm,
  setSearchTerm,
  searchMode,
  setSearchMode,
  showSearchMode = true,
  sortDir,
  setSortDir,
  collaborationFilter,
  setCollaborationFilter,
  tagColorFilter,
  setTagColorFilter,
  mobileTitle = 'Mes Notes',
  hideMobileHeader = false,
}: NoteFiltersBarProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCollaborationMenu, setShowCollaborationMenu] = useState(false);
  const [showTagColorMenu, setShowTagColorMenu] = useState(false);

  // Mémoriser les handlers pour éviter les re-renders inutiles
  const handleSortDirToggle = useCallback(() => {
    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    setShowMobileFilters(false);
  }, [sortDir, setSortDir]);

  const handleCollaborationChange = useCallback((filter: 'all' | 'collaborative' | 'solo') => {
    setCollaborationFilter(filter);
    setShowMobileFilters(false);
  }, [setCollaborationFilter]);

  const handleTagColorChange = useCallback((color: string) => {
    setTagColorFilter(color);
    setShowMobileFilters(false);
  }, [setTagColorFilter]);

  // Rendu des boutons de filtre de collaboration (mobile)
  const collaborationButtons = useMemo(() => (
    (['all', 'solo', 'collaborative'] as const).map((filter) => (
      <button
        key={filter}
        onClick={() => handleCollaborationChange(filter)}
        className={`w-full text-left px-4 py-2.5 rounded-lg transition-all active:scale-95 ${
          collaborationFilter === filter
            ? 'bg-primary text-white font-medium shadow-sm'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        {filter === 'all' ? 'Toutes' : filter === 'solo' ? 'Personnelles' : 'Collaboratives'}
      </button>
    ))
  ), [collaborationFilter, handleCollaborationChange]);

  // Rendu des boutons de couleur (mobile)
  const colorButtons = useMemo(() => (
    <>
      {FOLDER_COLORS.map((color) => (
        <button
          key={color.id}
          onClick={() => handleTagColorChange(color.value)}
          className={`w-8 h-8 rounded-full border-2 transition-colors ${
            tagColorFilter === color.value
              ? 'border-primary ring-2 ring-primary'
              : 'border-gray-300 hover:border-primary'
          }`}
          style={{ backgroundColor: color.value }}
          aria-label={color.label}
        />
      ))}
      <button
        onClick={() => handleTagColorChange('')}
        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs bg-white"
        aria-label="Toutes les couleurs"
      >
        ✕
      </button>
    </>
  ), [tagColorFilter, handleTagColorChange]);

  return (
    <>
      {/* Header Mobile */}
      {!hideMobileHeader && (
        <div className="block xl:hidden md:block">
          <header className="p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">{mobileTitle}</h1>

              <div className="flex items-center gap-2">
                {/* Bouton Recherche */}
                <button
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                  className="flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Rechercher"
                >
                  <RechercheIcon className="text-primary" width={24} height={24} />
                </button>

                {/* Bouton Filtre */}
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={`flex p-2 rounded-lg transition-colors ${
                    collaborationFilter !== 'all'
                      ? 'bg-primary'
                      : 'hover:bg-gray-100'
                  }`}
                  aria-label="Filtrer"
                >
                  <FiltreIcon
                    width={24}
                    height={24}
                    className={collaborationFilter !== 'all' ? 'text-white' : 'text-primary'}
                  />
                </button>
              </div>
            </div>

            {/* Barre de recherche mobile */}
            <AnimatePresence>
              {showMobileSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    showModeSelector={showSearchMode}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Menu filtres mobile */}
            <AnimatePresence>
              {showMobileFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3 shadow-sm">
                    {/* Tri */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Trier par</p>
                      <button
                        onClick={handleSortDirToggle}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium shadow-sm active:scale-95 transition-transform"
                      >
                        Récents {sortDir === 'desc' ? '▼' : '▲'}
                      </button>
                    </div>

                    {/* Type de note */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Type de note</p>
                      <div className="space-y-2">
                        {collaborationButtons}
                      </div>
                    </div>

                    {/* Filtre par couleur de tag */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Couleur du tag</p>
                      <div className="flex flex-wrap gap-2">
                        {colorButtons}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>
        </div>
      )}

      {/* Barre de recherche et filtres - Desktop */}
      <div className="hidden xl:block md:hidden">
        <div className="flex flex-wrap items-stretch justify-center gap-3 p-4 h-full">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            showModeSelector={showSearchMode}
          />

          <div className="flex gap-2">
            <SortButton
              onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
              label="Récents"
              isActive={false}
              sortDir={sortDir}
            />

            <CollaborationFilterDropdown
              isOpen={showCollaborationMenu}
              onToggle={() => setShowCollaborationMenu(!showCollaborationMenu)}
              currentFilter={collaborationFilter}
              onFilterChange={setCollaborationFilter}
            />

            <ColorFilterDropdown
              isOpen={showTagColorMenu}
              onToggle={() => setShowTagColorMenu(!showTagColorMenu)}
              selectedColor={tagColorFilter}
              onColorSelect={setTagColorFilter}
            />
          </div>
        </div>
      </div>
    </>
  );
}
