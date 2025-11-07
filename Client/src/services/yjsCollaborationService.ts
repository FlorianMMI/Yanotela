/**
 * 📦 YjsCollaborationService
 * 
 * Service singleton qui gère la synchronisation collaborative temps réel via Yjs.
 * 
 * RESPONSABILITÉS :
 * - ✅ Créer et gérer les Y.Doc par note (un Y.Doc = un document Yjs partagé)
 * - ✅ Encoder/décoder les updates Yjs pour le réseau
 * - ✅ Éviter les doublons d'updates (anti-ping-pong natif Yjs)
 * - ✅ Gérer la persistence (snapshots périodiques)
 * - ✅ Synchroniser avec socketService existant
 * - ✅ Gérer les reconnexions et synchronisation des états manquants
 * 
 * INTÉGRATION :
 * - Utilise socketService.ts pour la couche réseau (WebSocket)
 * - Expose les Y.Doc aux composants React via hooks
 * - Compatible avec @lexical/yjs pour intégration Lexical
 */

import * as Y from 'yjs';
import type {
  YjsUpdate,
  YjsUpdateSerialized,
  YjsSnapshot,
  YjsServiceConfig,
  CollaborationState,
  YjsStateVector,
} from '@/type/Yjs';
import { socketService } from './socketService';

/**
 * Configuration par défaut du service
 */
const DEFAULT_CONFIG: Required<YjsServiceConfig> = {
  saveInterval: 5000, // Sauvegarder en DB toutes les 5 secondes
  snapshotInterval: 60000, // Créer un snapshot toutes les 60 secondes
  debug: true, // 🔥 DEBUG: toujours actif pour diagnostiquer
  maxSnapshots: 10, // Garder max 10 snapshots en mémoire par note
  autoSync: true,
};

/**
 * 🔧 Service de collaboration Yjs - SINGLETON
 */
class YjsCollaborationService {
  private static instance: YjsCollaborationService | null = null;

  // 📚 Map de tous les Y.Doc actifs (noteId -> Y.Doc)
  private documents: Map<string, Y.Doc> = new Map();

  // 📸 Map des snapshots par note (noteId -> Array<YjsSnapshot>)
  private snapshots: Map<string, YjsSnapshot[]> = new Map();

  // ⏱️ Timers pour les sauvegardes automatiques
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();

  // ⏱️ Timers pour les snapshots automatiques
  private snapshotTimers: Map<string, NodeJS.Timeout> = new Map();

  // ⚙️ Configuration
  private config: Required<YjsServiceConfig> = DEFAULT_CONFIG;

  // 🔄 File d'attente des updates pendant déconnexion
  private updateQueue: Map<string, YjsUpdate[]> = new Map();

  // 📊 États de collaboration par note
  private states: Map<string, CollaborationState> = new Map();

  private constructor() {
    this.log('✅ YjsCollaborationService initialisé');
    // Ne PAS appeler setupSocketListeners() ici car le socket n'est pas encore connecté
    // Les listeners seront configurés dans useYjsDocument après connexion
  }

