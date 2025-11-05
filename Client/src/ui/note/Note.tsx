import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Note as NoteType } from '@/type/Note';
import { motion } from 'motion/react';

interface NoteProps {
  note: NoteType;
}

export default function Note({ note }: NoteProps) {
  const router = useRouter();

  const handleNoteClick = () => {
    router.push(`/notes/${note.id}`);
  };

  // ✅ Fonction pour extraire le texte au cas où le loader n'aurait pas fonctionné
  const getDisplayContent = (): string => {
    if (!note.Content) return 'Contenu vide';
    
    // Si c'est déjà du texte, le retourner
    if (typeof note.Content === 'string') {
      // Vérifier si c'est du JSON stringifié
      if (note.Content.startsWith('{') || note.Content.startsWith('[')) {
        try {
          const parsed = JSON.parse(note.Content);
          
          // Si c'est un objet Lexical, extraire le texte
          if (parsed.root && parsed.root.children) {
            const extractText = (node: any): string => {
              if (!node) return '';
              if (node.type === 'text' && node.text) return node.text;
              if (node.children && Array.isArray(node.children)) {
                return node.children.map((child: any) => extractText(child)).join(' ');
              }
              if (node.type === 'image') return '[Image]';
              return '';
            };
            
            const text = extractText(parsed.root).trim();
            return text || 'Contenu vide';
          }
        } catch {
          // Si le parsing échoue, afficher les 100 premiers caractères
          return note.Content.substring(0, 100) + (note.Content.length > 100 ? '...' : '');
        }
      }
      
      return note.Content;
    }
    
    // Si c'est un objet, essayer d'extraire le texte
    if (typeof note.Content === 'object' && note.Content !== null) {
      const content = note.Content as any;
      if (content.root && content.root.children) {
        const extractText = (node: any): string => {
          if (!node) return '';
          if (node.type === 'text' && node.text) return node.text;
          if (node.children && Array.isArray(node.children)) {
            return node.children.map((child: any) => extractText(child)).join(' ');
          }
          return '';
        };
        
        const text = extractText(content.root).trim();
        return text || 'Contenu vide';
      }
      
      return JSON.stringify(note.Content).substring(0, 100) + '...';
    }
    
    return 'Contenu vide';
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

        {/* Note Content - Affichage simplifié du texte extrait */}
        <div className="font-gantari text-sm text-textcardNote leading-relaxed mb-auto line-clamp-2 flex-grow">
          {getDisplayContent()}
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
