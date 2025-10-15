import React from 'react';

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
}

export function ToolbarButton({ onClick, isActive, children, title }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
                isActive ? 'bg-gray-300' : ''
            }`}
        >
            {children}
        </button>
    );
}
