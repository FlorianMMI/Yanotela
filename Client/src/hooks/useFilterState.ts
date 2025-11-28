import { useState } from 'react';
import { SearchMode } from '@/ui/searchbar';

export interface FilterState {
  searchTerm: string;
  searchMode: SearchMode;
  sortBy: 'recent' | 'creation';
  sortDir: 'asc' | 'desc';
  collaborationFilter: 'all' | 'collaborative' | 'solo';
  tagColorFilter: string;
  colorFilters: string[];
}

export interface FilterActions {
  setSearchTerm: (term: string) => void;
  setSearchMode: (mode: SearchMode) => void;
  setSortBy: (sort: 'recent' | 'creation') => void;
  setSortDir: (dir: 'asc' | 'desc') => void;
  setCollaborationFilter: (filter: 'all' | 'collaborative' | 'solo') => void;
  setTagColorFilter: (color: string) => void;
  setColorFilters: (colors: string[]) => void;
  toggleColorFilter: (color: string) => void;
  resetFilters: () => void;
}

export interface UseFilterStateReturn {
  filters: FilterState;
  actions: FilterActions;
}

export interface UseFilterStateOptions {
  defaultSearchMode?: SearchMode;
  defaultSortBy?: 'recent' | 'creation';
  defaultSortDir?: 'asc' | 'desc';
}

/**
 * Hook to manage filter state for notes, folders, etc.
 * Centralizes all filtering logic used across NoteHeader, FolderDetailHeader, and FolderHeader
 */
export function useFilterState(options: UseFilterStateOptions = {}): UseFilterStateReturn {
  const {
    defaultSearchMode = 'all',
    defaultSortBy = 'recent',
    defaultSortDir = 'desc',
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(defaultSearchMode);
  const [sortBy, setSortBy] = useState<'recent' | 'creation'>(defaultSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [collaborationFilter, setCollaborationFilter] = useState<'all' | 'collaborative' | 'solo'>('all');
  const [tagColorFilter, setTagColorFilter] = useState('');
  const [colorFilters, setColorFilters] = useState<string[]>([]);

  const toggleColorFilter = (color: string) => {
    if (colorFilters.includes(color)) {
      setColorFilters(colorFilters.filter(c => c !== color));
    } else {
      setColorFilters([...colorFilters, color]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSearchMode(defaultSearchMode);
    setSortBy(defaultSortBy);
    setSortDir(defaultSortDir);
    setCollaborationFilter('all');
    setTagColorFilter('');
    setColorFilters([]);
  };

  return {
    filters: {
      searchTerm,
      searchMode,
      sortBy,
      sortDir,
      collaborationFilter,
      tagColorFilter,
      colorFilters,
    },
    actions: {
      setSearchTerm,
      setSearchMode,
      setSortBy,
      setSortDir,
      setCollaborationFilter,
      setTagColorFilter,
      setColorFilters,
      toggleColorFilter,
      resetFilters,
    },
  };
}
