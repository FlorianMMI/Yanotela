import Image from "next/image";
import Icon from "@/ui/Icon";


interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    }

export default function SearchBar({ searchTerm, setSearchTerm }: SearchBarProps) {

    return (
        <>
            <div className="relative flex items-center w-full">
                <Icon
                    name="recherche"
                    size={20}
                    className="absolute left-3 top-2.5 z-10"
                />
                <input
                    type="text"
                    placeholder="Recherche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-100 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:shadow-lg focus:border-transparent bg-white text-black transition-all duration-300"
                />
            </div>
        </>
    )

}