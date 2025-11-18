import Image from "next/image";
import Icon from "@/ui/Icon";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export type SearchMode = 'all' | 'title' | 'content';

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchMode?: SearchMode;
    setSearchMode?: (mode: SearchMode) => void;
    showModeSelector?: boolean; // Pour activer/désactiver le sélecteur selon le contexte
}

export default function SearchBar({ 
    searchTerm, 
    setSearchTerm, 
    searchMode = 'all',
    setSearchMode,
    showModeSelector = false
}: SearchBarProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const searchModes = [
        { key: 'all' as SearchMode, label: 'Tout', icon: 'recherche', description: 'Rechercher dans titre et contenu' },
        { key: 'title' as SearchMode, label: 'Titre', icon: 'text-left', description: 'Rechercher uniquement dans les titres' },
        { key: 'content' as SearchMode, label: 'Contenu', icon: 'docs', description: 'Rechercher uniquement dans le contenu' }
    ];

    const currentMode = searchModes.find(mode => mode.key === searchMode) || searchModes[0];

    const handleModeChange = (mode: SearchMode) => {
        if (setSearchMode) {
            setSearchMode(mode);
        }
        setShowDropdown(false);
    };

    const handleToggleDropdown = () => {
        if (!showDropdown && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.right - 192, // 192px = min-w-48 * 4px
                width: 192
            });
        }
        setShowDropdown(!showDropdown);
    };

    const getPlaceholder = () => {
        switch (searchMode) {
            case 'title':
                return "Rechercher par titre...";
            case 'content':
                return "Rechercher dans le contenu...";
            default:
                return "Rechercher dans titre et contenu...";
        }
    };

    return (
        <>
            <div className="relative flex w-full gap-2">
                {/* Barre de recherche */}
                <div className="relative w-full flex h-full p-4 gap-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:shadow-lg focus:border-transparent bg-white text-black transition-all duration-300">
                    <Icon
                        name="recherche"
                        size={20}
                        className="text-gray-500"
                    />
                    <input
                        type="text"
                        placeholder={getPlaceholder()}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-[25rem] h-full "
                    />
                </div>

                {/* Bouton sélecteur de mode */}
                {showModeSelector && (
                    <div className="relative h-full z-50">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={handleToggleDropdown}
                            className="flex items-center h-full border border-gray-300 hover:border-primary gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors min-w-fit touch-manipulation relative z-10"
                            title={currentMode.description}
                        >
                            <Icon
                                name={currentMode.icon}
                                size={18}
                                className="text-primary"
                            />
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap hidden sm:inline">
                                {currentMode.label}
                            </span>
                            <Icon
                                name="chevron-down"
                                size={16}
                                className={`text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown menu avec portail */}
                        {showDropdown && createPortal(
                            <>
                                {/* Overlay pour fermer le dropdown */}
                                <div 
                                    className="fixed inset-0 " 
                                    onClick={() => setShowDropdown(false)}
                                />
                                
                                {/* Menu dropdown - positionné absolument */}
                                <div 
                                    className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-48 max-w-xs"
                                    style={{
                                        top: `${dropdownPosition.top}px`,
                                        left: `${Math.max(dropdownPosition.left, 16)}px`, // 16px de marge minimum
                                        zIndex: 9999
                                    }}
                                >
                                    {searchModes.map((mode) => (
                                        <button
                                            key={mode.key}
                                            onClick={() => handleModeChange(mode.key)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 sm:px-3 sm:py-2 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation ${
                                                searchMode === mode.key ? 'bg-primary/10 text-primary' : 'text-gray-700'
                                            }`}
                                        >
                                            <Icon
                                                name={mode.icon}
                                                size={20}
                                                className={searchMode === mode.key ? 'text-primary' : 'text-gray-500'}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-base sm:text-sm">{mode.label}</p>
                                                <p className="text-sm sm:text-xs text-gray-500">{mode.description}</p>
                                            </div>
                                            {searchMode === mode.key && (
                                                <Icon
                                                    name="check"
                                                    size={18}
                                                    className="text-primary"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                )}
            </div>
        </>
    )

}
