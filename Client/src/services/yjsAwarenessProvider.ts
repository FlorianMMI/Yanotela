/**
 * YjsAwarenessProvider
 * 
 * Service gérant la synchronisation des états d'awareness (curseurs, sélections, utilisateurs actifs)
 * via y-protocols/awareness et Socket.IO.
 * 
 * Architecture:
 * - Awareness = état local partagé entre utilisateurs (pas dans le Y.Doc CRDT)
 * - Chaque client a un clientID unique et peut publier un state (cursor, selection, color, etc.)
 * - Le serveur broadcast les awareness-update aux autres clients de la room
 * 
 * @example
 * const provider = YjsAwarenessProvider.getInstance();
 * provider.joinNote(noteId, ydoc, { color: '#FF5733', name: 'Alice' });
 * provider.setLocalState({ cursor: { line: 5, col: 10 }, selection: null });
 */

import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { socketService } from './socketService';
import type * as Y from 'yjs';

// ============================================================================
// Types
// ============================================================================

export interface AwarenessUserState {
  /** Pseudo de l'utilisateur */
  name: string;
  /** Couleur attribuée à l'utilisateur (pour curseurs/sélections) */
  color: string;
  /** Position du curseur (peut être null si pas de curseur actif) */
  cursor: {
    /** Index absolu dans le texte (Yjs offset) */
    anchor: number;
    /** Index de fin de sélection (même valeur si pas de sélection) */
    head: number;
  } | null;
}

export interface AwarenessState {
  /** Map des clientID → UserState */
  users: Map<number, AwarenessUserState>;
  /** Nombre total d'utilisateurs connectés */
  userCount: number;
}

// ============================================================================
// YjsAwarenessProvider
// ============================================================================

class YjsAwarenessProviderClass {
  private static instance: YjsAwarenessProviderClass;

  /** Map noteId → Awareness instance */
  private awarenessMap: Map<string, Awareness> = new Map();

  /** Callbacks pour les changements d'awareness par note */
  private listeners: Map<string, Set<(state: AwarenessState) => void>> = new Map();

  /** Palette de couleurs pour les utilisateurs */
  private readonly COLORS = [
    '#FF5733', '#33FF57', '#3357FF', '#F333FF', 
    '#FF33A1', '#33FFF5', '#FFD433', '#8D33FF',
    '#33FF8D', '#FF8D33', '#5733FF', '#33A1FF'
  ];

  private constructor() {
    // Ne pas appeler setupSocketListeners ici car le socket peut ne pas être créé (SSR)
    // On l'appellera dans joinNote() à la place
  }

  public static getInstance(): YjsAwarenessProviderClass {
    if (!YjsAwarenessProviderClass.instance) {
      YjsAwarenessProviderClass.instance = new YjsAwarenessProviderClass();
    }
    return YjsAwarenessProviderClass.instance;
  }

  // ==========================================================================
  // Socket.IO listeners
  // ==========================================================================

  private listenersSetup = false;

  private setupSocketListeners(): void {
    // Éviter de configurer les listeners plusieurs fois
    if (this.listenersSetup) return;
    
    console.log('[YjsAwarenessProvider] 🔌 Configuration des listeners Socket.IO');
    
    // Réception d'un awareness-update depuis le serveur
    socketService.on('awareness-update', this.handleAwarenessUpdate.bind(this));
    
    this.listenersSetup = true;
  }

  private handleAwarenessUpdate(data: { noteId: string; update: number[] }): void {
    const { noteId, update } = data;
    const awareness = this.awarenessMap.get(noteId);

    if (!awareness) {
      console.warn('[YjsAwarenessProvider] Awareness update reçu pour note non suivie:', noteId);
      return;
    }

    try {
      // Appliquer l'update au awareness local (y-protocols)
      const updateArray = new Uint8Array(update);
      applyAwarenessUpdate(awareness, updateArray, 'remote');

      console.log(`📥 [YjsAwarenessProvider] Awareness update reçu pour note ${noteId}:`, {
        updateSize: update.length,
        usersCount: awareness.getStates().size
      });

      // Notifier les listeners
      this.notifyListeners(noteId);
    } catch (error) {
      console.error('[YjsAwarenessProvider] Erreur lors de l\'application de l\'awareness update:', error);
    }
  }

  // ==========================================================================
  // Gestion des notes
  // ==========================================================================

