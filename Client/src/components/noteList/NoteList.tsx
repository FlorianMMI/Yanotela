import React from 'react';
import Image from 'next/image';
import Note from '@/ui/note/Note';
import NoteSkeleton from '@/ui/note/NoteSkeleton';
import { Note as NoteType } from '@/type/Note';
import { CreateNote } from '@/loader/loader';
import { useRouter } from 'next/navigation';
import Icons from '@/ui/Icon';

interface NoteListProps {
  notes: NoteType[];
  onNoteCreated?: () => void; // Callback pour refresh après création
  isLoading?: boolean; // État de chargement
}

export default function NoteList({ notes, onNoteCreated, isLoading = false }: NoteListProps) {
  
  const router = useRouter();

  const handleCreateNote = async () => {
    const newNote = await CreateNote();
    if (newNote && onNoteCreated) {
      onNoteCreated(); // Déclencher le refresh des notes
      setTimeout(() => {
        router.push(`/notes/${newNote.id}`); // Rediriger vers la nouvelle note après un délai
      }, 500); // Délai de 500ms pour laisser le temps de créer l'ID
    }
  };

  return (
    <main className="p-4 md:pl-25 md:pr-25 md:pt-8">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">

        {/* Add Note Button */}
        <div className=" border-2 border-primary rounded-xl p-8 flex items-center justify-center hover:bg-primary active:bg-primary transition-colors cursor-pointer group text-primary hover:text-fondcardNote" onClick={handleCreateNote}>
          <Icons
            name="plus"
            size={48}
            className="group-hover:scale-110 transition-transform "
          />
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <>
            {Array.from({ length: 8 }).map((_, index) => (
              <NoteSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}

        {/* Notes Grid */}
        {!isLoading && notes.map((note) => (
          <Note key={note.id} note={note} />
        ))}

        {/* Message si aucune note et pas en chargement */}
        {!isLoading && notes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg font-gant">
              Aucune note trouvée. Créez votre première note !
            </p>
          </div>
        )}
      </div>
    </main>
  );
}