import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Note as NoteType } from '@/type/Note';
import { motion } from 'motion/react';
import NoteMore from '@/components/noteMore/NoteMore';

interface NoteProps {
  note: NoteType;
  onNoteUpdated?: () => void; // Callback pour rafraîchir la liste après modification/suppression
}

export default function Note({ note, onNoteUpdated }: NoteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Vérifier si on est dans la corbeille
  const isInTrash = pathname?.includes('/trash') || pathname?.includes('/corbeille');

  const handleNoteClick = (e: React.MouseEvent) => {
    // Ne pas naviguer si le modal est ouvert
    if (showMoreModal) {
      e.preventDefault();
      return;
    }
    router.push(`/notes/${note.id}`);
  };

  const openContextMenu = (clientX: number, clientY: number) => {
    if (isInTrash) return;

    // Calculer la position du modal par rapport à l'élément
    if (noteRef.current) {
      const rect = noteRef.current.getBoundingClientRect();
      
      // Positionner le modal juste en dessous de la note
      let x = rect.left;
      let y = rect.bottom + 8; // 8px d'espacement

      // Vérifier si le modal dépasse de l'écran
      const modalWidth = 280; // Largeur réduite du modal
      const modalHeight = 300; // Hauteur estimée du modal

      // Ajuster horizontalement si ça dépasse à droite
      if (x + modalWidth > window.innerWidth) {
        x = window.innerWidth - modalWidth - 16;
      }

      // Ajuster verticalement si ça dépasse en bas
      if (y + modalHeight > window.innerHeight) {
        y = rect.top - modalHeight - 8; // Afficher au-dessus
      }

      setModalPosition({ x, y });
      setShowMoreModal(true);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY);
  };

  // Support tactile : maintien appuyé (long press)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isInTrash) return;

    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      openContextMenu(touch.clientX, touch.clientY);
      // Vibration pour retour haptique sur mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms pour le long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    // Annuler le long press si l'utilisateur déplace son doigt
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCloseModal = () => {
    setShowMoreModal(false);
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
      return <p className="text-dangerous-500">Erreur d'affichage du contenu</p>;
    }
  };

  return (
    <>
    <motion.div 
    ref={noteRef}
    whileHover={{ scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.25)"}}
    whileTap={{ scale: 1 }}
    
      className="bg-fondcardNote rounded-xl shadow-sm border border-clrsecondaire cursor-pointer group overflow-hidden w-full h-[125px] md:w-65 md:h-50"
      onClick={handleNoteClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
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
            <div className="flex items-center min-w-[56px] h-full gap-1 px-3 shrink-0">
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
          {
            (() => {
              // Debug: voir la structure du contenu

              if (typeof note.Content === 'string') {
                // Tenter de parser si c'est du JSON string
                try {
                  const parsed = JSON.parse(note.Content);
                  
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

    {/* Modal NoteMore - affiché en mode contextuel réduit */}
    {showMoreModal && (
      <>
        {/* Overlay transparent pour fermer le modal */}
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleCloseModal}
        />
        {/* Modal positionné */}
        <div 
          className="fixed z-50"
          style={{ 
            left: `${modalPosition.x}px`, 
            top: `${modalPosition.y}px`,
            maxHeight: 'calc(100vh - 100px)'
          }}
        >
          <div className="context-menu-compact">
            <NoteMore 
              noteId={note.id} 
              onClose={handleCloseModal}
              onNoteUpdated={() => {
                // Appeler le callback parent pour rafraîchir la liste
                if (onNoteUpdated) {
                  onNoteUpdated();
                }
                // Déclencher un événement pour rafraîchir la liste des notes
                window.dispatchEvent(new Event('auth-refresh'));
              }}
            />
          </div>
        </div>
      </>
    )}
    </>
  );
}
