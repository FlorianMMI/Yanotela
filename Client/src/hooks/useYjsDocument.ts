/**
 * 🪝 useYjsDocument Hook
 * 
 * Hook React pour gérer le cycle de vie d'un document Yjs collaboratif.
 * 
 * RESPONSABILITÉS :
 * - ✅ Créer/obtenir le Y.Doc pour une note
 * - ✅ Rejoindre la room Socket.IO au mount
 * - ✅ Initialiser awareness avec pseudo et couleur
 * - ✅ Synchroniser l'état au reconnect
 * - ✅ Cleanup (quitter room + destroy doc + awareness) au unmount
 * - ✅ Exposer ydoc, ytext, et méthodes utilitaires
 * 
 * USAGE :
 * ```tsx
 * function NoteEditor({ noteId }: { noteId: string }) {
 *   const { ydoc, ytext, isReady, sync } = useYjsDocument(noteId);
 * 
 *   if (!isReady) return <LoadingSpinner />;
 * 
 *   return <LexicalEditor ydoc={ydoc} ytext={ytext} />;
 * }
 * ```
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import * as Y from 'yjs';
import { yjsCollaborationService } from '@/services/yjsCollaborationService';
import { YjsAwarenessProvider } from '@/services/yjsAwarenessProvider';
import { socketService } from '@/services/socketService';
import type { CollaborationState } from '@/type/Yjs';

interface UseYjsDocumentReturn {
  /** Document Yjs partagé */
  ydoc: Y.Doc | null;
  /** Y.Text pour le contenu de la note (utilisé par Lexical) */
  ytext: Y.Text | null;
  /** Le document est prêt à être utilisé */
  isReady: boolean;
  /** État de collaboration (nombre d'utilisateurs, etc.) */
  state: CollaborationState | null;
  /** Forcer une resynchronisation */
  sync: () => void;
  /** Créer un snapshot manuel */
  createSnapshot: () => void;
}

/**
 * Hook pour gérer un document Yjs collaboratif
 * 
 * @param noteId - ID unique de la note
 * @returns Objet contenant ydoc, ytext, et méthodes utilitaires
 */
export function useYjsDocument(
  noteId: string
): UseYjsDocumentReturn {
  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<CollaborationState | null>(null);
  const [roomJoined, setRoomJoined] = useState(false); // ✅ NOUVEAU: flag pour savoir si on est dans la room
  
  // Refs pour éviter les re-renders inutiles
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const hasJoinedRef = useRef(false);

  /**
   * 🎬 INITIALISATION : Créer le Y.Doc et rejoindre la room
   */
  useEffect(() => {
    if (!noteId || hasJoinedRef.current) return;

    // 🔌 CRITIQUE: Configurer les listeners Socket.IO AVANT de créer le Y.Doc
    // Pour s'assurer qu'on recevra les updates dès le début
    yjsCollaborationService.setupSocketListeners();

    // 1️⃣ Créer ou obtenir le Y.Doc (sans contenu initial, sera chargé depuis serveur)
    const ydoc = yjsCollaborationService.getOrCreateDocument(noteId);
    const ytext = yjsCollaborationService.getText(noteId);

    if (!ytext) {
      console.error('[useYjsDocument] ❌ Impossible d\'obtenir Y.Text');
      return;
    }

    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    // 2️⃣ Rejoindre la room Socket.IO ET ATTENDRE LA CONFIRMATION
    
    socketService.joinNote(noteId, (data) => {

      // ✅ CORRECTION CRITIQUE: Attendre 100ms pour que le serveur finalise l'ajout à la room
      setTimeout(() => {
        setRoomJoined(true);
        setIsReady(true);
        
      }, 100);
    });

    // 3️⃣ Initialiser l'awareness (curseurs) avec pseudo et couleur
    const fetchUserInfo = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/auth/check`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          const pseudo = userData.pseudo || 'Anonyme';
          
          // Créer l'awareness avec le pseudo
          YjsAwarenessProvider.joinNote(noteId, ydoc, { name: pseudo });
          
        }
      } catch (error) {
        console.error('[useYjsDocument] Erreur lors de la récupération du pseudo:', error);
        // Fallback: créer awareness avec nom par défaut
        YjsAwarenessProvider.joinNote(noteId, ydoc, { name: 'Anonyme' });
      }
    };
    fetchUserInfo();

    hasJoinedRef.current = true;

    // 4️⃣ Charger l'état de collaboration
    const collaborationState = yjsCollaborationService.getCollaborationState(noteId);
    setState(collaborationState);

    // 🧹 CLEANUP : Quitter la room, détruire le doc ET l'awareness
    return () => {

      YjsAwarenessProvider.leaveNote(noteId);
      socketService.leaveNote();
      yjsCollaborationService.destroyDocument(noteId);
      
      ydocRef.current = null;
      ytextRef.current = null;
      hasJoinedRef.current = false;
      setIsReady(false);
      setRoomJoined(false); // ✅ Reset room joined
    };
  }, [noteId]);

  /**
   * 🔄 RECONNEXION : Synchroniser l'état au reconnect
   */
  useEffect(() => {
    if (!noteId || !isReady) return;

    const handleReconnect = () => {
      
      yjsCollaborationService.syncOnReconnect(noteId);
    };

    // Écouter les reconnexions Socket.IO
    const socket = socketService['socket']; // Accès privé (à améliorer)
    if (socket) {
      socket.on('connect', handleReconnect);

      return () => {
        socket.off('connect', handleReconnect);
      };
    }
  }, [noteId, isReady]);

  /**
   * 📊 MISE À JOUR DE L'ÉTAT : Suivre les changements de collaboration
   */
  useEffect(() => {
    if (!noteId || !isReady) return;

    const interval = setInterval(() => {
      const newState = yjsCollaborationService.getCollaborationState(noteId);
      setState(newState);
    }, 1000); // Mettre à jour toutes les secondes

    return () => clearInterval(interval);
  }, [noteId, isReady]);

  /**
   * 🔄 Forcer une resynchronisation manuelle
   */
  const sync = () => {
    if (!noteId) return;
    
    yjsCollaborationService.syncOnReconnect(noteId);
  };

  /**
   * 📸 Créer un snapshot manuel
   */
  const createSnapshot = () => {
    if (!noteId) return;
    
    yjsCollaborationService.createSnapshot(noteId);
  };

  // 🎯 Retourner les objets stables (ne pas recréer à chaque render)
  return useMemo(
    () => ({
      ydoc: ydocRef.current,
      ytext: ytextRef.current,
      isReady,
      state,
      sync,
      createSnapshot,
    }),
    [isReady, state] // Ne dépend que de isReady et state
  );
}

export default useYjsDocument;
