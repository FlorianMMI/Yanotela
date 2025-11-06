
import { io, Socket } from 'socket.io-client';
import type { YjsUpdateSerialized, YjsSyncResponse } from '@/type/Yjs';

/**
 * Service singleton pour gérer la connexion Socket.IO
 * Gère la connexion unique, les rooms, et les événements de collaboration temps réel
 * 
 * ✅ INTÉGRATION YJS : Ce service transporte les updates Yjs via WebSocket
 */
class SocketService {
  private socket: Socket | null = null;
  private currentNoteId: string | null = null;
  private currentOnInit: ((data: any) => void) | null = null; // ✅ NOUVEAU: Préserver le callback
  
  // ✅ ANTI-PING-PONG: Cache des dernières modifications reçues par utilisateur
  // Structure: { noteId: { userId: lastContent } }
  private lastReceivedContent: Map<string, Map<number, string>> = new Map();
  
  // ✅ Cache du dernier contenu envoyé pour cette note
  private lastSentContent: Map<string, string> = new Map();

  /**
   * Obtenir ou créer la connexion socket globale
   * 🔥 PROTECTION SSR : Ne créer le socket QUE côté client (navigateur)
   */
  private getOrCreateSocket(): Socket | null {
    // 🔥 CRITIQUE : Ne JAMAIS créer de socket pendant le SSR de Next.js
    if (typeof window === 'undefined') {
      console.warn('⚠️ Socket.IO désactivé côté serveur (SSR) - retour null');
      return null;
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

  // NOTE: Certains envs (ex: .env.dev) définissent NEXT_PUBLIC_API_URL avec un préfixe
  // `/api` (ex: http://localhost:3001/api). Si on passe cette URL directement à
  // socket.io-client, elle est interprétée comme une namespace (ex: '/api') et le
  // serveur renverra "Invalid namespace". On nettoie donc l'URL pour garder
  // uniquement l'origine (scheme + host + port).
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const SOCKET_URL = rawApiUrl.replace(/\/api\/?$/, '') || 'http://localhost:3000';

    this.socket = io(SOCKET_URL, {
      path: '/socket.io/',
      withCredentials: true,
      transports: ['websocket', 'polling'], // WebSocket prioritaire, polling en fallback
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      // ✅ AJOUT: Forcer l'envoi des credentials (cookies de session)
      extraHeaders: {
        'Access-Control-Allow-Credentials': 'true'
      }
    });

    this.socket.on('connect', () => {

      // ✅ CORRECTION CRITIQUE: Re-joindre automatiquement la note après reconnexion
      if (this.currentNoteId) {
        
        this.socket?.emit('joinNote', { noteId: this.currentNoteId });
        
        // ✅ Ré-écouter noteJoined avec le callback sauvegardé
        if (this.currentOnInit) {
          this.socket?.off('noteJoined');
          this.socket?.once('noteJoined', (data: any) => {
            
            this.currentOnInit?.(data);
          });
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion socket:', error);
      console.error('Détails:', {
        message: error.message,
        description: (error as any).description,
        context: (error as any).context
      });
    });

    this.socket.on('disconnect', (reason) => {
      
    });

    // ✅ DEBUG: Listener global pour userTyping
    this.socket.on('userTyping', (data) => {
      
    });

    return this.socket;
  }

  /**
   * Rejoindre une note (room)
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  joinNote(noteId: string, onInit?: (data: any) => void) {
    // 🔥 PROTECTION SSR
    if (typeof window === 'undefined') {
      console.warn('⚠️ joinNote() appelé côté serveur - ignoré');
      return;
    }

    const socket = this.getOrCreateSocket();
    if (!socket) {
      console.error('❌ Socket non disponible pour joinNote');
      return;
    }

    // Si on change de note, quitter l'ancienne room
    if (this.currentNoteId && this.currentNoteId !== noteId) {
      socket.emit('leaveNote', { noteId: this.currentNoteId });
      
    }

    this.currentNoteId = noteId;
    this.currentOnInit = onInit || null; // ✅ Sauvegarder le callback

    // Rejoindre la room
    
    socket.emit('joinNote', { noteId });
    
    // ✅ Écouter la confirmation - CORRECTION: c'est 'noteJoined' pas 'noteInit'
    if (onInit) {
      socket.off('noteJoined'); // Éviter les listeners multiples
      socket.once('noteJoined', (data: any) => {

        // ✅ Émettre un événement DOM pour que d'autres composants puissent l'écouter
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('noteJoined', {
            detail: {
              noteId: data.noteId,
              userCount: data.userCount,
              isReadOnly: data.isReadOnly
            }
          }));
        }
        
        // Appeler le callback pour que useYjsDocument puisse setIsReady(true)
        onInit(data);
      });
    }
  }

  /**
   * Écouter les événements du socket (générique)
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  on(event: string, callback: (...args: any[]) => void) {
    // 🔥 PROTECTION SSR
    if (typeof window === 'undefined') return;
    
    const socket = this.getOrCreateSocket();
    if (!socket) return;
    
    socket.on(event, callback);
  }

  /**
   * 🔥 Retirer un listener d'événement
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  off(event: string, callback?: (...args: any[]) => void) {
    if (typeof window === 'undefined') return;
    if (!this.socket) return;
    if (callback) {
      
      this.socket.off(event, callback);
    } else {
      
      this.socket.off(event);
    }
    
    // Log du nombre de listeners restants
    const remaining = this.socket.listeners(event).length;
    
  }

  /**
   * Émettre un événement générique
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  emit(event: string, data: any) {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) {
      console.error(`❌ Impossible d'émettre ${event}: socket non connecté`);
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Quitter la note courante et nettoyer le cache
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  leaveNote() {
    if (typeof window === 'undefined') return;
    if (!this.currentNoteId || !this.socket) return;

    this.socket.emit('leaveNote', { noteId: this.currentNoteId });
    
    // ✅ Nettoyer le cache anti-ping-pong pour cette note
    this.lastReceivedContent.delete(this.currentNoteId);
    this.lastSentContent.delete(this.currentNoteId);

    this.currentNoteId = null;
    this.currentOnInit = null; // ✅ Nettoyer le callback aussi
  }

  /**
   * Émettre une mise à jour du titre
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  emitTitleUpdate(noteId: string, titre: string) {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('titleUpdate', { noteId, titre });
  }

  /**
   * Émettre une mise à jour du contenu avec anti-ping-pong
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  emitContentUpdate(noteId: string, content: string) {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Impossible d\'émettre contentUpdate: socket non connecté', {
        hasSocket: !!this.socket,
        connected: this.socket?.connected
      });
      return;
    }
    
    // ✅ ANTI-PING-PONG: Vérifier si c'est le même contenu qu'on a déjà envoyé
    const lastSent = this.lastSentContent.get(noteId);
    if (lastSent === content) {
      
      return;
    }
    
    // ✅ ANTI-PING-PONG: Vérifier si c'est un contenu qu'on vient de recevoir d'un autre utilisateur
    const receivedCache = this.lastReceivedContent.get(noteId);
    if (receivedCache) {
      for (const [userId, lastContent] of receivedCache.entries()) {
        if (lastContent === content) {
          
          return;
        }
      }
    }

    // ✅ Stocker le contenu envoyé dans le cache
    this.lastSentContent.set(noteId, content);
    
    this.socket.emit('contentUpdate', { noteId, content });
  }

  /**
   * Émettre la position du curseur
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  emitCursorUpdate(noteId: string, cursor: { line: number; column: number }) {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('cursorUpdate', { noteId, cursor });
  }

  /**
   * Émettre une sélection de texte
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  emitSelectionUpdate(noteId: string, selection: { start: number; end: number }) {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('selectionUpdate', { noteId, selection });
  }

  /**
   * Émettre l'état "typing" (utilisateur en train de taper)
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   */
  emitUserTyping(noteId: string, isTyping: boolean) {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) return;
    
    this.socket.emit('userTyping', { noteId, isTyping });
  }

  /**
   * Écouter les mises à jour du titre
   * ✅ CORRECTION: Ne pas supprimer les autres listeners
   */
  onTitleUpdate(callback: (data: { noteId: string; titre: string; userId: number; pseudo: string }) => void) {
    if (!this.socket) return;
    // ✅ Ne PAS faire .off() ici pour permettre plusieurs listeners
    
    this.socket.on('titleUpdate', callback);
    
    const listenerCount = this.socket.listeners('titleUpdate').length;
    
  }

  /**
   * Écouter les mises à jour du contenu avec cache anti-ping-pong
   */
  onContentUpdate(callback: (data: { noteId: string; content: string; userId: number; pseudo: string }) => void) {
    if (!this.socket) return;
    this.socket.off('contentUpdate'); // Éviter les listeners multiples
    
    this.socket.on('contentUpdate', (data: { noteId: string; content: string; userId: number; pseudo: string }) => {
      // ✅ ANTI-PING-PONG: Stocker le contenu reçu dans le cache par utilisateur
      if (!this.lastReceivedContent.has(data.noteId)) {
        this.lastReceivedContent.set(data.noteId, new Map());
      }
      
      const noteCache = this.lastReceivedContent.get(data.noteId)!;
      noteCache.set(data.userId, data.content);

      // Appeler le callback original
      callback(data);
    });
  }

  /**
   * Écouter les nouveaux utilisateurs
   */
  onUserJoined(callback: (data: { userId: number; pseudo: string; userCount: number }) => void) {
    if (!this.socket) return;
    this.socket.off('userJoined'); // Éviter les listeners multiples
    this.socket.on('userJoined', callback);
  }

  /**
   * Écouter les utilisateurs qui partent
   */
  onUserLeft(callback: (data: { userId: number; pseudo: string; userCount: number }) => void) {
    if (!this.socket) return;
    this.socket.off('userLeft'); // Éviter les listeners multiples
    this.socket.on('userLeft', callback);
  }

  /**
   * Écouter les erreurs
   */
  onError(callback: (data: { message: string }) => void) {
    if (!this.socket) return;
    this.socket.off('error'); // Éviter les listeners multiples
    this.socket.on('error', callback);
  }

  /**
   * Écouter les curseurs des autres utilisateurs
   */
  onCursorUpdate(callback: (data: { noteId: string; cursor: { line: number; column: number }; userId: number; pseudo: string }) => void) {
    if (!this.socket) return;
    this.socket.off('cursorUpdate');
    this.socket.on('cursorUpdate', callback);
  }

  /**
   * Écouter les sélections des autres utilisateurs
   */
  onSelectionUpdate(callback: (data: { noteId: string; selection: { start: number; end: number }; userId: number; pseudo: string }) => void) {
    if (!this.socket) return;
    this.socket.off('selectionUpdate');
    this.socket.on('selectionUpdate', callback);
  }

  /**
   * Écouter quand un utilisateur tape
   * ✅ CORRECTION: Ne pas supprimer les autres listeners avec .off()
   */
  onUserTyping(callback: (data: { noteId: string; isTyping: boolean; userId: number; pseudo: string }) => void) {
    if (!this.socket) return;
    // ✅ Ne PAS faire .off() ici, sinon on supprime les listeners des autres composants
    
    this.socket.on('userTyping', callback);
    
    // Log du nombre total de listeners pour cet événement
    const listenerCount = this.socket.listeners('userTyping').length;
    
  }

  /**
   * Écouter la liste des utilisateurs (userList)
   */
  onUserList(callback: (data: { users: Array<{ userId: number; pseudo: string }> }) => void) {
    if (!this.socket) return;
    this.socket.off('userList');
    this.socket.on('userList', callback);
  }

  /**
   * Arrêter d'écouter la liste des utilisateurs (userList)
   */
  offUserList(callback: (data: { users: Array<{ userId: number; pseudo: string }> }) => void) {
    if (!this.socket) return;
    this.socket.off('userList', callback);
  }

  /**
   * Demander la liste des utilisateurs pour une note
   */
  requestUserList(noteId: string) {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('requestUserList', { noteId });
  }

  // ==========================================
  // 🔥 NOUVEAUX ÉVÉNEMENTS YJS
  // ==========================================

  /**
   * 📤 Émettre un update Yjs vers les autres utilisateurs
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   * 
   * @param update - Update Yjs sérialisé (Uint8Array converti en Array)
   */
  emitYjsUpdate(update: YjsUpdateSerialized): void {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket non connecté, impossible d\'émettre yjs-update');
      return;
    }

    this.socket.emit('yjs-update', update);
  }