  /**
   * Rejoindre une note et initialiser l'awareness
   * 
   * @param noteId - ID de la note
   * @param ydoc - Document Y.js associé
   * @param initialState - État initial de l'utilisateur (name, color)
   */
  public joinNote(noteId: string, ydoc: Y.Doc, initialState: { name: string; color?: string }): Awareness {
    // 🔥 IMPORTANT: Configurer les listeners Socket.IO AVANT de créer l'awareness
    this.setupSocketListeners();
    
    // Vérifier si déjà connecté
    if (this.awarenessMap.has(noteId)) {
      console.warn('[YjsAwarenessProvider] Déjà connecté à la note:', noteId);
      return this.awarenessMap.get(noteId)!;
    }

    // Créer l'instance Awareness
    const awareness = new Awareness(ydoc);

    // Générer une couleur aléatoire si non fournie
    const color = initialState.color || this.getRandomColor();

    // Définir l'état local initial
    awareness.setLocalState({
      name: initialState.name,
      color,
      cursor: null // Pas de curseur au démarrage
    } as AwarenessUserState);

    // Écouter les changements locaux pour les envoyer au serveur
    awareness.on('update', this.handleLocalAwarenessChange.bind(this, noteId));

    // Stocker l'awareness
    this.awarenessMap.set(noteId, awareness);

    console.log(`[YjsAwarenessProvider] ✅ Awareness créé pour note ${noteId} (clientID: ${awareness.clientID}, couleur: ${color})`);

    return awareness;
  }

  /**
   * Quitter une note et nettoyer l'awareness
   */
  public leaveNote(noteId: string): void {
    const awareness = this.awarenessMap.get(noteId);
    if (!awareness) return;

    // Supprimer l'état local (notifie les autres que l'utilisateur est parti)
    awareness.setLocalState(null);

    // Détruire l'awareness
    awareness.destroy();

    // Supprimer de la map
    this.awarenessMap.delete(noteId);
    this.listeners.delete(noteId);

    console.log(`[YjsAwarenessProvider] Awareness supprimé pour note ${noteId}`);
  }

  // ==========================================================================
  // État local
  // ==========================================================================

  /**
   * Mettre à jour l'état local de l'utilisateur (cursor, selection, etc.)
   */
  public setLocalState(noteId: string, partialState: Partial<AwarenessUserState>): void {
    const awareness = this.awarenessMap.get(noteId);
    if (!awareness) {
      console.warn('[YjsAwarenessProvider] Impossible de mettre à jour l\'état: note non suivie:', noteId);
      return;
    }

    // Fusionner avec l'état existant
    const currentState = awareness.getLocalState() as AwarenessUserState | null;
    const newState: AwarenessUserState = {
      ...currentState,
      ...partialState
    } as AwarenessUserState;

    awareness.setLocalState(newState);
  }

  /**
   * Récupérer l'état awareness actuel pour une note
   */
  public getAwarenessState(noteId: string): AwarenessState | null {
    const awareness = this.awarenessMap.get(noteId);
    if (!awareness) return null;

    const users = new Map<number, AwarenessUserState>();
    awareness.getStates().forEach((state, clientId) => {
      if (state && typeof state === 'object') {
        users.set(clientId, state as AwarenessUserState);
      }
    });

    return {
      users,
      userCount: users.size
    };
  }

  // ==========================================================================
  // Listeners
  // ==========================================================================

  /**
   * S'abonner aux changements d'awareness pour une note
   */
  public onAwarenessChange(noteId: string, callback: (state: AwarenessState) => void): () => void {
    if (!this.listeners.has(noteId)) {
      this.listeners.set(noteId, new Set());
    }

    this.listeners.get(noteId)!.add(callback);

    // Retourner une fonction de désabonnement
    return () => {
      this.listeners.get(noteId)?.delete(callback);
    };
  }

  private notifyListeners(noteId: string): void {
    const state = this.getAwarenessState(noteId);
    if (!state) return;

    const callbacks = this.listeners.get(noteId);
    if (!callbacks) return;

    callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[YjsAwarenessProvider] Erreur dans le callback listener:', error);
      }
    });
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private handleLocalAwarenessChange(noteId: string, data: { added: number[], updated: number[], removed: number[] }, origin: string): void {
    // Ignorer les changements distants (déjà appliqués)
    if (origin === 'remote') return;

    const awareness = this.awarenessMap.get(noteId);
    if (!awareness) return;

    try {
      // Encoder l'update et l'envoyer au serveur
      const update = encodeAwarenessUpdate(awareness, [...data.added, ...data.updated, ...data.removed]);

      console.log(`📤 [YjsAwarenessProvider] Émission awareness-update pour note ${noteId}:`, {
        added: data.added,
        updated: data.updated,
        removed: data.removed,
        updateSize: update.length,
        localState: awareness.getLocalState()
      });

      socketService.emit('awareness-update', {
        noteId,
        update: Array.from(update) // Uint8Array → number[]
      });

      // Notifier les listeners locaux
      this.notifyListeners(noteId);
    } catch (error) {
      console.error('[YjsAwarenessProvider] Erreur lors de l\'envoi de l\'awareness update:', error);
    }
  }

  private getRandomColor(): string {
    return this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
  }

  // ==========================================================================
  // Cleanup global
  // ==========================================================================

  /**
   * Nettoyer toutes les awareness (pour tests ou logout)
   */
  public destroy(): void {
    this.awarenessMap.forEach((awareness, noteId) => {
      this.leaveNote(noteId);
    });

    this.awarenessMap.clear();
    this.listeners.clear();

    console.log('[YjsAwarenessProvider] Toutes les awareness ont été détruites');
  }
}

// Export singleton instance
export const YjsAwarenessProvider = YjsAwarenessProviderClass.getInstance();
