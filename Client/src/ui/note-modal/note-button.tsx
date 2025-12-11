import { ModifIcon } from '@/libs/Icons';

interface NoteButtonProps {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    Title: string;
    modal?: string;
    setCurrentView?: React.Dispatch<React.SetStateAction<any>> | ((view: string) => void); onClick?: () => void;
    borderTop?: boolean;
    delete?: boolean;
    showEditIcon?: boolean;
    onEditClick?: () => void;
}

export default function NoteButton({ 
    Icon, 
    delete: isDelete, 
    Title, 
    modal, 
    setCurrentView, 
    onClick, 
    borderTop = true,
    showEditIcon = false,
    onEditClick
}: NoteButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) return onClick();
        if (modal && setCurrentView) setCurrentView(modal);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEditClick) onEditClick();
    };

    return (
        <div className={`flex items-center w-full ${borderTop ? 'border-t border-gray-100' : ''}`}>
            <button
                type="button"
                onClick={handleClick}
                className={`flex-1 flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 text-left text-sm md:text-base font-medium transition-colors text-primary hover:bg-deskbackground hover:text-primary-hover ${isDelete ? 'text-dangerous-800 hover:bg-red-50' : ''}`}
            >
                <Icon width={18} height={18} className="text-primary" />
                <span>{Title}</span>
            </button>
            {showEditIcon && (
                <button
                    type="button"
                    onClick={handleEditClick}
                    className="px-3 py-2 md:py-3 text-primary hover:bg-deskbackground transition-colors"
                    title="Gérer les tags"
                >
                <ModifIcon width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24"/>
                    
                </button>
            )}
        </div>
    );
}