/**
 * Types TypeScript pour l'intégration Yjs dans Yanotela
 * 
 * Ces types définissent la structure des updates, snapshots, et états de collaboration
 * utilisés par le service YjsCollaborationService et les composants React.
 */

/**
 * Update Yjs brut encodé en Uint8Array
 */
export interface YjsUpdate {
  /** L'update Yjs binaire encodé */
  update: Uint8Array;
  /** ID de la note concernée */
  noteId: string;
  /** Timestamp de création de l'update */
  timestamp: number;
  /** Origine de l'update ('local' ou 'remote') */
  origin?: 'local' | 'remote';
}

/**
 * Update Yjs sérialisé pour transmission réseau
 * (Uint8Array converti en Array pour JSON.stringify)
 */
export interface YjsUpdateSerialized {
  /** L'update converti en Array pour JSON */
  update: number[];
  /** ID de la note concernée */
  noteId: string;
  /** Timestamp de création */
  timestamp: number;
  /** ID de l'utilisateur émetteur */
  userId?: number;
  /** Pseudo de l'utilisateur émetteur */
  pseudo?: string;
}

/**
 * Snapshot complet de l'état Yjs d'une note
 */
export interface YjsSnapshot {
  /** État complet du Y.Doc encodé */
  state: Uint8Array;
  /** ID de la note */
  noteId: string;
  /** Timestamp de création du snapshot */
  timestamp: number;
  /** Version/numéro de séquence optionnel */
  version?: number;
}

/**
 * État de l'awareness (conscience) d'un utilisateur
 * Utilisé pour afficher les curseurs, sélections, et indicateurs de présence
 */
export interface YjsAwarenessState {
  /** Informations sur l'utilisateur */
  user: {
    /** Pseudo de l'utilisateur */
    name: string;
    /** ID unique de l'utilisateur */
    id: number;
    /** Couleur assignée pour les curseurs/sélections */
    color: string;
  };
  /** Position du curseur (optionnel) */
  cursor?: {
    /** Index de position dans le texte */
    anchor: number;
    /** Index de fin si sélection */
    head: number;
  } | null;
  /** Indicateur de frappe en cours */
  isTyping?: boolean;
  /** Timestamp de dernière activité */
  lastActivity?: number;
}

/**
 * Map de tous les états d'awareness (clientId -> state)
 */
export type YjsAwarenessStates = Map<number, YjsAwarenessState>;

/**
 * État global de collaboration pour une note
 */
export interface CollaborationState {
  /** ID de la note */
  noteId: string;
  /** Document Yjs actif */
  isActive: boolean;
  /** Nombre d'utilisateurs connectés */
  userCount: number;
  /** États d'awareness de tous les utilisateurs */
  awarenessStates: YjsAwarenessStates;
  /** Dernier snapshot enregistré */
  lastSnapshot?: YjsSnapshot;
  /** Nombre d'updates non synchronisés (file d'attente) */
  pendingUpdates: number;
  /** Statut de connexion */
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

/**
 * Options de configuration du service Yjs
 */
export interface YjsServiceConfig {
  /** Intervalle de sauvegarde automatique en ms (défaut: 5000) */
  saveInterval?: number;
  /** Intervalle de création de snapshots en ms (défaut: 60000) */
  snapshotInterval?: number;
  /** Activer les logs de debug */
  debug?: boolean;
  /** Nombre maximum de snapshots à garder en mémoire */
  maxSnapshots?: number;
  /** Activer la synchronisation automatique */
  autoSync?: boolean;
}

/**
 * Événements émis par le service Yjs
 */
export type YjsServiceEvent =
  | { type: 'update'; data: YjsUpdate }
  | { type: 'snapshot'; data: YjsSnapshot }
  | { type: 'sync'; data: { noteId: string; success: boolean } }
  | { type: 'awareness-change'; data: YjsAwarenessStates }
  | { type: 'error'; data: { message: string; error: Error } };

/**
 * State vector Yjs pour la synchronisation incrémentale
 */
export interface YjsStateVector {
  /** State vector encodé */
  stateVector: Uint8Array;
  /** ID de la note */
  noteId: string;
}

/**
 * Réponse du serveur lors de la synchronisation
 */
export interface YjsSyncResponse {
  /** Updates manquants depuis le state vector */
  missingUpdates: YjsUpdateSerialized[];
  /** État complet si nécessaire (première connexion) */
  fullState?: number[];
  /** Success flag */
  success: boolean;
}
