interface NoteButtonProps {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    Title: string;
    modal?: string;
    setCurrentView?: React.Dispatch<React.SetStateAction<any>> | ((view: string) => void); onClick?: () => void;
    borderTop?: boolean;
    delete?: boolean;
}

export default function NoteButton({ Icon, delete: isDelete, Title, modal, setCurrentView, onClick, borderTop = true }: NoteButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) return onClick();
        if (modal && setCurrentView) setCurrentView(modal);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-left text-sm md:text-base font-medium transition-colors w-full ${borderTop ? 'border-t border-gray-100' : ''} text-primary hover:bg-deskbackground hover:text-primary-hover ${isDelete ? 'text-dangerous-800 hover:bg-red-50' : ''}`}

        >
            <Icon width={18} height={18} className="text-primary" />
            <span>{Title}</span>
        </button>
    );
}