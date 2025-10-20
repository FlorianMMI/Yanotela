import React, { createContext, useContext, ReactNode } from 'react';
import { Note } from '../../../type/Note';

interface NoteContextType {
    note: Note | null;
    isReadOnly: boolean;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

interface NoteProviderProps {
    children: ReactNode;
    note: Note | null;
    isReadOnly: boolean;
}

export function NoteProvider({ children, note, isReadOnly }: NoteProviderProps) {
    return (
        <NoteContext.Provider value={{ note, isReadOnly }}>
            {children}
        </NoteContext.Provider>
    );
}

export function useNoteContext() {
    const context = useContext(NoteContext);
    if (context === undefined) {
        throw new Error('useNoteContext must be used within a NoteProvider');
    }
    return context;
}