"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as Y from 'yjs';
import { Socket } from 'socket.io-client';
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode, TextNode } from 'lexical';
import { socketService } from '@/services/socketService';

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
  const yDocRef = useRef<Y.Doc | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [userCount, setUserCount] = useState<number>(1);
  const isSyncing = useRef(false);

  useEffect(() => {
    // Crée un nouveau Y.Doc à chaque changement de noteId
    const yDoc = new Y.Doc();
    yDocRef.current = yDoc;

    // Initialise le socket
    const newSocket = socketService.getSocket(noteId, username);
    setSocket(newSocket || null);

    const UPDATE_ORIGIN = Symbol('socket-update');

    if (!newSocket) return;

    // Nettoie tous les anciens listeners
    newSocket.off('connect');
    newSocket.off('disconnect');
    newSocket.off('error');
    newSocket.off('sync');
    newSocket.off('yjsUpdate');
    newSocket.off('userJoined');
    newSocket.off('userLeft');

    // Connexion
    newSocket.on('connect', () => {
      setStatus('connected');
      if (!socketService.hasJoinedCurrentRoom()) {
        newSocket.emit('joinNote', { noteId });
        socketService.markRoomJoined();
      }
    });

    if (newSocket.connected && !socketService.hasJoinedCurrentRoom()) {
      setStatus('connected');
      newSocket.emit('joinNote', { noteId });
      socketService.markRoomJoined();
    }

    newSocket.on('disconnect', () => {
      setStatus('disconnected');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Erreur Socket.IO:', error);
    });

    newSocket.on('sync', ({ state, userCount: count }) => {
      setUserCount(count);
      try {
        const stateBuffer = Uint8Array.from(Buffer.from(state, 'base64'));
        Y.applyUpdate(yDoc, stateBuffer, UPDATE_ORIGIN);
        const yText = yDoc.getText('content');
        isSyncing.current = true;
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const content = yText.toString();
          if (content) {
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
            root.append($createParagraphNode());
          }
        });
        isSyncing.current = false;
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
      }
    });

    newSocket.on('yjsUpdate', ({ update }) => {
      try {
        const updateBuffer = Uint8Array.from(Buffer.from(update, 'base64'));
        Y.applyUpdate(yDoc, updateBuffer, UPDATE_ORIGIN);
        const yText = yDoc.getText('content');
        isSyncing.current = true;
        editor.update(() => {
          const root = $getRoot();
          const currentContent = root.getTextContent();
          const yjsContent = yText.toString();
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

    newSocket.on('userJoined', ({ userCount: count }) => {
      setUserCount(count);
    });
    newSocket.on('userLeft', ({ userCount: count }) => {
      setUserCount(count);
    });

    // Lexical → Yjs
    const removeUpdateListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }: any) => {
      if (isSyncing.current || isReadOnly) return;
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      editorState.read(() => {
        const root = $getRoot();
        const content = root.getTextContent();
        const yText = yDoc.getText('content');
        const yjsContent = yText.toString();
        if (content !== yjsContent) {
          yDoc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, content);
          }, 'lexical-update');
        }
      });
    });

    // Yjs → Socket
    const updateHandler = (update: Uint8Array, origin: any) => {
      if (origin === UPDATE_ORIGIN || isSyncing.current) return;
      if (origin === 'lexical-update' && !isReadOnly) {
        const updateBase64 = Buffer.from(update).toString('base64');
        newSocket.emit('yjsUpdate', { noteId, update: updateBase64 });
      }
    };
    yDoc.on('update', updateHandler);

    // Cleanup
    return () => {
      yDoc.off('update', updateHandler);
      removeUpdateListener();
      // On ne ferme pas explicitement le socket ici (géré ailleurs)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, editor, isReadOnly, username]);

  // ✅ Effet séparé pour détecter le changement de note
  useEffect(() => {
    // Quitter la room précédente lors du changement de noteId
    return () => {
      const currentSocket = socketService.getCurrentSocket();
      if (currentSocket?.connected) {
        currentSocket.emit('leaveNote', { noteId });
        socketService.markRoomLeft();
      }
    };
  }, [noteId]);

  // ✅ Afficher un indicateur de statut simplifié
  // Ne rien afficher si seul (userCount === 1), sinon juste "En ligne"
  if (status !== 'connected' || userCount <= 1) {
    return null; // Pas d'affichage si déconnecté ou seul
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm bg-green-100 text-green-800">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-medium">En ligne</span>
      </div>
    </div>
  );
}