  /**
   * 📥 Écouter les updates Yjs des autres utilisateurs
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   * 
   * @param callback - Fonction appelée à chaque update reçu
   */
  onYjsUpdate(callback: (update: YjsUpdateSerialized) => void): void {
    if (typeof window === 'undefined') return;
    if (!this.socket) return;

    // Éviter les listeners multiples
    this.socket.off('yjs-update');

    this.socket.on('yjs-update', (data: YjsUpdateSerialized) => {

      callback(data);
    });
  }

  /**
   * 🔄 Demander une synchronisation complète de l'état Yjs
   * Utilisé au reconnect ou à la première connexion
   * 🔥 PROTECTION SSR : Ne rien faire côté serveur
   * 
   * @param noteId - ID de la note à synchroniser
   * @param stateVector - State vector Yjs actuel (optionnel)
   */
  requestYjsSync(noteId: string, stateVector?: number[]): void {
    if (typeof window === 'undefined') return;
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket non connecté, impossible de demander sync Yjs');
      return;
    }

    this.socket.emit('yjs-sync-request', {
      noteId,
      stateVector: stateVector || [],
    });
  }

  /**
   * 📦 Écouter la réponse de synchronisation Yjs
   * Le serveur renvoie les updates manquants ou l'état complet
   * 
   * @param callback - Fonction appelée avec les données de sync
   */
  onYjsSyncResponse(callback: (response: YjsSyncResponse & { noteId: string }) => void): void {
    if (!this.socket) return;

    this.socket.off('yjs-sync-response');

    this.socket.on('yjs-sync-response', (data: YjsSyncResponse & { noteId: string }) => {

      callback(data);
    });
  }

  /**
   * 🔄 Écouter les demandes de sync (côté serveur envoie l'état initial)
   */
  onYjsInitialState(callback: (data: { noteId: string; yjsState: number[] }) => void): void {
    if (!this.socket) return;

    this.socket.off('yjs-initial-state');

    this.socket.on('yjs-initial-state', (data) => {
      
      callback(data);
    });
  }

  /**
   * Nettoyer tous les listeners
   */
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.off('noteInit');
    this.socket.off('titleUpdate');
    this.socket.off('contentUpdate');
    this.socket.off('userJoined');
    this.socket.off('userLeft');
    this.socket.off('error');
    this.socket.off('cursorUpdate');
    this.socket.off('selectionUpdate');
    this.socket.off('userTyping');
    this.socket.off('userList');
    // 🔥 Nettoyer les listeners Yjs
    this.socket.off('yjs-update');
    this.socket.off('yjs-sync-request');
    this.socket.off('yjs-sync-response');
    this.socket.off('yjs-initial-state');
  }

  /**
   * Déconnecter complètement le socket
   */
  disconnect() {
    if (!this.socket) return;

    // Quitter la note courante avant de déconnecter
    if (this.currentNoteId) {
      this.socket.emit('leaveNote', { noteId: this.currentNoteId });
    }

    this.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.currentNoteId = null;
    
  }

  /**
   * Vérifier si connecté
   */
  isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  /**
   * Obtenir l'ID de la note courante
   */
  getCurrentNoteId(): string | null {
    return this.currentNoteId;
  }
}

// Export d'une instance unique (singleton)
export const socketService = new SocketService();

// Nettoyer proprement à la fermeture de la page
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketService.disconnect();
  });
}
