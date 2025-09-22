import { Note } from '@/type/Note';
import { create } from 'domain';

export async function CreateNote(noteData?: Partial<Note>): Promise<Note | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: noteData?.title || "Sans titre",
                content: noteData?.content || "",
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