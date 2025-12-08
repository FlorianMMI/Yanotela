"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { yjsDocuments, providerInstances } from '@/collaboration/providers';

export interface YjsComment {
  id: string;
  text: string;
  authorId: number;
  authorPseudo: string;
  date: string;
}

/**
 * Hook pour gérer les commentaires via YJS (synchronisation temps réel)
 * Les commentaires sont stockés dans un Y.Array partagé entre tous les clients
 * 
 * @param noteId - ID de la note
 * @param userId - ID de l'utilisateur courant (optionnel pour les anonymes)
 * @param userPseudo - Pseudo de l'utilisateur courant (optionnel pour les anonymes)
 */
export function useYjsComments(noteId: string | null, userId?: number, userPseudo?: string) {
  const [comments, setComments] = useState<YjsComment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const yArrayRef = useRef<Y.Array<YjsComment> | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const observerRef = useRef<(() => void) | null>(null);

  // Fonction pour synchroniser l'état local avec le Y.Array
  const syncComments = useCallback(() => {
    if (!yArrayRef.current) return;
    const arr = yArrayRef.current.toArray();
    // Trier par date (les plus anciens en premier)
    const sorted = [...arr].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setComments(sorted);
  }, []);

  useEffect(() => {
    if (!noteId) return;

    // Récupérer le document YJS existant (créé par le provider de collaboration)
    let doc = yjsDocuments.get(noteId);
    
    if (!doc) {
      // Si pas encore de doc (modal ouvert avant l'éditeur), on attend
      const checkInterval = setInterval(() => {
        doc = yjsDocuments.get(noteId);
        if (doc) {
          clearInterval(checkInterval);
          initYjsComments(doc);
        }
      }, 100);

      // Timeout après 5s
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        
      }, 5000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    } else {
      initYjsComments(doc);
    }

    function initYjsComments(yjsDoc: Y.Doc) {
      docRef.current = yjsDoc;
      
      // Créer ou récupérer le Y.Array pour les commentaires
      const yComments = yjsDoc.getArray<YjsComment>('comments');
      yArrayRef.current = yComments;

      // Observer les changements - stocker la référence pour le cleanup
      const observer = () => {
        syncComments();
      };
      observerRef.current = observer;

      yComments.observe(observer);
      
      // Sync initial
      syncComments();

      // Vérifier si le provider est connecté
      if (noteId) {
        const provider = providerInstances.get(noteId);
        if (provider) {
          setIsConnected(provider.wsconnected);
          
          provider.on('status', ({ status }: { status: string }) => {
            setIsConnected(status === 'connected');
          });
        }
      }
    }

    return () => {
      // Cleanup: retirer l'observer avec la même référence de fonction
      if (yArrayRef.current && observerRef.current) {
        yArrayRef.current.unobserve(observerRef.current);
        observerRef.current = null;
      }
    };
  }, [noteId, syncComments]);

  /**
   * Ajouter un commentaire (synchronisé via YJS)
   * Permet aux utilisateurs non connectés de commenter en tant qu'anonyme
   */
  const addComment = useCallback((text: string) => {
    if (!yArrayRef.current || !text.trim()) return false;

    const newComment: YjsComment = {
      id: crypto.randomUUID(),
      text: text.trim(),
      authorId: userId || 0, // 0 pour les utilisateurs anonymes
      authorPseudo: userPseudo || 'Anonyme',
      date: new Date().toISOString(),
    };

    // Ajouter au Y.Array (sera synchronisé automatiquement)
    yArrayRef.current.push([newComment]);
    
    return true;
  }, [userId, userPseudo]);

  /**
   * Supprimer un commentaire (synchronisé via YJS)
   * 
   * @param commentId - ID du commentaire à supprimer
   * @param userRole - Rôle de l'utilisateur (0=owner, 1=admin, etc.)
   */
  const deleteComment = useCallback((commentId: string, userRole?: number) => {
    if (!yArrayRef.current) return false;

    const arr = yArrayRef.current.toArray();
    const index = arr.findIndex(c => c.id === commentId);
    
    if (index === -1) return false;

    const comment = arr[index];
    
    // Vérifier les permissions
    const canDelete = 
      (userId && comment.authorId === userId) || // Auteur du commentaire (si connecté)
      userRole === 0 ||                          // Propriétaire de la note
      userRole === 1;                            // Admin de la note

    if (!canDelete) {
      console.log('[deleteComment] Permission refusée:', {
        userId,
        commentAuthorId: comment.authorId,
        userRole,
        canDelete
      });
      return false;
    }

    // Supprimer du Y.Array
    yArrayRef.current.delete(index, 1);
    
    return true;
  }, [userId]);

  return {
    comments,
    addComment,
    deleteComment,
    isConnected,
  };
}
