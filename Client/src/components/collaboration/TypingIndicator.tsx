/**
 * ⌨️ TypingIndicator Component
 * 
 * Affiche un indicateur visuel quand d'autres utilisateurs sont en train de taper
 * dans l'éditeur. Affiche uniquement les utilisateurs distants, pas l'utilisateur local.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';
import { motion, AnimatePresence } from 'motion/react';

interface TypingIndicatorProps {
  noteId: string;
  currentUserPseudo: string;
  currentUserId: number;
  className?: string;
}

interface TypingUser {
  userId: number;
  pseudo: string;
  timestamp: number;
}

export default function TypingIndicator({ noteId, currentUserPseudo, currentUserId, className = '' }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingUser>>(new Map());

  useEffect(() => {

    // Timeout pour retirer automatiquement un utilisateur après 3 secondes d'inactivité
    const checkStaleTypingUsers = () => {
      const now = Date.now();
      const staleThreshold = 3000; // 3 secondes

      setTypingUsers((prev) => {
        const updated = new Map(prev);
        let hasChanges = false;

        updated.forEach((user, userId) => {
          if (now - user.timestamp > staleThreshold) {
            updated.delete(userId);
            hasChanges = true;
            
          }
        });

        return hasChanges ? updated : prev;
      });
    };

    // Vérifier toutes les secondes
    const intervalId = setInterval(checkStaleTypingUsers, 1000);

    // Écouter les événements de frappe
    const handleUserTyping = (data: { noteId: string; isTyping: boolean; userId: number; pseudo: string }) => {
      // Ignorer les événements d'autres notes
      if (data.noteId !== noteId) return;

      // ✅ CORRECTION: Ignorer nos propres événements en comparant l'userId
      if (data.userId === currentUserId) {
        
        return;
      }

      setTypingUsers((prev) => {
        const updated = new Map(prev);

        if (data.isTyping) {
          // Ajouter ou mettre à jour l'utilisateur
          updated.set(data.userId, {
            userId: data.userId,
            pseudo: data.pseudo,
            timestamp: Date.now(),
          });
          
        } else {
          // Retirer l'utilisateur
          updated.delete(data.userId);
          
        }

        return updated;
      });
    };

    socketService.onUserTyping(handleUserTyping);

    // 🧹 Cleanup
    return () => {
      
      clearInterval(intervalId);
      socketService.off('userTyping', handleUserTyping);
    };
  }, [noteId, currentUserPseudo, currentUserId]);

  // Si aucun utilisateur ne tape, ne rien afficher
  if (typingUsers.size === 0) return null;

  const typingArray = Array.from(typingUsers.values());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}
      >
        {/* Animation de points */}
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>

        {/* Texte des utilisateurs qui tapent */}
        <span>
          {typingArray.length === 1 && (
            <span>
              <strong>{typingArray[0].pseudo}</strong> est en train d&apos;écrire...
            </span>
          )}
          {typingArray.length === 2 && (
            <span>
              <strong>{typingArray[0].pseudo}</strong> et <strong>{typingArray[1].pseudo}</strong> sont en train d&apos;écrire...
            </span>
          )}
          {typingArray.length > 2 && (
            <span>
              <strong>{typingArray[0].pseudo}</strong>, <strong>{typingArray[1].pseudo}</strong> et{' '}
              <strong>{typingArray.length - 2} autre{typingArray.length - 2 > 1 ? 's' : ''}</strong> sont en train d&apos;écrire...
            </span>
          )}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
