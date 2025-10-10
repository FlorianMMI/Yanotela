"use client";

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Socket } from 'socket.io-client';
import { $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND } from 'lexical';

interface CursorPosition {
  userId: number;
  pseudo: string;
  offset: number;
  color: string;
}

interface CursorsPluginProps {
  noteId: string;
  socket: Socket | null;
}

/**
 * Plugin pour afficher les curseurs des autres utilisateurs en temps réel
 * 
 * Ce plugin:
 * - Écoute les changements de position du curseur local
 * - Envoie la position aux autres utilisateurs via Socket.IO
 * - Affiche les curseurs des autres utilisateurs
 */
export default function CursorsPlugin({ noteId, socket }: CursorsPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [cursors, setCursors] = useState<Map<number, CursorPosition>>(new Map());

  // Palette de couleurs pour les curseurs
  const CURSOR_COLORS = [
    '#FF6B6B', // Rouge
    '#4ECDC4', // Turquoise
    '#45B7D1', // Bleu clair
    '#FFA07A', // Saumon
    '#98D8C8', // Vert menthe
    '#F7DC6F', // Jaune
    '#BB8FCE', // Violet
    '#85C1E2', // Bleu ciel
  ];

  useEffect(() => {
    if (!socket) return;

    // Fonction pour obtenir une couleur unique par utilisateur
    const getUserColor = (userId: number) => {
      return CURSOR_COLORS[userId % CURSOR_COLORS.length];
    };

    // Écouter les changements de sélection locaux
    const unregisterCommand = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          
          // Envoyer la position du curseur au serveur
          socket.emit('cursorUpdate', {
            noteId,
            cursor: {
              offset: anchor.offset,
              key: anchor.key
            }
          });
        }
        
        return false;
      },
      1 // Priorité normale
    );

    // Recevoir les mises à jour de curseur des autres utilisateurs
    const handleCursorUpdate = ({ userId, pseudo, cursor }: { 
      userId: number; 
      pseudo: string; 
      cursor: { offset: number; key: string } 
    }) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(userId, {
          userId,
          pseudo,
          offset: cursor.offset,
          color: getUserColor(userId)
        });
        return newCursors;
      });

      // Retirer le curseur après 3 secondes d'inactivité
      setTimeout(() => {
        setCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.delete(userId);
          return newCursors;
        });
      }, 3000);
    };

    // Retirer le curseur quand un utilisateur quitte
    const handleUserLeft = ({ userId }: { userId: number }) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });
    };

    socket.on('cursorUpdate', handleCursorUpdate);
    socket.on('userLeft', handleUserLeft);

    return () => {
      unregisterCommand();
      socket.off('cursorUpdate', handleCursorUpdate);
      socket.off('userLeft', handleUserLeft);
    };
  }, [editor, socket, noteId]);

  // Afficher les curseurs des autres utilisateurs
  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none">
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none"
          style={{
            // Position approximative - peut être amélioré avec des coordonnées exactes
            top: '0px',
            left: `${cursor.offset * 8}px`, // Approximation basique
          }}
        >
          {/* Ligne verticale du curseur */}
          <div
            className="w-0.5 h-5 animate-pulse"
            style={{ backgroundColor: cursor.color }}
          />
          
          {/* Badge avec le nom de l'utilisateur */}
          <div
            className="absolute -top-6 left-0 text-xs text-white px-2 py-1 rounded shadow-lg whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.pseudo}
          </div>
        </div>
      ))}
    </div>
  );
}
