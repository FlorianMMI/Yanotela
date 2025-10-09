"use client";

import React from "react";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { WebsocketProvider } from "y-websocket";
import { $getRoot, EditorState } from "lexical";
import * as Y from "yjs";



const theme = {
  // Votre theme existant
};

function onError(error: string | Error) {
  console.error(error);
}

// Helper pour gérer les documents Yjs
function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>): Y.Doc {
  let doc = yjsDocMap.get(id);
  
  if (doc === undefined) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  }
  
  return doc;
}

interface CollaborativeEditorProps {
  noteId: string;
  isReadOnly: boolean;
  onContentChange?: (content: string) => void;
}

export default function CollaborativeEditor({
  noteId,
  isReadOnly,
  onContentChange,
}: CollaborativeEditorProps) {
  const [isConnected, setIsConnected] = useState(false);
  
  // Référence stable pour le provider
  const providerRef = useRef<WebsocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  
  // ID stable pour l'éditeur - ne change jamais une fois défini
  const editorId = useMemo(() => `yanotela-note-${noteId}`, [noteId]);

  const initialConfig = useMemo(() => ({
    // CRITIQUE : editorState doit être null pour la collaboration YJS
    editorState: null,
    namespace: editorId,
    theme,
    onError,
    nodes: [],
  }), [editorId]);

  // Factory pour créer le provider WebSocket - VERSION SIMPLIFIÉE
  const providerFactory = useMemo(() => {
    return (id: string, yjsDocMap: Map<string, Y.Doc>): any => {
      console.log("Création du provider YJS pour:", id);

      // Vérifier si on a déjà un provider pour cet ID
      if (providerRef.current && docRef.current) {
        console.log("Provider existant trouvé, réutilisation");
        return providerRef.current;
      }

      // Créer ou récupérer le document
      let doc = yjsDocMap.get(id);
      if (!doc) {
        doc = new Y.Doc();
        yjsDocMap.set(id, doc);
        console.log("Nouveau document YJS créé pour:", id);
      } else {
        console.log("Document YJS existant réutilisé pour:", id);
      }
      docRef.current = doc;
      
      // Nettoyer l'ancien provider si nécessaire
      if (providerRef.current) {
        console.log("Nettoyage de l'ancien provider");
        providerRef.current.disconnect();
        providerRef.current.destroy();
      }
      
      const provider = new WebsocketProvider(
        "ws://localhost:1234",
        id,
        doc,
        {
          connect: true,
          WebSocketPolyfill: WebSocket,
          resyncInterval: 120000,
          maxBackoffTime: 10000,
          disableBc: false,
        }
      );

      // Stocker la référence
      providerRef.current = provider;

      // Écouter les changements de connexion
      provider.on("status", (event: { status: string }) => {
        console.log("Yjs WebSocket status:", event.status);
        setIsConnected(event.status === "connected");
      });

      provider.on("sync", (isSynced: boolean) => {
        console.log("Yjs document synced:", isSynced);
        // YJS gère automatiquement la synchronisation du contenu
        // Pas d'initialisation manuelle pour éviter les conflits
      });

      provider.on("connection-error", (event: Event) => {
        console.error("Yjs connection error:", event);
        setIsConnected(false);
      });

      provider.on("connection-close", (event: any) => {
        console.log("Yjs connection closed:", event);
        setIsConnected(false);
      });

      return provider;
    };
  }, [noteId]); // Supprimé initialContent des dépendances

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        console.log("Cleaning up provider for note:", noteId);
        providerRef.current.disconnect();
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, [noteId]);

  // Gestion des changements d'éditeur
  const handleEditorChange = useCallback((editorState: EditorState) => {
    if (onContentChange && !isReadOnly) {
      // Vérifier si l'éditeur est vide de manière sûre
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        
        if (textContent.trim() === '') {
          // L'éditeur est vide
          onContentChange('');
        } else {
          // L'éditeur a du contenu
          const serializedState = JSON.stringify(editorState.toJSON());
          onContentChange(serializedState);
        }
      });
    }
  }, [onContentChange, isReadOnly]);

  return (
    <div className="relative bg-fondcardNote text-textcardNote p-4 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-auto">
      {/* Indicateur de connexion */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs font-medium text-textcardNote">
          {isConnected ? "Synchronisé" : "Hors ligne"}
        </span>
      </div>

      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-placeholder="Commencez à écrire..."
              placeholder={
                <p className="absolute top-4 left-4 text-textcardNote select-none pointer-events-none">
                  Commencez à écrire...
                </p>
              }
              className={`h-full focus:outline-none mt-8 ${
                isReadOnly ? "cursor-not-allowed" : ""
              }`}
              contentEditable={!isReadOnly}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Plugin de collaboration Yjs - SANS initialEditorState */}
        <CollaborationPlugin
          id={editorId}
          providerFactory={providerFactory}
          shouldBootstrap={false}
        />

        {/* Plugin pour écouter les changements */}
        {onContentChange && !isReadOnly && (
          <OnChangePlugin onChange={handleEditorChange} />
        )}

        {/* Plugins historique uniquement si pas en lecture seule */}
        {!isReadOnly && <HistoryPlugin />}
      </LexicalComposer>
    </div>
  );
}