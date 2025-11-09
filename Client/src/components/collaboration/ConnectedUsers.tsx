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
    let retryTimer: NodeJS.Timeout | null = null;
    function updateUsersFromAwareness() {
      const provider = providerInstances.get(noteId);
      if (!provider) {
        setIsLoading(true);
        retryTimer = setTimeout(updateUsersFromAwareness, 500);
        return;
      }
      const awareness: Awareness = provider.awareness;
      const localClientID = awareness.clientID;
      const states = awareness.getStates();
      const users: AwarenessUser[] = [];
      states.forEach((state: any, clientID: number) => {
        if (state && state.user) {
          users.push({
            name: clientID === localClientID ? (state.user.name || 'Vous') : (state.user.name || 'Anonyme'),
            color: state.user.color || '#888888',
            clientID,
          });
        }
      });
      setActiveUsers(users);
      setIsLoading(false);
      // Listen for changes
      awareness.on('change', updateUsersFromAwareness);
    }
    updateUsersFromAwareness();
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      const provider = providerInstances.get(noteId);
      if (provider) provider.awareness.off('change', updateUsersFromAwareness);
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
            <span className="text-sm text-textcardNote/70">Seul sur cette note</span>
          ) : (
            <motion.div
              key="online"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="relative flex items-center">
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
                        {user.name === 'Vous' ? 'Vous' : user.name.charAt(0).toUpperCase()}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
