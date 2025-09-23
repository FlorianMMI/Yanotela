import Image from "next/image";


interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    }

export default function SearchBar({ searchTerm, setSearchTerm }: SearchBarProps) {

    return (
        <>
            <div className="relative flex items-center">
                <Image
                    src="/recherche.svg"
                    alt="Recherche"
                    width={20}
                    height={20}
                    className="absolute left-3 top-2.5"
                />
                <input
                    type="text"
                    placeholder="Recherche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>
        </>
    )

}