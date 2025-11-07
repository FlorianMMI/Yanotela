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
      
      // Détecter si on est sur mobile
      const isMobile = window.innerWidth < 768;
      const modalWidth = isMobile ? 240 : 280;
      const modalHeight = 300;

      let x, y;

      if (isMobile) {
        // Sur mobile : centrer horizontalement et placer juste sous la note
        x = Math.max(8, Math.min(
          window.innerWidth - modalWidth - 8,
          rect.left + (rect.width - modalWidth) / 2
        ));
        y = rect.bottom -20;
        
        // Si ça dépasse en bas, placer au-dessus
        if (y + modalHeight > window.innerHeight) {
          y = rect.bottom - modalHeight - 50;
        }
      } else {
        // Sur desktop : garder le positionnement actuel (à droite de la note)
        x = rect.right - 245;
        y = rect.bottom - 150;

        // Ajuster si ça dépasse
        if (x + modalWidth > window.innerWidth) {
          x = window.innerWidth - modalWidth - 16;
        }
        if (y + modalHeight > window.innerHeight) {
          y = rect.bottom - 200;
        }
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

  // Fonction pour extraire et afficher le contenu de la note
  const getDisplayContent = () => {
    // Si le contenu est vide
    if (!note.Content) {
      return 'Contenu vide';
    }

    // Si c'est une chaîne, essayer de la parser comme JSON
    if (typeof note.Content === 'string') {
      try {
        const parsed = JSON.parse(note.Content);
        // Si c'est un objet Lexical avec une structure root
        if (parsed.root && parsed.root.children) {
          const extractText = (node: any): string => {
            if (!node) return '';
            if (node.type === 'text' && node.text) return node.text;
            if (node.type === 'image') return '[Image]';
            if (node.children && Array.isArray(node.children)) {
              return node.children.map((child: any) => extractText(child)).join(' ');
            }
            return '';
          };
          
          const text = extractText(parsed.root).trim();
          return text || 'Contenu vide';
        }
      } catch {
        // Si le parsing échoue, afficher les 100 premiers caractères
        return note.Content.substring(0, 100) + (note.Content.length > 100 ? '...' : '');
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
          if (node.type === 'image') return '[Image]';
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