  /**
   * 🔌 Configurer les listeners Socket.IO pour Yjs
   * ⚠️ Appeler cette méthode APRÈS connexion du socket (dans useYjsDocument par exemple)
   */
  setupSocketListeners(): void {
    this.log('🔌 Configuration des listeners Socket.IO pour Yjs');

    // Écouter les updates Yjs des autres utilisateurs
    socketService.onYjsUpdate((serialized) => {
      this.log(`📥 Réception update Yjs pour note: ${serialized.noteId}`);
      this.applyRemoteUpdate(serialized);
    });

    // Écouter l'état initial au joinNote
    socketService.onYjsInitialState((data) => {
      if (data.yjsState && data.yjsState.length > 0) {
        const ydoc = this.getOrCreateDocument(data.noteId);
        const state = new Uint8Array(data.yjsState);
        Y.applyUpdate(ydoc, state, 'remote');
        this.log(`✅ État initial Yjs appliqué pour note: ${data.noteId}`);
      }
    });

    // Écouter les réponses de synchronisation
    socketService.onYjsSyncResponse((response) => {
      if (!response.success) {
        this.log(`❌ Échec synchronisation pour note: ${response.noteId}`);
        return;
      }

      const ydoc = this.documents.get(response.noteId);
      if (!ydoc) return;

      // Appliquer l'état complet si fourni
      if (response.fullState && response.fullState.length > 0) {
        const state = new Uint8Array(response.fullState);
        Y.applyUpdate(ydoc, state, 'remote');
        this.log(`✅ État complet appliqué pour note: ${response.noteId}`);
      }

      // Appliquer les updates manquants
      if (response.missingUpdates && response.missingUpdates.length > 0) {
        response.missingUpdates.forEach((serialized) => {
          const update = new Uint8Array(serialized.update);
          Y.applyUpdate(ydoc, update, 'remote');
        });
        this.log(`✅ ${response.missingUpdates.length} updates manquants appliqués`);
      }
    });

    this.log('✅ Listeners Socket.IO configurés');
  }

  /**
   * Obtenir l'instance singleton
   */
  static getInstance(): YjsCollaborationService {
    if (!YjsCollaborationService.instance) {
      YjsCollaborationService.instance = new YjsCollaborationService();
    }
    return YjsCollaborationService.instance;
  }

  /**
   * Configurer le service
   */
  configure(config: Partial<YjsServiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('⚙️ Configuration mise à jour:', this.config);
  }

  /**
   * 🆕 Créer ou obtenir un Y.Doc pour une note
   * 
   * @param noteId - ID unique de la note
   * @param initialContent - Contenu initial optionnel (pour migration)
   * @returns Le Y.Doc associé à la note
   */
  getOrCreateDocument(noteId: string, initialContent?: string): Y.Doc {
    // Si le document existe déjà, le retourner
    if (this.documents.has(noteId)) {
      this.log(`♻️ Y.Doc existant récupéré pour note: ${noteId}`);
      return this.documents.get(noteId)!;
    }

    this.log(`🆕 Création nouveau Y.Doc pour note: ${noteId}`);

    // Créer un nouveau Y.Doc
    const ydoc = new Y.Doc();

    // ✅ LISTENER : Capturer les updates locaux pour les envoyer via réseau
    ydoc.on('update', (update: Uint8Array, origin: any) => {
      // Ne traiter que les updates d'origine locale (pas ceux reçus du réseau)
      // Accepter 'local', 'lexical-local', ou undefined comme origine locale
      if (origin === 'local' || origin === 'lexical-local' || origin === undefined) {
        this.log(`🟢 Update local détecté (origin: ${origin || 'undefined'}), taille: ${update.length} bytes`);
        this.handleLocalUpdate(noteId, update);
      } else if (origin !== 'remote') {
        // Log pour debug si l'origine est inattendue
        this.log(`⚠️ Update ignoré avec origine inconnue: ${origin}`);
      }
    });

    // Initialiser le contenu si fourni (cas de migration)
    if (initialContent) {
      this.initializeContent(ydoc, initialContent);
    }

    // Stocker le Y.Doc
    this.documents.set(noteId, ydoc);

    // Initialiser l'état de collaboration
    this.states.set(noteId, {
      noteId,
      isActive: true,
      userCount: 1,
      awarenessStates: new Map(),
      pendingUpdates: 0,
      connectionStatus: 'connected',
    });

    // Démarrer les timers de sauvegarde et snapshot
    this.startAutoSave(noteId);
    this.startAutoSnapshot(noteId);

    return ydoc;
  }

  /**
   * Obtenir le Y.Text d'une note (utilisé par Lexical)
   */
  getText(noteId: string): Y.Text | null {
    const ydoc = this.documents.get(noteId);
    if (!ydoc) {
      this.log(`❌ Y.Doc introuvable pour note: ${noteId}`);
      return null;
    }
    return ydoc.getText('content');
  }

