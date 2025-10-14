import React from 'react';
import Image from 'next/image';
import Note from '@/ui/note/Note';
import NoteSkeleton from '@/ui/note/NoteSkeleton';
import { Note as NoteType } from '@/type/Note';
import { CreateNote } from '@/loader/loader';
import { useRouter } from 'next/navigation';
import Icons from '@/ui/Icon';
import { motion } from 'framer-motion';

interface NoteListProps {
  notes: NoteType[];
  onNoteCreated?: () => void; // Callback pour refresh après création
  isLoading?: boolean; // État de chargement
}

export default function NoteList({ notes, onNoteCreated, isLoading = false }: NoteListProps) {

  const router = useRouter();

  const handleCreateNote = async () => {
    const { note, redirectUrl } = await CreateNote();
    
    if (note && redirectUrl) {
      if (onNoteCreated) {
        onNoteCreated(); // Déclencher le refresh des notes
      }
      router.push(redirectUrl);
    } else {
      console.error("Erreur : Impossible de récupérer l'ID de la note créée.");
    }
  };

  return (
    <main className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">

        {/* Add Note Button */}
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.25)" }}
          whileTap={{ scale: 0.95 }}
          className="border-2 border-primary border-opacity-75 rounded-xl p-8 flex items-center justify-center hover:bg-[#ffffff5a] active:bg-primary transition-colors cursor-pointer group text-primary"
          onClick={handleCreateNote}
        >
          <Icons
            name="plus"
            size={48}
            className="group-hover:scale-110 transition-transform"
          />
        </motion.div>

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
            <p className="text-element text-lg font-gant">
              Aucune note trouvée. Créez votre première note !
            </p>
          </div>
        )}


      </div>
    </main>
  );
}