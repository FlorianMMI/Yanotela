
import { io, Socket } from 'socket.io-client';

/**
 * Service singleton pour gérer la connexion Socket.IO
 * Gère la connexion unique, les rooms, et les événements de collaboration temps réel
 */
class SocketService {
  private socket: Socket | null = null;
  private currentNoteId: string | null = null;

  /**
   * Obtenir ou créer la connexion socket globale
   */
  markRoomLeft() {
    this.hasJoinedRoom = false;
  }

  /**
   * Obtenir ou créer la connexion socket
   * ✅ CORRECTION: Meilleure gestion du cycle de vie et reconnexion
   */
  getSocket(noteId: string, username: string): Socket | null {
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // ✅ Si on est déjà connecté à la même note ET que le socket est actif, le retourner
    if (this.socket && this.currentNoteId === noteId && (this.socket.connected || this.isConnecting)) {
      return this.socket;
    }

    // ✅ Si on change de note, bien nettoyer l'ancienne connexion
    if (this.socket && this.currentNoteId !== noteId) {
      this.disconnect();
    }

    // ✅ Si un socket existe mais est déconnecté pour la même note, le réutiliser
    if (this.socket && this.currentNoteId === noteId && !this.socket.connected && !this.isConnecting) {
      this.isConnecting = true;
      this.socket.connect();
      return this.socket;
    }

    // Éviter les créations multiples simultanées
    if (this.isConnecting && this.socket) {
      return this.socket;
    }

    // Créer un nouveau socket
    this.isConnecting = true;
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // ✅ Permettre fallback sur polling
      reconnection: true, // ✅ Activer la reconnexion auto
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connecté');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion socket:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket déconnecté:', reason);
    });

    return this.socket;
  }

  /**
   * Rejoindre une note (room)
   */
  joinNote(noteId: string, onInit?: (data: any) => void) {
    const socket = this.getOrCreateSocket();

    // Si on change de note, quitter l'ancienne room
    if (this.currentNoteId && this.currentNoteId !== noteId) {
      socket.emit('leaveNote', { noteId: this.currentNoteId });
    }

    this.currentNoteId = noteId;

    // Écouter l'initialisation de la note
    if (onInit) {
      socket.off('noteInit'); // Éviter les listeners multiples
      socket.on('noteInit', onInit);
    }

    // ✅ Gérer la reconnexion
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnecté après ${attemptNumber} tentative(s)`);
      this.hasJoinedRoom = false; // Reset pour rejoindre la room
    });

    // Écouter les erreurs
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion socket:', error);
      this.isConnecting = false;
    });

    return this.socket;
  }

  /**
   * Quitter la note courante
   */
  leaveNote() {
    if (!this.currentNoteId || !this.socket) return;

    this.socket.emit('leaveNote', { noteId: this.currentNoteId });
    console.log(`📤 Quitte la note ${this.currentNoteId}`);
    this.currentNoteId = null;
  }

  /**
   * Émettre une mise à jour du titre
   */
  emitTitleUpdate(noteId: string, titre: string) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('titleUpdate', { noteId, titre });
  }

  /**
   * Émettre une mise à jour du contenu
   */
  emitContentUpdate(noteId: string, content: string) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('contentUpdate', { noteId, content });
  }

  /**
   * Écouter les mises à jour du titre
   */
  onTitleUpdate(callback: (data: { noteId: string; titre: string; userId: number; pseudo: string }) => void) {
    if (!this.socket) return;
    this.socket.off('titleUpdate'); // Éviter les listeners multiples
    this.socket.on('titleUpdate', callback);
  }

  /**
   * Écouter les mises à jour du contenu
   */
  onContentUpdate(callback: (data: { noteId: string; content: string; userId: number; pseudo: string }) => void) {
    if (!this.socket) return;
    this.socket.off('contentUpdate'); // Éviter les listeners multiples
    this.socket.on('contentUpdate', callback);
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
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('requestUserList', { noteId });
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
    console.log('🔌 Socket déconnecté');
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


