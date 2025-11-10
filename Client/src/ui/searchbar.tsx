import Image from "next/image";
import Icon from "@/ui/Icon";

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchInContent?: boolean;
    setSearchInContent?: (value: boolean) => void;
    showContentToggle?: boolean; // Pour activer/désactiver le toggle selon le contexte
}

export default function SearchBar({ 
    searchTerm, 
    setSearchTerm, 
    searchInContent = false,
    setSearchInContent,
    showContentToggle = false
}: SearchBarProps) {

    const handleToggleSearchMode = () => {
        if (setSearchInContent) {
            setSearchInContent(!searchInContent);
        }
    };

    return (
        <>
            <div className="relative flex items-center w-full">
                <Icon
                    name="recherche"
                    size={20}
                    className="absolute left-3 top-2.5 z-10 text-gray-500"
                />
                <input
                    type="text"
                    placeholder={searchInContent ? "Rechercher dans le contenu..." : "Rechercher par titre..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-100 pl-10 ${showContentToggle ? 'pr-12' : 'pr-4'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:shadow-lg focus:border-transparent bg-white text-black transition-all duration-300`}
                />
                {showContentToggle && (
                    <button
                        type="button"
                        onClick={handleToggleSearchMode}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                            searchInContent 
                                ? 'text-primary hover:text-primary-hover' 
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={searchInContent ? "Rechercher dans le contenu" : "Rechercher par titre"}
                    >
                        <Icon
                            name="docs"
                            size={18}
                            className="transition-colors"
                        />
                    </button>
                )}
            </div>
        </>
    )

}