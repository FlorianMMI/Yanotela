"use client";
import React, { use, useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';

interface CollaborationPluginProps {
  noteId: string;
  username: string;
  isReadOnly?: boolean;
  onContentUpdate?: (content: string) => void;
  onTitleUpdate?: (titre: string) => void;
}

/**
 * Plugin simple pour la collaboration temps réel
 * Gère uniquement l'affichage du statut et le nombre d'utilisateurs
 * Les mises à jour de contenu/titre sont gérées dans le composant parent
 */
export default function CollaborationPlugin({ 
  noteId, 
  username,
  isReadOnly = false,
  onContentUpdate,
  onTitleUpdate
}: CollaborationPluginProps) {
  // Force remount on noteId or username change to reset listeners and state
  const [instanceKey, setInstanceKey] = useState(() => `${noteId}:${username}`);
  useEffect(() => {
    setInstanceKey(`${noteId}:${username}`);
  }, [noteId, username]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]); // Utilisateurs en train de taper

  // Reset typing users on mount/unmount (fixes stale state after reload)
  useEffect(() => {
    setTypingUsers([]);
    return () => setTypingUsers([]);
  }, [instanceKey]);

  // Log username pour debug cross-browser
  useEffect(() => {
    
  }, [username]);

  useEffect(() => {
    // Détecter si on est sur mobile pour ajuster le délai
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const initDelay = isMobile ? 800 : 200;
        
    // Attendre que l'éditeur soit complètement monté
    const initTimeout = setTimeout(() => {

      // Rejoindre la note et écouter l'initialisation
      socketService.joinNote(noteId, (data) => {
        
        setUserCount(data.userCount || 1);
        setIsConnected(true);
      });

      // Si le socket est déjà connecté (timing desktop), forcer l'état en ligne
      try {
        if (socketService.isConnected && socketService.isConnected()) {
          setIsConnected(true);
        }
      } catch (e) {
        // ignore
      }

      // Écouter les nouveaux utilisateurs
      socketService.onUserJoined((data) => {
        
        setUserCount(data.userCount || 1);
      });        

      socketService.onUserLeft((data) => {
        
        setUserCount(data.userCount || 1);
      });

      // Écouter les mises à jour du contenu (si callback fourni et pas en lecture seule)
      if (!isReadOnly) {
        socketService.onContentUpdate((data) => {
          
          // Mettre à jour le parent si le callback est fourni
          try {
            if (onContentUpdate) onContentUpdate(data.content);
          } catch (e) {
            console.warn('Erreur lors de l\'appel de onContentUpdate:', e);
          }

          // Toujours dispatcher un event DOM pour que la page puisse capter
          // les updates même si l'éditeur n'est pas encore initialisé
          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('socketContentUpdate', { detail: { noteId: data.noteId, content: data.content, pseudo: data.pseudo } }));
            }
          } catch (e) {
            console.warn('Erreur lors du dispatch de socketContentUpdate:', e);
          }
        });
      }

      // Écouter les mises à jour du titre (toujours, même en lecture seule)
      if (onTitleUpdate) {
        socketService.onTitleUpdate((data) => {
          
          try {
            onTitleUpdate(data.titre);
          } catch (e) {
            console.warn('Erreur lors de l\'appel de onTitleUpdate:', e);
          }

          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('socketTitleUpdate', { detail: { noteId: data.noteId, titre: data.titre, pseudo: data.pseudo } }));
            }
          } catch (e) {
            console.warn('Erreur lors du dispatch de socketTitleUpdate:', e);
          }
        });
      }

      // Écouter les erreurs
      socketService.onError((data) => {
        console.error('❌ Erreur socket:', data.message);
        setIsConnected(false);
      });

      // ✅ Écouter les utilisateurs en train de taper
      socketService.onUserTyping((data) => {
        if (data.isTyping) {
          setTypingUsers(prev => {
            if (!prev.includes(data.pseudo)) {
              return [...prev, data.pseudo];
            }
            return prev;
          });
          
          // Auto-retirer après 3 secondes (au cas où l'événement "stop typing" ne vient pas)
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== data.pseudo));
          }, 3000);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== data.pseudo));
        }
      });

      // Mettre à jour l'état de connexion via les events connect/disconnect
      // (Suppression des appels à socketService.onConnect et onDisconnect car ils n'existent pas)
    }, initDelay);

    // Cleanup: quitter la note au démontage du composant
    return () => {
      clearTimeout(initTimeout);
      // Quitter proprement et marquer hors-ligne
      socketService.leaveNote();
      setIsConnected(false);
      socketService.removeAllListeners();
    };
  }, [noteId, isReadOnly]);

  // Effet séparé pour enregistrer les listeners de contenu/titre
  // Se réexécute quand les callbacks changent (notamment quand editor devient disponible)
  useEffect(() => {

    // Écouter les mises à jour du contenu (si callback fourni et pas en lecture seule)
    if (onContentUpdate && !isReadOnly) {
      socketService.onContentUpdate((data) => {
        
        onContentUpdate(data.content);
      });
    }

    // Écouter les mises à jour du titre (toujours, même en lecture seule)
    if (onTitleUpdate) {
      socketService.onTitleUpdate((data) => {
        
        onTitleUpdate(data.titre);
      });
    }
  }, [onContentUpdate, onTitleUpdate, isReadOnly]);

  return (
    <div
      key={instanceKey}
      className="absolute bottom-4 right-16 z-30 flex flex-col gap-2 pointer-events-none"
    >
      {username && (() => {
        const othersTyping = typingUsers.filter(u => !!u && u !== username);
        if (othersTyping.length === 1) {
          return (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/90 border border-blue-200 shadow-lg rounded-full backdrop-blur-sm transition-all animate-pulse">
              <span className="text-sm text-blue-700 font-medium">
                {`${othersTyping[0]} écrit...`}
              </span>
            </div>
          );
        }
        if (othersTyping.length > 1) {
          return (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/90 border border-blue-200 shadow-lg rounded-full backdrop-blur-sm transition-all animate-pulse">
              <span className="text-sm text-blue-700 font-medium">
                {`${othersTyping.length} personnes écrivent...`}
              </span>
            </div>
          );
        }
        return null;
      })()}
    {/* <div className="fixed bottom-6 right-2 md:right-16 z-30 flex items-center gap-3 px-3 py-1.5 bg-white/90 border border-gray-200 shadow-lg rounded-full backdrop-blur-sm transition-all">
      <div className={`flex items-center gap-1 font-medium ${isConnected ? "text-green-700" : "text-orange-700"}`}>
      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: isConnected ? "#22c55e" : "#f59e42" }} />
      {isConnected ? "En ligne" : "Hors ligne"}
      </div> */}
    </div>
  );
}