import { Note } from '@/type/Note';
import { create } from 'domain';
import { ID } from 'yjs';

const safeApiUrl = 'http://localhost:3001';

export async function CreateNote(noteData?: Partial<Note>): Promise<Note | null> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
        console.log('API URL:', apiUrl); // Pour debug
        
        const response = await fetch(`${apiUrl}/note/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include', // Important pour les sessions
            body: JSON.stringify({
                Titre: "Sans titre",
                Content: "Sans Contenu",
                authorId: 1,
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newNote = await response.json();
        return newNote;
    } catch (error) {
        console.error("Error creating note:", error);
        return null;
    }
}

export async function GetNotes(): Promise<Note[]> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        
        console.log('API URL for GetNotes:', apiUrl); // Pour debug
        
        const response = await fetch(`${apiUrl}/note/get`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include' 
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const notes = await response.json();
        console.log('Notes from server:', notes);

        // Transformation du JSON stringifié en objet
        for (const note of notes) {
            try {
                const parsedContent = JSON.parse(note.Content);
                if (typeof parsedContent === 'object' && parsedContent !== null) {
                    note.Content = parsedContent;
                }
            } catch {
                // If parsing fails, leave the content as is
                console.warn(`Invalid JSON content for note ID ${note.id}, leaving content unparsed.`);
            }
        }

        return notes;
    } catch (error) {
        console.error("Error fetching notes:", error);
        return [];
    }
}

export async function GetNoteById(id: number): Promise<Note | null> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        console.log('API URL for GetNoteById:', apiUrl); // Pour debug
        const response = await fetch(`${apiUrl}/note/get/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const note = await response.json();
        console.log('Note from server:', note);
        return note;
    } catch (error) {
        console.error("Error fetching note by ID:", error);
        return null;
    }
}

export async function SaveNote(id: number, noteData: Partial<Note>): Promise<boolean> {
    try {
        // Utiliser une URL par défaut si la variable d'environnement n'est pas définie
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || safeApiUrl;
        console.log('API URL for SaveNote:', apiUrl);
        const response = await fetch(`${apiUrl}/note/update/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(noteData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    }
    catch (error) {
        console.error("Error saving note:", error);
        return false;
    }
}