  /**
   * Initialiser le contenu d'un Y.Doc (migration depuis contenu existant)
   */
  private initializeContent(ydoc: Y.Doc, content: string): void {
    const ytext = ydoc.getText('content');

    // ⚠️ IMPORTANT: Ne PAS initialiser si le Y.Text a déjà du contenu
    // (pour éviter d'écraser l'état Yjs chargé depuis la BDD)
    if (ytext.length > 0) {
      this.log('⚠️ Y.Text a déjà du contenu, initialisation ignorée');
      return;
    }

    ydoc.transact(() => {
      // Essayer de parser comme JSON Lexical d'abord
      try {
        const parsed = JSON.parse(content);
        // Si c'est du JSON Lexical, extraire le texte brut
        if (parsed.root && parsed.root.children) {
          const text = this.extractTextFromLexical(parsed);
          if (text.length > 0) {
            ytext.insert(0, text);
            this.log(`✅ Contenu Lexical parsé et inséré (${text.length} caractères)`);
          }
        } else {
          // Sinon insérer tel quel
          if (content.length > 0) {
            ytext.insert(0, content);
          }
        }
      } catch {
        // Si ce n'est pas du JSON, insérer comme texte brut
        if (content.length > 0) {
          ytext.insert(0, content);
          this.log(`✅ Contenu texte brut inséré (${content.length} caractères)`);
        }
      }
    }, 'local');
  }

