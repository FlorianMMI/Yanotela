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

  const handleNoteClick = () => {
    router.push(`/notes/${note.id}`);
  };
 

  return (
    
    <motion.div 
    whileHover={{ scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.25)"}}
    whileTap={{ scale: 1 }}
    
      className="bg-fondcardNote rounded-xl shadow-sm border border-clrsecondaire cursor-pointer group overflow-hidden"
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
        
        
       <div
          className="flex items-center min-w-[56px]  h-full gap-1 px-3 flex-shrink-0"
        >{/*}
          <p className='text-white font-bold'>8</p>
          <Image
            src="/share.svg"
            alt="Participants"
            width={20}
            height={20}
            className="filter brightness-0 invert"
          />*/}
        </div>
      </div>

      {/* Content - Titre et contenu de la note */}
      <div className="p-4 bg-fondcardNote flex flex-col h-32">

        {/* Note Content */}
        <div className="font-gantari text-sm text-textcardNote leading-relaxed mb-auto line-clamp-2 flex-grow">
          {
            (() => {
              // Debug: voir la structure du contenu
              console.log('Note Content:', note.Content);
              
              if (typeof note.Content === 'string') {
                // Tenter de parser si c'est du JSON string
                try {
                  const parsed = JSON.parse(note.Content);
                  console.log('Parsed Content:', parsed);
                  if (parsed.root && parsed.root.children) {
                    // C'est du JSON Lexical, le traiter comme un objet
                    note.Content = parsed;
                  } else {
                    // C'est juste du texte
                    return <p>{note.Content}</p>;
                  }
                } catch {
                  // Pas du JSON, afficher comme texte
                  return <p>{note.Content}</p>;
                }
              }
              
              return null;
            })()
          }
          {
            typeof note.Content !== 'string' &&
            note.Content !== null &&
            typeof note.Content === 'object' &&
            (note.Content as any).root !== null &&
            typeof (note.Content as any).root === 'object' &&
            Array.isArray((note.Content as any).root.children) ? (
              (note.Content as any).root.children.map((child: any, childIndex: number) => {
                  // Fonction pour rendre les enfants avec leurs styles
                  const renderTextWithStyles = (children: any[]) => {
                    if (!children || children.length === 0) return null;
                    
                    return children.map((grandChild: any, grandChildIndex: number) => {
                      // Si pas de texte, ignorer
                      if (!grandChild.text) return null;
                      
                      // Construire les styles en ligne
                      const style: React.CSSProperties = {};
                      const classNames: string[] = [];
                      
                      // Appliquer fontSize (StyledTextNode, FontSizeNode)
                      if (grandChild.fontSize) {
                        style.fontSize = grandChild.fontSize;
                      }
                      
                      // Appliquer color (StyledTextNode, ColorNode)
                      if (grandChild.color) {
                        style.color = grandChild.color;
                      }
                      
                      // Gérer les formats de texte (bold, italic, underline, etc.)
                      const format = grandChild.format || 0;
                      const decorations: string[] = [];
                      
                      // Bit flags Lexical
                      if (format & 1) style.fontWeight = 'bold';        // Bold
                      if (format & 2) style.fontStyle = 'italic';       // Italic  
                      if (format & 8) decorations.push('underline');    // Underline
                      if (format & 4) decorations.push('line-through'); // Strikethrough
                      
                      if (decorations.length > 0) {
                        style.textDecoration = decorations.join(' ');
                      }
                      
                      // Code styling
                      if (format & 16) {
                        classNames.push('bg-gray-200 px-1 rounded font-mono text-xs');
                      }
                      
                      return (
                        <span 
                          key={`text-${childIndex}-${grandChildIndex}`}
                          style={style}
                          className={classNames.join(' ')}
                        >
                          {grandChild.text}
                        </span>
                      );
                    });
                  };
                  
                  // Gérer les différents types de nœuds
                  const nodeType = child.type;
                  
                  // Liste (ul/ol)
                  if (nodeType === 'list') {
                    const ListTag = child.tag === 'ul' ? 'ul' : 'ol';
                    const listClass = child.tag === 'ul' ? 'list-disc' : 'list-decimal';
                    
                    return (
                      <ListTag key={`child-${childIndex}`} className={`ml-4 ${listClass}`}>
                        {child.children?.map((listItem: any, itemIdx: number) => (
                          <li key={`item-${itemIdx}`}>
                            {listItem.children && renderTextWithStyles(listItem.children)}
                          </li>
                        ))}
                      </ListTag>
                    );
                  }
                  
                  // Heading (h1, h2, h3)
                  if (nodeType === 'heading') {
                    const HeadingTag = child.tag || 'h2';
                    return (
                      <HeadingTag key={`child-${childIndex}`} className="font-bold">
                        {child.children && renderTextWithStyles(child.children)}
                      </HeadingTag>
                    );
                  }
                  
                  // Quote
                  if (nodeType === 'quote') {
                    return (
                      <blockquote key={`child-${childIndex}`} className="border-l-4 border-primary pl-4 italic">
                        {child.children && renderTextWithStyles(child.children)}
                      </blockquote>
                    );
                  }
                  
                  // Paragraphe par défaut
                  return (
                    <p key={`child-${childIndex}`}>
                      {child.children && renderTextWithStyles(child.children)}
                    </p>
                  );
                })
            ) : null
          }
        </div>

        {/* Date de modification */}
        <div className="mt-4 pt-2 border-t border-gray-100">
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
