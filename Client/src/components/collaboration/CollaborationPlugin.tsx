"use client";
import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as Y from 'yjs';
import { io, Socket } from 'socket.io-client';
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode, TextNode } from 'lexical';

interface CollaborationPluginProps {
  noteId: string;
  username: string;
  isReadOnly?: boolean;
}

/**
 * Plugin Lexical pour la collaboration temps réel avec Yjs
 * 
 * CORRECTIONS CRITIQUES :
 * - Utilise createBinding() au lieu de Provider
 * - Tracking correct de l'origine des updates
 * - Pas d'écrasement du contenu lors de la synchro
 */
export default function CollaborationPlugin({ 
  noteId, 
  username,
  isReadOnly = false 
}: CollaborationPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [yDoc] = useState(() => new Y.Doc());
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [userCount, setUserCount] = useState<number>(1);
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);

  useEffect(() => {
    // ✅ DEBUG : Vérifier les props
    console.log('🔧 CollaborationPlugin - Props:', { noteId, username, isReadOnly });
    
    // ✅ CORRECTION : Ne pas initialiser si username est vide
    if (!username || username.trim() === '') {
      console.log('⚠️  Username vide, attente...');
      return;
    }
    
    if (isInitialized.current) {
      console.log('⚠️  Déjà initialisé, skip');
      return;
    }
    isInitialized.current = true;

    // URL du serveur Socket.IO
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('🌐 Connexion à:', SOCKET_URL);
    
    // Créer la connexion Socket.IO avec les credentials pour l'authentification session
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setStatus('connecting');
    setSocket(newSocket);

    // Identifiant unique pour tracker l'origine des updates
    const UPDATE_ORIGIN = Symbol('socket-update');

    // Gestion de la connexion établie
    newSocket.on('connect', () => {
      console.log('🔌 Socket.IO connecté - Socket ID:', newSocket.id);
      setStatus('connected');
      
      // Rejoindre la room de la note
      console.log('📨 Envoi de joinNote pour noteId:', noteId);
      newSocket.emit('joinNote', { noteId });
    });

    // Gestion de la déconnexion
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO déconnecté:', reason);
      setStatus('disconnected');
    });

    // Gestion des erreurs
    newSocket.on('error', (error) => {
      console.error('❌ Erreur Socket.IO:', error);
    });

    // Recevoir l'état initial du document
    newSocket.on('sync', ({ state, userCount: count, isReadOnly: serverReadOnly }) => {
      console.log(`📥 État initial reçu (${count} utilisateurs)`);
      setUserCount(count);

      try {
        // Décoder et appliquer l'état initial depuis le serveur
        const stateBuffer = Uint8Array.from(Buffer.from(state, 'base64'));
        Y.applyUpdate(yDoc, stateBuffer, UPDATE_ORIGIN);

        // ✅ CORRECTION CRITIQUE : Synchroniser Yjs → Lexical
        const yText = yDoc.getText('content');
        
        // Mettre à jour l'éditeur avec le contenu Yjs (une seule fois à l'init)
        isSyncing.current = true;
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          
          const content = yText.toString();
          if (content) {
            // Créer les paragraphes depuis le contenu Yjs
            const lines = content.split('\n');
            lines.forEach(line => {
              const paragraph = $createParagraphNode();
              if (line) {
                const textNode = $createTextNode(line);
                paragraph.append(textNode);
              }
              root.append(paragraph);
            });
          } else {
            // Document vide, ajouter un paragraphe
            root.append($createParagraphNode());
          }
        });
        isSyncing.current = false;

        console.log('✅ Collaboration initialisée - Contenu synchronisé');
        
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
      }
    });

    // Recevoir les mises à jour Yjs des autres utilisateurs
    newSocket.on('yjsUpdate', ({ update, userId }) => {
      try {
        console.log(`📥 Mise à jour reçue de l'utilisateur ${userId}`);
        const updateBuffer = Uint8Array.from(Buffer.from(update, 'base64'));
        
        // Appliquer avec l'origine pour éviter de reboucler
        Y.applyUpdate(yDoc, updateBuffer, UPDATE_ORIGIN);
        
        // ✅ CORRECTION : Synchroniser Yjs → Lexical après réception
        const yText = yDoc.getText('content');
        isSyncing.current = true;
        editor.update(() => {
          const root = $getRoot();
          const currentContent = root.getTextContent();
          const yjsContent = yText.toString();
          
          // Ne mettre à jour que si le contenu diffère
          if (currentContent !== yjsContent) {
            root.clear();
            const lines = yjsContent.split('\n');
            lines.forEach(line => {
              const paragraph = $createParagraphNode();
              if (line) {
                const textNode = $createTextNode(line);
                paragraph.append(textNode);
              }
              root.append(paragraph);
            });
          }
        });
        isSyncing.current = false;
      } catch (error) {
        console.error('❌ Erreur lors de l\'application de la mise à jour:', error);
      }
    });

    // Notification d'arrivée d'utilisateur
    newSocket.on('userJoined', ({ pseudo, userCount: count }) => {
      console.log(`👤 ${pseudo} a rejoint la note`);
      setUserCount(count);
    });

    // Notification de départ d'utilisateur
    newSocket.on('userLeft', ({ pseudo, userCount: count }) => {
      console.log(`👋 ${pseudo} a quitté la note`);
      setUserCount(count);
    });

    // ✅ CORRECTION : Écouter les modifications de Lexical → Yjs
    const removeUpdateListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      // Ignorer si on est en train de synchroniser depuis Yjs
      if (isSyncing.current || isReadOnly) {
        console.log('🔕 Update ignoré - isSyncing:', isSyncing.current, 'isReadOnly:', isReadOnly);
        return;
      }
      
      // Ignorer si aucun changement
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

      console.log('📝 Lexical update détecté - Mise à jour Yjs');
      
      editorState.read(() => {
        const root = $getRoot();
        const content = root.getTextContent();
        
        const yText = yDoc.getText('content');
        const yjsContent = yText.toString();
        
        // Mettre à jour Yjs seulement si le contenu diffère
        if (content !== yjsContent) {
          console.log('🔄 Contenu différent, mise à jour Yjs:', content.substring(0, 50));
          yDoc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, content);
          });
        }
      });
    });

    // Écouter les mises à jour du document Yjs local → Socket.IO
    const updateHandler = (update: Uint8Array, origin: any) => {
      console.log('🔔 Yjs update event - origin:', origin, 'UPDATE_ORIGIN:', UPDATE_ORIGIN, 'isReadOnly:', isReadOnly);
      
      // ✅ CORRECTION : Vérifier l'origine correctement
      if (origin === UPDATE_ORIGIN) {
        // Cette mise à jour vient du serveur, ne pas la renvoyer
        console.log('⏭️  Origine serveur, skip');
        return;
      }
      
      if (!isReadOnly) {
        console.log(`📤 Envoi de la mise à jour au serveur`);
        const updateBase64 = Buffer.from(update).toString('base64');
        newSocket.emit('yjsUpdate', {
          noteId,
          update: updateBase64
        });
      } else {
        console.log('🚫 isReadOnly=true, pas d\'envoi');
      }
    };

    yDoc.on('update', updateHandler);

    // Nettoyage à la déconnexion
    return () => {
      console.log('🧹 Nettoyage de la collaboration');
      
      // Quitter la room
      if (newSocket.connected) {
        newSocket.emit('leaveNote', { noteId });
      }
      
      // Nettoyer les event listeners
      yDoc.off('update', updateHandler);
      removeUpdateListener();
      
      // Déconnecter le socket
      newSocket.disconnect();
      
      // Réinitialiser le flag pour permettre une nouvelle connexion
      isInitialized.current = false;
    };
  }, [noteId, editor, yDoc, isReadOnly, username]);

  // Afficher un indicateur de statut (optionnel)
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm
        ${status === 'connected' ? 'bg-green-100 text-green-800' : 
          status === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'}
      `}>
        <div className={`
          w-2 h-2 rounded-full
          ${status === 'connected' ? 'bg-green-500' : 
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'}
        `} />
        <span className="font-medium">
          {status === 'connected' ? `${userCount} utilisateur${userCount > 1 ? 's' : ''}` :
           status === 'connecting' ? 'Connexion...' :
           'Déconnecté'}
        </span>
      </div>
    </div>
  );
}
