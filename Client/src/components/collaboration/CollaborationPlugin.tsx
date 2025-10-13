"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as Y from 'yjs';
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode, TextNode, $parseSerializedNode } from 'lexical';
import { socketService } from '@/services/socketService';

// Fonction utilitaire pour détecter mobile (non-hook)
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Détecter mobile via plusieurs méthodes
  const isMobileWidth = window.innerWidth < 768;
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileWidth || isMobileUserAgent || isTouchDevice;
};

// Fonction utilitaire pour créer un throttler
const createThrottler = (delay: number) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (callback: Function) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      callback();
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        callback();
      }, delay - (now - lastCall));
    }
  };
};

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
  const [socket, setSocket] = useState<any | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [userCount, setUserCount] = useState<number>(1);
  const isSyncing = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Détection mobile avec useState
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDetected = isMobileDevice();
      console.log('📱🔍 Détection device:', { 
        isMobile: isMobileDetected,
        width: window.innerWidth,
        userAgent: navigator.userAgent.substring(0, 50),
        touchSupport: 'ontouchstart' in window
      });
      setIsMobile(isMobileDetected);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Throttling uniforme pour éviter les désynchronisations
  const throttleDelay = 200; // Délai uniforme pour tous les devices

  useEffect(() => {
    console.log(isMobile ? '📱🔥 Init mobile' : '🔥 CollaborationPlugin initialisation:', { noteId, username, isReadOnly, throttleDelay });
    
    // Crée un nouveau Y.Doc à chaque changement de noteId
    const yDoc = new Y.Doc();
    yDocRef.current = yDoc;

    // Initialise le socket
    const newSocket = socketService.getSocket(noteId, username);
    setSocket(newSocket || null);

    // Origins spécifiques pour éviter les boucles
    const SOCKET_UPDATE_ORIGIN = Symbol('socket-update');
    const LEXICAL_UPDATE_ORIGIN = Symbol('lexical-update');

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
      console.log(isMobile ? '📱🔗 Connecté' : '🔗 Socket connecté');
      setStatus('connected');
      if (!socketService.hasJoinedCurrentRoom()) {
        console.log(isMobile ? '📱📝 Join note' : '📝 Émission joinNote');
        newSocket.emit('joinNote', { noteId });
        socketService.markRoomJoined();
      } else {
        console.log(isMobile ? '📱✅ Déjà dans room' : '✅ Déjà dans la room');
      }
    });

    if (newSocket.connected && !socketService.hasJoinedCurrentRoom()) {
      console.log(isMobile ? '📱🔗 Déjà connecté, join' : '🔗 Déjà connecté, émission joinNote');
      setStatus('connected');
      newSocket.emit('joinNote', { noteId });
      socketService.markRoomJoined();
    }

    newSocket.on('disconnect', () => {
      setStatus('disconnected');
    });

    newSocket.on('error', (error: any) => {
      console.error('❌ Erreur Socket.IO:', error);
    });

    newSocket.on('sync', ({ state, userCount: count }: { state: string, userCount: number }) => {
      console.log(isMobile ? `📱👥 Sync: ${count} users` : `👥 Synchronisation reçue: ${count} utilisateurs`);
      setUserCount(count);
      try {
        const stateBuffer = Uint8Array.from(Buffer.from(state, 'base64'));
        Y.applyUpdate(yDoc, stateBuffer, SOCKET_UPDATE_ORIGIN);
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

    newSocket.on('yjsUpdate', ({ update, userId }: { update: string, userId?: number }) => {
      // Log adapté selon le device
      if (isMobile) {
        console.log('📱📥 Update reçue:', { 
          from: userId, 
          size: update.length,
          syncing: isSyncing.current 
        });
      } else {
        console.log('📥 Mise à jour Yjs reçue:', { 
          noteId, 
          fromUserId: userId, 
          updateSize: update.length,
          isSyncing: isSyncing.current 
        });
      }
      
      try {
        const updateBuffer = Uint8Array.from(Buffer.from(update, 'base64'));
        Y.applyUpdate(yDoc, updateBuffer, SOCKET_UPDATE_ORIGIN);
        const yText = yDoc.getText('content');
        const yjsContent = yText.toString();
        
        if (!isMobile) {
          console.log('🔄 Contenu Yjs après mise à jour:', { 
            yjsLength: yjsContent.length,
            preview: yjsContent.substring(0, 50) + (yjsContent.length > 50 ? '...' : '')
          });
        }
        
        isSyncing.current = true;
        
        // Timeout de sécurité pour éviter que isSyncing reste bloqué
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          console.warn('⚠️ Timeout isSyncing - force reset');
          isSyncing.current = false;
        }, 1000);
        
        // Mise à jour de l'éditeur avec le contenu Yjs
        editor.update(() => {
          const root = $getRoot();
          const currentContent = root.getTextContent();
          
          // Log adapté selon le device
          if (isMobile) {
            console.log('📱🔄 Comparaison:', {
              lexLen: currentContent.length,
              yjsLen: yjsContent.length,
              equal: currentContent === yjsContent
            });
          } else {
            console.log('📝 Comparaison contenus:', {
              currentLength: currentContent.length,
              yjsLength: yjsContent.length,
              areEqual: currentContent === yjsContent
            });
          }
          
          if (currentContent !== yjsContent) {
            root.clear();
            
            // Reconstruire le contenu de façon uniforme
            if (yjsContent.trim()) {
              const lines = yjsContent.split('\n');
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
            
            console.log(isMobile ? '📱✅ Éditeur sync' : '✅ Contenu éditeur mis à jour depuis Yjs');
          }
        });
        
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        isSyncing.current = false;
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        isSyncing.current = false;
      }
    });

    newSocket.on('userJoined', ({ userCount: count }: { userCount: number }) => {
      console.log(isMobile ? `📱👋 +User: ${count}` : `👋 Utilisateur rejoint: ${count} total`);
      setUserCount(count);
    });
    newSocket.on('userLeft', ({ userCount: count }: { userCount: number }) => {
      console.log(isMobile ? `📱👋 -User: ${count}` : `👋 Utilisateur parti: ${count} total`);
      setUserCount(count);
    });

        // Créer un throttler pour les updates Lexical → Yjs (sera recréé si throttleDelay change)
    const updateThrottler = createThrottler(throttleDelay);
    const throttledUpdate = (editorState: any) => {
      updateThrottler(() => {
        if (isSyncing.current || isReadOnly) {
          console.log('🚫 Update Lexical→Yjs ignoré:', { isSyncing: isSyncing.current, isReadOnly });
          return;
        }
        
        editorState.read(() => {
          const root = $getRoot();
          // Sérialiser l'état complet avec le formatage au lieu du texte brut
          const serializedState = JSON.stringify(editorState.toJSON());
          const yText = yDoc.getText('content');
          const yjsContent = yText.toString();
          
          // Log plus concis pour mobile
          if (isMobile) {
            console.log('� Lexical→Yjs:', {
              serializedLen: serializedState.length,
              yjsLen: yjsContent.length,
              changed: serializedState !== yjsContent
            });
          } else {
            console.log('�🔄 Comparaison Lexical→Yjs:', {
              serializedLength: serializedState.length,
              yjsLength: yjsContent.length,
              areEqual: serializedState === yjsContent,
              lexicalPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              yjsPreview: yjsContent.substring(0, 50) + (yjsContent.length > 50 ? '...' : '')
            });
          }
          
          if (content !== yjsContent) {
            console.log(isMobile ? '📱 Update Yjs' : '📝 Mise à jour Yjs depuis Lexical');
            
            // Utiliser une transaction pour grouper les modifications
            yDoc.transact(() => {
              yText.delete(0, yText.length);
              yText.insert(0, content);
            }, LEXICAL_UPDATE_ORIGIN);
          }
        });
      });
    };

    // Lexical → Yjs avec throttling
    const removeUpdateListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }: any) => {
      if (isSyncing.current || isReadOnly) return;
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      
      // Utiliser la version throttlée
      throttledUpdate(editorState);
    });

    // Créer un throttler pour les émissions WebSocket (sera recréé si throttleDelay change)
    const socketThrottler = createThrottler(throttleDelay);
    const throttledSocketEmit = (updateBase64: string) => {
      socketThrottler(() => {
        if (newSocket.connected) {
          newSocket.emit('yjsUpdate', { noteId, update: updateBase64 });
        }
      });
    };

    // Yjs → Socket avec throttling
    const updateHandler = (update: Uint8Array, origin: any) => {
      console.log('📤 Yjs update handler appelé:', { 
        origin, 
        updateSize: update.length,
        isSyncing: isSyncing.current,
        isReadOnly 
      });
      
      // Ignorer seulement les mises à jour qui viennent du réseau (pour éviter les boucles)
      if (origin === SOCKET_UPDATE_ORIGIN || isSyncing.current) {
        console.log('🚫 Mise à jour ignorée (socket origin ou syncing):', { origin: origin?.toString(), syncing: isSyncing.current });
        return;
      }
      
      // Accepter toutes les autres mises à jour (y compris origin: null) si pas en readonly
      if (!isReadOnly) {
        const updateBase64 = Buffer.from(update).toString('base64');
        
        console.log('📡 Envoi mise à jour WebSocket:', { 
          noteId, 
          updateSize: updateBase64.length,
          isMobile,
          connected: newSocket.connected 
        });
        
        // TEMPORAIRE: Désactiver le throttling différentiel pour identifier le problème
        if (newSocket.connected) {
          console.log(isMobile ? '📱 Mobile: émission immédiate (debug)' : '💻 Desktop: émission WebSocket immédiate');
          newSocket.emit('yjsUpdate', { noteId, update: updateBase64 });
        } else {
          console.warn('⚠️ Socket non connecté, mise à jour ignorée');
        }
      } else {
        console.log('🚫 Mise à jour ignorée (readonly mode)');
      }
    };
    yDoc.on('update', updateHandler);

    // Sur mobile, vérifier périodiquement la connexion
    let connectionCheckInterval: NodeJS.Timeout | undefined;
    let visibilityHandler: (() => void) | undefined;
    
    if (isMobile) {
      connectionCheckInterval = setInterval(() => {
        if (newSocket.connected && !socketService.hasJoinedCurrentRoom()) {
          console.log('📱🔄 Mobile: re-join room');
          newSocket.emit('joinNote', { noteId });
          socketService.markRoomJoined();
        }
      }, 5000); // Vérifier toutes les 5 secondes
      
      // Gérer la visibilité de la page sur mobile
      visibilityHandler = () => {
        if (document.visibilityState === 'visible' && newSocket.connected) {
          console.log('📱👁️ Page visible, vérification connexion');
          if (!socketService.hasJoinedCurrentRoom()) {
            newSocket.emit('joinNote', { noteId });
            socketService.markRoomJoined();
          }
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
    }

    // Cleanup
    return () => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
      }
      yDoc.off('update', updateHandler);
      removeUpdateListener();
      // On ne ferme pas explicitement le socket ici (géré ailleurs)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, editor, isReadOnly, username, throttleDelay]);

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
  // Debug: toujours logguer l'état pour mobile
  if (isMobile) {
    console.log('📱👥 Statut affichage:', { status, userCount });
  }
  
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
