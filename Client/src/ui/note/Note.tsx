import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Note as NoteType } from '@/type/Note';

interface NoteProps {
  note: NoteType;
}

export default function Note({ note }: NoteProps) {
  const router = useRouter();

  const handleNoteClick = () => {
    router.push(`/notes/${note.id}`);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleNoteClick}
    >

      {/* Header - Titre et collaborateurs avec fond rouge */}
      <div className="flex justify-between m-2 items-center gap-3 rounded-lg bg-primary">

        {/* Note Title */}
        <h3
          className="font-geologica text-xs md:text-base text-white pl-2 leading-tight line-clamp-2 truncate"
          title={note.Titre}
        >
          {note.Titre}
        </h3>

        {/* Collaborateurs */}
        <div
          className="flex items-center gap-1 p-3 flex-shrink-0"
        >
          <Image
            src="/share.svg"
            alt="Participants"
            width={20}
            height={20}
            className="filter brightness-0 invert"
          />
        </div>
      </div>

      {/* Content - Titre et contenu de la note */}
      <div className="p-4 bg-white flex flex-col h-32">

        {/* Note Content */}
        <div className="font-gantari text-sm text-gray-600 leading-relaxed mb-auto line-clamp-2 flex-grow">
          {
            typeof note.Content === 'string'
              ? <p>{note.Content}</p>
              // @ts-expect-error Les notes sont au format attendu par Lexical
              // eslint-disable-next-line
              : note.Content.root.children.map((child: any, childIndex: number) => (
                  <div key={`child-${childIndex}`} id={`child-${childIndex}`}>
                    {
                      // eslint-disable-next-line
                      child.children.map((grandChild: any, grandChildIndex: number) => (
                        <p key={`child-${childIndex}-grandChild-${grandChildIndex}`} id={`paragraph-${childIndex}-${grandChildIndex}`}>
                          {grandChild.text}
                        </p>
                      ))
                    }
                  </div>
                ))
          }
        </div>

        {/* Date de modification */}
        <div className="mt-4 pt-2 border-t border-gray-100">
          <p className="font-gantari text-xs text-gray-500 italic">
            Modifé le {new Date(note.ModifiedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
