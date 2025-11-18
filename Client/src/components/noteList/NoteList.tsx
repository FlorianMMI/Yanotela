import React from 'react';
import Image from 'next/image';
import Note from '@/ui/note/Note';
import NoteSkeleton from '@/ui/note/NoteSkeleton';
import { Note as NoteType } from '@/type/Note';
import { CreateNote } from '@/loader/loader';
import { useRouter } from 'next/navigation';
import Icons from '@/ui/Icon';
import { motion } from 'motion/react';
import { SearchMode } from '@/ui/searchbar';

interface NoteListProps {
  notes: NoteType[];
  onNoteCreated?: () => void; // Callback pour refresh après création
  isLoading?: boolean; // État de chargement
  allowCreateNote?: boolean; // Autoriser la création de note (par défaut: true)
  folderId?: string; // ID du dossier pour créer la note directement dedans
  onCreateNote?: () => void; // Callback personnalisé pour la création de note
  searchTerm?: string; // Terme de recherche pour surlignage
  searchMode?: SearchMode; // Mode de recherche actif
}

export default function NoteList({ 
  notes, 
  onNoteCreated, 
  isLoading = false, 
  allowCreateNote = true, 
  folderId, 
  onCreateNote,
  searchTerm = "",
  searchMode = "all"
}: NoteListProps) {

  const router = useRouter();

  const handleCreateNote = async () => {
    // Si un callback personnalisé est fourni, l'utiliser
    if (onCreateNote) {
      onCreateNote();
      return;
    }

    const { note, redirectUrl } = await CreateNote();
    
    if (note && redirectUrl) {
      // Avec y-websocket, la connexion se fait automatiquement lors de l'ouverture de la note
      // Plus besoin de joindre manuellement via Socket.IO
      
      if (onNoteCreated) {
        onNoteCreated(); // Déclencher le refresh des notes
      }
      
      // Si un folderId est fourni, l'ajouter à l'URL
      const url = folderId ? `${redirectUrl}?folderId=${folderId}` : redirectUrl;
      router.push(url);
    } else {
      console.error("Erreur : Impossible de récupérer l'ID de la note créée.");
    }
  };

  return (
    <main className="p-4 relative">
      {/* Message si aucune note et pas en chargement - Centré sur la page */}
      {!isLoading && notes.length === 0 && (
       
          <p className="absolute inset-0 flex items-center justify-center pointer-events-none text-element text-lg font-gant mx-4 text-center">
            Aucune note trouvée. Créez votre première note !
          </p>
        
      )}

      <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] max-w-full gap-4 md:gap-6 justify-items-start">

        {/* Add Note Button - Only shown if allowCreateNote is true */}
        {allowCreateNote && (
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.25)" }}
            whileTap={{ scale: 0.95 }}
            className="border-2 border-primary border-opacity-75 rounded-xl p-8 flex items-center justify-center hover:bg-[#ffffff5a] active:bg-primary transition-colors cursor-pointer group text-primary w-full h-full md:w-65 md:h-50"
            onClick={handleCreateNote}
          >
            <Icons
              name="plus"
              size={48}
              strokeWidth={1}
              className="group-hover:scale-110 transition-transform"
            />
          </motion.div>
        )}

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
          <Note 
            key={note.id} 
            note={note} 
            onNoteUpdated={onNoteCreated}
            searchTerm={searchTerm}
            searchMode={searchMode}
          />
        ))}
      </div>
    </main>
  );
}
