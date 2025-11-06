/**
 * 👥 ConnectedUsers Component
 * 
 * Affiche le nombre de personnes connectées en temps réel dans une note.
 * Se met à jour automatiquement via Socket.IO
 */

'use client';

import React, { useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';
import { motion, AnimatePresence } from 'motion/react';

interface ConnectedUsersProps {
  noteId: string;
  className?: string;
}

interface UserInfo {
  userId: number;
  pseudo: string;
}

export default function ConnectedUsers({ noteId, className = '' }: ConnectedUsersProps) {
  const [userCount, setUserCount] = useState<number>(0);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    // 1️⃣ Écouter l'événement initial de connexion
    const handleNoteJoined = (e: CustomEvent) => {
      const { noteId: joinedNoteId, userCount: count } = e.detail || {};
      if (joinedNoteId === noteId) {
        
        setUserCount(count);
        setIsLoading(false);
        // Demander la liste des utilisateurs
        socketService.requestUserList(noteId);
      }
    };

    // 2️⃣ Écouter quand un utilisateur rejoint
    const handleUserJoined = (data: { userId: number; pseudo: string; userCount: number }) => {
      
      setUserCount(data.userCount);
      // Redemander la liste complète
      socketService.requestUserList(noteId);
    };

    // 3️⃣ Écouter quand un utilisateur quitte
    const handleUserLeft = (data: { userId: number; pseudo: string; userCount: number }) => {
      
      setUserCount(data.userCount);
      // Redemander la liste complète
      socketService.requestUserList(noteId);
    };

    // 4️⃣ Écouter la liste des utilisateurs
    const handleUserList = (data: { users: UserInfo[] }) => {
      
      setUsers(data.users);
      setUserCount(data.users.length);
    };

    // S'abonner aux événements
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onUserList(handleUserList);
    
    // Écouter l'événement DOM noteJoined
    window.addEventListener('noteJoined', handleNoteJoined as EventListener);

    // Demander la liste initiale si déjà connecté
    setTimeout(() => {
      socketService.requestUserList(noteId);
    }, 500);

    // 🧹 Cleanup
    return () => {
      
      socketService.offUserList(handleUserList);
      window.removeEventListener('noteJoined', handleNoteJoined as EventListener);
    };
  }, [noteId]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" />
        <span className="text-sm text-white/70">Connexion...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {/* Icône utilisateurs */}
      <div className="relative">
        <svg 
          className="w-5 h-5 text-white" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
        {/* Badge nombre avec animation */}
        <motion.div
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-primary ${
            userCount > 1 ? 'bg-green-500' : 'bg-blue-500'
          }`}
          animate={userCount > 1 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>

      {/* Nombre d'utilisateurs */}
      <AnimatePresence mode="wait">
        <motion.span
          key={userCount}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className="text-white font-semibold text-sm"
        >
          {userCount} {userCount > 1 ? 'en ligne' : 'connecté'}
        </motion.span>
      </AnimatePresence>

      {/* Liste des utilisateurs (tooltip au survol) */}
      {users.length > 0 && (
        <div className="relative group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white/70 cursor-help hover:text-white transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
            >
              <div className="font-semibold mb-1.5 text-gray-200">Utilisateurs connectés :</div>
              <div className="space-y-1">
                {users.map((user) => (
                  <div key={user.userId} className="text-gray-300 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    {user.pseudo}
                  </div>
                ))}
              </div>
              {/* Flèche du tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
