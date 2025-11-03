import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Note as NoteType } from '@/type/Note';
import { motion } from 'framer-motion';

interface NoteProps {
  note: NoteType;
}

export default function Note({ note }: NoteProps) {
  const router = useRouter();

  // Log pour déboguer

  const handleNoteClick = () => {
    router.push(`/notes/${note.id}`);
  };

  // Fonction pour render le contenu de manière sécurisée
  const renderContent = () => {
    try {
      if (typeof note.Content === 'string') {
        return <p>{note.Content}</p>;
      }
      
      // Vérifier que le contenu a la structure attendue
      if (note.Content && typeof note.Content === 'object' && 'root' in note.Content) {
        const content = note.Content as any;
        if (content.root && Array.isArray(content.root.children)) {
          return content.root.children.map((child: any, childIndex: number) => (
            <div key={`child-${childIndex}`} id={`child-${childIndex}`}>
              {
                Array.isArray(child.children) && child.children.map((grandChild: any, grandChildIndex: number) => (
                  <p key={`child-${childIndex}-grandChild-${grandChildIndex}`} id={`paragraph-${childIndex}-${grandChildIndex}`}>
                    {grandChild.text || ''}
                  </p>
                ))
              }
            </div>
          ));
        }
      }
      
      // Si le format n'est pas reconnu, essayer de convertir en JSON string
      return <p>{JSON.stringify(note.Content)}</p>;
    } catch (error) {
      console.error('[Note] Error rendering content:', error, note.Content);
      return <p className="text-red-500">Erreur d'affichage du contenu</p>;
    }
  };

  return (
    
    <motion.div 
    whileHover={{ scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.25)"}}
    whileTap={{ scale: 1 }}
    
      className="bg-fondcardNote rounded-xl shadow-sm border border-clrsecondaire cursor-pointer group overflow-hidden w-full h-[125px] md:w-65 md:h-50"
      onClick={handleNoteClick}
    >

      {/* Header - Titre et collaborateurs avec fond rouge */}
      <div className="flex justify-between m-2 items-center gap-3 rounded-lg bg-primary h-[2rem]">

        {/* Note Title */}
        <h3
          className="font-geologica text-xs md:text-base text-white pl-2 h-fit w-full align-middle truncate flex-1"
          title={note.Titre}
        >
          {note.Titre}
        </h3>

        {/* Collaborateurs */}
        <div>
          {note.collaboratorCount && note.collaboratorCount > 1 && (
            <div className="flex items-center min-w-[56px] h-full gap-1 px-3 flex-shrink-0">
              <p className='text-white font-bold'>{note.collaboratorCount}</p>
              <Image
                src="/share.svg"
                alt="Participants"
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content - Titre et contenu de la note */}
      <div className="p-2 bg-fondcardNote flex flex-col h-[78px] md:p-4 md:h-40">

        {/* Note Content */}
        <div className="font-gantari text-sm text-textcardNote leading-relaxed mb-auto line-clamp-2 flex-grow">
          {renderContent()}
        </div>

        {/* Date de modification */}
        <div className="mt-2 pt-1 border-t border-gray-100 md:mt-4 md:pt-2">
          <p className="font-gantari text-xs text-element italic">
            Ouvert le {new Date(note.ModifiedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </motion.div>

  );
}
