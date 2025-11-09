/**
 * 👥 ConnectedUsers Component (Refactorisé avec YJS Awareness)
 * 
 * Affiche les utilisateurs connectés en temps réel via YJS Awareness API
 * Compatible avec le pattern officiel de Lexical CollaborationPlugin
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { providerInstances } from '@/collaboration/providers';
import type { Awareness } from 'y-protocols/awareness';

interface ConnectedUsersProps {
  noteId: string;
  className?: string;
}

interface AwarenessUser {
  name: string;
  color: string;
  clientID: number;
}

export default function ConnectedUsers({ noteId, className = '' }: ConnectedUsersProps) {
  const [activeUsers, setActiveUsers] = useState<AwarenessUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtenir le provider WebSocket pour cette note
    const provider = providerInstances.get(noteId);
    
    if (!provider) {
      console.warn('[ConnectedUsers] Provider non trouvé pour noteId:', noteId);
      // Retry après un délai (le provider peut être en cours de création)
      const retryTimer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(retryTimer);
    }

    const awareness: Awareness = provider.awareness;
    
    const updateUsers = () => {
      try {
        const states = awareness.getStates();
        const localClientID = awareness.clientID;
        
        const users: AwarenessUser[] = [];
        states.forEach((state: any, clientID: number) => {
          // Filtrer l'utilisateur local et les états vides
          if (clientID !== localClientID && state && state.user) {
            users.push({
              name: state.user.name || 'Anonyme',
              color: state.user.color || '#888888',
              clientID,
            });
          }
        });

        setActiveUsers(users);
        setIsLoading(false);
      } catch (error) {
        console.error('[ConnectedUsers] Erreur lors de la récupération des users:', error);
        setIsLoading(false);
        return;
      }

      const awareness: Awareness = provider.awareness;
      
      const updateUsers = () => {
        try {
          const states = awareness.getStates();
          const localClientID = awareness.clientID;
          
          const users: AwarenessUser[] = [];
          states.forEach((state: any, clientID: number) => {
            // Filtrer l'utilisateur local et les états vides
            if (clientID !== localClientID && state && state.user) {
              users.push({
                name: state.user.name || 'Anonyme',
                color: state.user.color || '#888888',
                clientID,
              });
            }
          });

          console.log('[ConnectedUsers] Utilisateurs actifs:', users.length, users);
          setActiveUsers(users);
          setIsLoading(false);
        } catch (error) {
          console.error('[ConnectedUsers] Erreur lors de la récupération des users:', error);
          setIsLoading(false);
        }
      };

      // Observer les changements d'awareness (ajout/suppression de users)
      awareness.on('change', updateUsers);
      
      // Initialiser
      updateUsers();

      // Cleanup
      return () => {
        awareness.off('change', updateUsers);
      };
    };

    const cleanup = tryGetProvider();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (cleanup) cleanup();
    };
  }, [noteId]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse" />
        <span className="text-sm text-textcardNote/70">Chargement...</span>
      </div>
    );
  }

  const userCount = activeUsers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {/* Indicateur de personnes connectées */}
      <div className="relative flex items-center">
        <AnimatePresence mode="wait">
          {userCount === 0 ? (
            <motion.div
              key="offline"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-sm text-textcardNote/60">Hors ligne</span>
            </motion.div>
          ) : (
            <motion.div
              key="online"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="relative flex items-center">
                {/* Indicateur animé */}
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                
                {/* Avatars des utilisateurs */}
                <div className="flex -space-x-2 ml-2">
                  {activeUsers.slice(0, 3).map((user, index) => (
                    <motion.div
                      key={user.clientID}
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      exit={{ scale: 0, x: -10 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                      title={user.name}
                    >
                      <div
                        className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Si plus de 3 utilisateurs, afficher "+N" */}
                  {userCount > 3 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-7 h-7 rounded-full border-2 border-white bg-gray-600 flex items-center justify-center text-xs font-semibold text-white"
                    >
                      +{userCount - 3}
                    </motion.div>
                  )}
                </div>
              </div>
              
              <span className="text-sm text-textcardNote font-medium ml-1">
                {userCount} {userCount === 1 ? 'personne' : 'personnes'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
