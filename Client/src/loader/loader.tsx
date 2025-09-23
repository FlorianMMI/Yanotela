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
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const notes = await response.json();
        return notes;
    } catch (error) {
        console.error("Error fetching notes:", error);
        return [];
    }
}