/**
 * 📝 TitleSyncPlugin
 * 
 * Plugin pour synchroniser le titre de la note via YJS
 * - Stocke le titre dans une Y.Map du document YJS
 * - Synchronise en temps réel entre tous les utilisateurs
 * - Sauvegarde en base de données toutes les 2 secondes
 */

import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { yjsDocuments } from '@/collaboration/providers';

interface TitleSyncPluginProps {
  noteId: string;
  title: string;
  onTitleChange: (newTitle: string) => void;
  isReadOnly: boolean;
}

export function TitleSyncPlugin({ 
  noteId, 
  title, 
  onTitleChange,
  isReadOnly 
}: TitleSyncPluginProps) {
  const lastSyncRef = useRef<number>(0);
  const titleChangedRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    const ydoc = yjsDocuments.get(noteId);
    if (!ydoc) {
      console.warn('⚠️ [TitleSync] Y.Doc non trouvé pour', noteId);
      return;
    }

    // Créer ou récupérer la map "metadata" qui contient le titre
    const metadata = ydoc.getMap('metadata');

    // Observer les changements du titre depuis YJS (synchronisation entrante)
    const observer = () => {
      const remoteTitle = metadata.get('title') as string | undefined;
      if (remoteTitle !== undefined && remoteTitle !== title) {
        
        onTitleChange(remoteTitle);
      }
    };

    metadata.observe(observer);

    // Initialiser le titre dans YJS si nécessaire (au premier chargement)
    if (!isInitializedRef.current && !metadata.has('title') && title) {
      
      metadata.set('title', title);
      isInitializedRef.current = true;
    }

    return () => {
      metadata.unobserve(observer);
      
    };
  }, [noteId, title, onTitleChange]);

  // Synchroniser le titre local → YJS quand il change
  useEffect(() => {
    if (isReadOnly) return;
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return; // Skip le premier render
    }

    const ydoc = yjsDocuments.get(noteId);
    if (!ydoc) return;

    const metadata = ydoc.getMap('metadata');
    const currentYjsTitle = metadata.get('title') as string | undefined;

    // Mettre à jour YJS seulement si le titre a vraiment changé
    if (currentYjsTitle !== title) {
      
      metadata.set('title', title);
      titleChangedRef.current = true;
    }
  }, [noteId, title, isReadOnly]);

  // Sauvegarde automatique en base de données toutes les 2 secondes
  useEffect(() => {
    if (isReadOnly) return;

    const syncInterval = setInterval(async () => {
      if (!titleChangedRef.current) return;

      const now = Date.now();
      if (now - lastSyncRef.current < 2000) return;

      try {
        const ydoc = yjsDocuments.get(noteId);
        if (!ydoc) return;

        const metadata = ydoc.getMap('metadata');
        const currentTitle = metadata.get('title') as string;

        if (!currentTitle) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        const response = await fetch(`${API_URL}/note/update/${noteId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Titre: currentTitle })
        });

        if (response.ok) {
          
          lastSyncRef.current = now;
          titleChangedRef.current = false;
          
          // Émettre un événement pour synchroniser avec le Breadcrumb
          window.dispatchEvent(new CustomEvent('noteTitleUpdated', { 
            detail: { noteId, title: currentTitle } 
          }));
          
          // Afficher la notification
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { message: 'Titre synchronisé', type: 'success' }
          }));
        } else {
          console.error('❌ [TitleSync] Erreur HTTP', response.status);
        }
      } catch (error) {
        console.error('❌ [TitleSync] Erreur sauvegarde:', error);
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [noteId, isReadOnly]);

  return null;
}
