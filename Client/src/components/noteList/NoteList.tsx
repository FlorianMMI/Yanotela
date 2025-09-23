import React from 'react';
import Image from 'next/image';
import Note from '@/ui/note/Note';
import { Note as NoteType } from '@/type/Note';
import { CreateNote } from '@/loader/loader';

interface NoteListProps {
  notes: NoteType[];
  onNoteCreated?: () => void; // Callback pour refresh après création
}

export default function NoteList({ notes, onNoteCreated }: NoteListProps) {
  
  const handleCreateNote = async () => {
    const newNote = await CreateNote();
    if (newNote && onNoteCreated) {
      onNoteCreated(); // Déclencher le refresh des notes
    }
  };

  return (
    <main className="p-4 md:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">

        {/* Add Note Button */}
        <div className="bg-white border-2 border-primary border-dashed rounded-xl p-8 flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer group" onClick={handleCreateNote}>
          <Image
            src="/plus.svg"
            alt="Ajouter une note"
            width={48}
            height={48}
           
            className="group-hover:scale-110 transition-transform"
          />
        </div>

        {/* Notes Grid */}
        {notes.map((note) => (
          <Note key={note.id} note={note} />
        ))}
      </div>
    </main>
  );
}