  /**
   * Extraire le texte brut d'un état Lexical JSON
   */
  private extractTextFromLexical(state: any): string {
    let text = '';
    
    const traverse = (node: any) => {
      if (node.text) {
        text += node.text;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    if (state.root && state.root.children) {
      state.root.children.forEach(traverse);
    }

    return text;
  }

  /**
   * 📤 Gérer un update local (émis par l'utilisateur)
   * 
   * Cette fonction est appelée automatiquement quand Yjs détecte un changement local.
   * Elle encode l'update et le prépare pour l'envoi réseau.
   */
  private handleLocalUpdate(noteId: string, update: Uint8Array): void {
    this.log(`📤 Update local détecté pour note: ${noteId} (${update.length} bytes)`);

    const yjsUpdate: YjsUpdate = {
      update,
      noteId,
      timestamp: Date.now(),
      origin: 'local',
    };

    // Sérialiser pour l'envoi réseau (Uint8Array -> Array)
    const serialized: YjsUpdateSerialized = {
      update: Array.from(update),
      noteId,
      timestamp: yjsUpdate.timestamp,
    };

    // Émettre via socketService (sera implémenté dans TODO 3)
    this.emitUpdate(serialized);

    // Marquer comme update en attente de sauvegarde
    const state = this.states.get(noteId);
    if (state) {
      state.pendingUpdates++;
    }
  }

  /**
   * 📥 Appliquer un update reçu du réseau
   * 
   * @param serialized - Update sérialisé reçu via WebSocket
   */
  applyRemoteUpdate(serialized: YjsUpdateSerialized): void {
    const { noteId, update: updateArray } = serialized;

    const ydoc = this.documents.get(noteId);
    if (!ydoc) {
      this.log(`⚠️ Tentative d'appliquer update sur note inexistante: ${noteId}`);
      // Mettre en queue pour plus tard
      if (!this.updateQueue.has(noteId)) {
        this.updateQueue.set(noteId, []);
      }
      this.updateQueue.get(noteId)!.push({
        update: new Uint8Array(updateArray),
        noteId,
        timestamp: serialized.timestamp,
        origin: 'remote',
      });
      return;
    }

    this.log(`📥 Application update distant pour note: ${noteId}`);

    // Convertir Array -> Uint8Array
    const update = new Uint8Array(updateArray);

    // ✅ ANTI-DOUBLON NATIF YJS : Yjs gère automatiquement les doublons
    // Si l'update a déjà été appliqué, Yjs l'ignorera silencieusement
    Y.applyUpdate(ydoc, update, 'remote');

    this.log(`✅ Update distant appliqué avec succès`);
  }

  /**
   * 📡 Émettre un update via le réseau (socketService)
   * Cette méthode sera connectée au socketService dans TODO 3
   */
  private emitUpdate(serialized: YjsUpdateSerialized): void {
    // ✅ CONNEXION ACTIVE : Utiliser socketService pour émettre via WebSocket
    if (socketService.isConnected()) {
      socketService.emitYjsUpdate(serialized);
      this.log(`📡 Update Yjs émis via WebSocket pour note: ${serialized.noteId}`);
    } else {
      this.log(`⚠️ Socket non connecté, update mis en queue`);
      // Mettre en queue pour envoi ultérieur
      if (!this.updateQueue.has(serialized.noteId)) {
        this.updateQueue.set(serialized.noteId, []);
      }
      this.updateQueue.get(serialized.noteId)!.push({
        update: new Uint8Array(serialized.update),
        noteId: serialized.noteId,
        timestamp: serialized.timestamp,
        origin: 'local',
      });
    }
  }

  /**
   * 📸 Créer un snapshot de l'état actuel d'une note
   */
  createSnapshot(noteId: string): YjsSnapshot | null {
    const ydoc = this.documents.get(noteId);
    if (!ydoc) return null;

    const snapshot: YjsSnapshot = {
      state: Y.encodeStateAsUpdate(ydoc),
      noteId,
      timestamp: Date.now(),
    };

    // Stocker le snapshot
    if (!this.snapshots.has(noteId)) {
      this.snapshots.set(noteId, []);
    }

    const snapshots = this.snapshots.get(noteId)!;
    snapshots.push(snapshot);

    // Limiter le nombre de snapshots en mémoire
    if (snapshots.length > this.config.maxSnapshots) {
      snapshots.shift(); // Supprimer le plus ancien
    }

    this.log(`📸 Snapshot créé pour note: ${noteId} (${snapshot.state.length} bytes)`);

    return snapshot;
  }

  /**
   * ⏮️ Restaurer un snapshot
   */
  restoreSnapshot(noteId: string, timestamp: number): boolean {
    const snapshots = this.snapshots.get(noteId);
    if (!snapshots) return false;

    const snapshot = snapshots.find((s) => s.timestamp === timestamp);
    if (!snapshot) {
      this.log(`❌ Snapshot introuvable: ${timestamp}`);
      return false;
    }

    // Créer un nouveau Y.Doc avec le snapshot
    const newDoc = new Y.Doc();
    Y.applyUpdate(newDoc, snapshot.state);

    // Remplacer le Y.Doc actuel
    const oldDoc = this.documents.get(noteId);
    if (oldDoc) {
      oldDoc.destroy();
    }

    this.documents.set(noteId, newDoc);
    this.log(`✅ Snapshot restauré: ${new Date(timestamp).toISOString()}`);

    return true;
  }

  /**
   * 💾 Démarrer la sauvegarde automatique
   */
  private startAutoSave(noteId: string): void {
    if (this.saveTimers.has(noteId)) {
      clearInterval(this.saveTimers.get(noteId));
    }

    const timer = setInterval(() => {
      this.saveToDatabase(noteId);
    }, this.config.saveInterval);

    this.saveTimers.set(noteId, timer);
  }

  /**
   * 📸 Démarrer les snapshots automatiques
   */
  private startAutoSnapshot(noteId: string): void {
    if (this.snapshotTimers.has(noteId)) {
      clearInterval(this.snapshotTimers.get(noteId));
    }

    const timer = setInterval(() => {
      this.createSnapshot(noteId);
    }, this.config.snapshotInterval);

    this.snapshotTimers.set(noteId, timer);
  }

  /**
   * 💾 Sauvegarder l'état Yjs en base de données
   * (Sera connecté au backend dans TODO 8)
   */
  private async saveToDatabase(noteId: string): Promise<void> {
    const state = this.states.get(noteId);
    if (!state || state.pendingUpdates === 0) {
      return; // Rien à sauvegarder
    }

    const snapshot = this.createSnapshot(noteId);
    if (!snapshot) return;

    this.log(`💾 Sauvegarde en DB pour note: ${noteId}`);

    // 🔗 CONNECTION POINT : API call vers le backend
    // Sera implémenté dans TODO 8 (yjsController)
    try {
      // await fetch('/api/yjs/save', { ... })
      state.pendingUpdates = 0;
      this.log(`✅ Sauvegarde réussie`);
    } catch (error) {
      this.log(`❌ Erreur sauvegarde:`, error);
    }
  }

  /**
   * 📂 Charger l'état Yjs depuis la base de données
   */
  async loadFromDatabase(noteId: string): Promise<boolean> {
    this.log(`📂 Chargement état Yjs pour note: ${noteId}`);

    // 🔗 CONNECTION POINT : API call vers le backend
    // Sera implémenté dans TODO 8
    try {
      // const response = await fetch(`/api/yjs/load/${noteId}`);
      // const { yjsState } = await response.json();
      
      // if (yjsState) {
      //   const ydoc = this.getOrCreateDocument(noteId);
      //   Y.applyUpdate(ydoc, new Uint8Array(yjsState));
      //   return true;
      // }

      return false;
    } catch (error) {
      this.log(`❌ Erreur chargement:`, error);
      return false;
    }
  }

  /**
   * 🔄 Synchroniser l'état au reconnect (envoyer state vector)
   */
  syncOnReconnect(noteId: string): void {
    const ydoc = this.documents.get(noteId);
    if (!ydoc) return;

    // Créer un state vector (représente ce qu'on a déjà)
    const stateVector = Y.encodeStateVector(ydoc);

    this.log(`🔄 Synchronisation reconnexion pour note: ${noteId}`);

    // ✅ Envoyer au serveur via socketService
    socketService.requestYjsSync(noteId, Array.from(stateVector));

    // Appliquer les updates en queue
    const queue = this.updateQueue.get(noteId);
    if (queue && queue.length > 0) {
      this.log(`📦 Application des ${queue.length} updates en queue`);
      queue.forEach((update) => {
        Y.applyUpdate(ydoc, update.update, 'remote');
      });
      this.updateQueue.delete(noteId);
    }
  }

  /**
   * 🚪 Nettoyer et détruire un Y.Doc (quand on quitte la note)
   */
  destroyDocument(noteId: string): void {
    this.log(`🚪 Destruction Y.Doc pour note: ${noteId}`);

    // Sauvegarder une dernière fois
    this.saveToDatabase(noteId);

    // Nettoyer les timers
    if (this.saveTimers.has(noteId)) {
      clearInterval(this.saveTimers.get(noteId));
      this.saveTimers.delete(noteId);
    }

    if (this.snapshotTimers.has(noteId)) {
      clearInterval(this.snapshotTimers.get(noteId));
      this.snapshotTimers.delete(noteId);
    }

    // Détruire le Y.Doc
    const ydoc = this.documents.get(noteId);
    if (ydoc) {
      ydoc.destroy();
      this.documents.delete(noteId);
    }

    // Nettoyer les états
    this.states.delete(noteId);
    this.snapshots.delete(noteId);
    this.updateQueue.delete(noteId);

    this.log(`✅ Y.Doc détruit et nettoyé`);
  }

  /**
   * 📊 Obtenir l'état de collaboration d'une note
   */
  getCollaborationState(noteId: string): CollaborationState | null {
    return this.states.get(noteId) || null;
  }

  /**
   * 📋 Obtenir tous les snapshots d'une note
   */
  getSnapshots(noteId: string): YjsSnapshot[] {
    return this.snapshots.get(noteId) || [];
  }

  /**
   * 🧹 Nettoyer tous les documents (au démont du service)
   */
  destroyAll(): void {
    this.log('🧹 Nettoyage complet du service Yjs');
    this.documents.forEach((_, noteId) => {
      this.destroyDocument(noteId);
    });
  }

  /**
   * 🐛 Logger avec préfixe
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      
    }
  }
}

// Export du singleton
export const yjsCollaborationService = YjsCollaborationService.getInstance();
export default yjsCollaborationService;
