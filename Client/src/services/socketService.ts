
import { io, Socket } from 'socket.io-client';

/**
 * Service singleton pour gérer la connexion Socket.IO
 * Persiste entre les re-renders React et se déconnecte uniquement au changement de page
 */
class SocketService {
  private socket: Socket | null = null;
  private currentNoteId: string | null = null;
  private isConnecting = false;
  private hasJoinedRoom = false; // ✅ Track si on a déjà rejoint la room

  /**
   * Marquer qu'on a quitté la room
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

    this.currentNoteId = noteId;

    // Écouter la connexion réussie
    this.socket.on('connect', () => {
      this.isConnecting = false;
    });

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
   * Déconnecter le socket actuel
   */
  disconnect() {
    if (this.socket) {
      
      // Quitter la note avant de déconnecter
      if (this.currentNoteId && this.socket.connected && this.hasJoinedRoom) {
        this.socket.emit('leaveNote', { noteId: this.currentNoteId });
      }
      
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentNoteId = null;
      this.isConnecting = false;
      this.hasJoinedRoom = false;
    }
  }

  /**
   * Marquer qu'on a rejoint la room
   */
  markRoomJoined() {
    this.hasJoinedRoom = true;
  }

  /**
   * Vérifier si on a déjà rejoint la room
   */
  hasJoinedCurrentRoom(): boolean {
    return this.hasJoinedRoom;
  }

  /**
   * Vérifier si un socket est actif pour une note
   */
  isConnected(noteId: string): boolean {
    return !!(
      this.socket && 
      this.socket.connected && 
      this.currentNoteId === noteId
    );
  }

  /**
   * Obtenir le socket actuel (peut être null)
   */
  getCurrentSocket(): Socket | null {
    return this.socket;
  }
}

// Export d'une instance unique (singleton)
export const socketService = new SocketService();

// Déconnecter quand l'utilisateur quitte la page (navigation ou fermeture)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketService.disconnect();
  });
}
