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
import { $getRoot } from "lexical";
import type { EditorState } from 'lexical';
// Runtime import for EditorState methods (avoid TS type-only export issue)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LexicalRuntime: any = require('lexical');
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as Y from "yjs";

const theme = {
  // Votre theme existant
};

function onError(error: string | Error) {
  console.error(error);
}

interface CollaborativeEditorProps {
  noteId: string;
  isReadOnly: boolean;
  onContentChange?: (content: string) => void;
  initialEditorState?: string | null;
}

export default function CollaborativeEditor({
  noteId,
  isReadOnly,
  onContentChange,
  initialEditorState,
}: CollaborativeEditorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  
  // Références stables
  const providerRef = useRef<WebsocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const yjsDocMapRef = useRef<Map<string, Y.Doc>>(new Map());
  
  // ID stable pour l'éditeur
  const editorId = useMemo(() => `yanotela-note-${noteId}`, [noteId]);

  // Parse the serialized editor state but do NOT pass the raw object to Lexical's initialConfig,
  // because some Lexical internals expect an EditorState instance and may call methods like isEmpty().
  const parsedInitialState = useMemo(() => {
    if (typeof initialEditorState === 'string' && initialEditorState) {
      try {
        return JSON.parse(initialEditorState);
      } catch (e) {
        console.warn('[Editor] Failed to parse initialEditorState', e);
        return null;
      }
    }
    return null;
  }, [initialEditorState]);

  const initialConfig = useMemo(() => ({
    editorState: null, // keep null to avoid passing plain objects into Lexical internals
    namespace: editorId,
    theme,
    onError,
    nodes: [],
  }), [editorId]);

  // Factory pour créer le provider WebSocket
  const providerFactory = useCallback((id: string, yjsDocMap: Map<string, Y.Doc>): any => {
    console.log("[YJS] Creating provider for:", id);

    // Nettoyer l'ancien provider si nécessaire
    if (providerRef.current) {
      console.log("[YJS] Cleaning up old provider");
      try {
        providerRef.current.disconnect();
        providerRef.current.destroy();
      } catch (e) {
        console.warn("[YJS] Error cleaning up old provider:", e);
      }
      providerRef.current = null;
    }

    // Créer ou récupérer le document YJS
    let doc = yjsDocMap.get(id);
    if (!doc) {
      doc = new Y.Doc();
      yjsDocMap.set(id, doc);
      console.log("[YJS] New Y.Doc created for:", id);
    } else {
      console.log("[YJS] Reusing existing Y.Doc for:", id);
    }
    
    docRef.current = doc;
    yjsDocMapRef.current = yjsDocMap;

    // NE PAS créer manuellement le type YText
    // Lexical CollaborationPlugin le gère automatiquement
    console.log("[YJS] Y.Doc ready, waiting for Lexical to initialize types");
    
    // Créer le provider WebSocket
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      id,
      doc,
      {
        connect: true,
        WebSocketPolyfill: WebSocket as any,
        resyncInterval: 120000,
        maxBackoffTime: 10000,
        disableBc: false,
      }
    );

  providerRef.current = provider;

    // Event listeners pour le provider
    provider.on("status", (event: { status: string }) => {
      console.log("[YJS] WebSocket status:", event.status);
      const connected = event.status === "connected";
      setIsConnected(connected);
      
      if (!connected) {
        setIsSynced(false);
      }
    });

    provider.on("sync", (synced: boolean) => {
      console.log("[YJS] Document sync status:", synced);
      setIsSynced(synced);
      
      if (synced) {
        // Accéder au type YText de manière sûre après la sync
        const ytext = doc.getText('root');
        console.log("[YJS] Document synchronized, content length:", ytext?.length || 0);
      }
    });

    provider.on("connection-error", (error: any) => {
      console.error("[YJS] Connection error:", error);
      setIsConnected(false);
      setIsSynced(false);
    });

    provider.on("connection-close", (event: any) => {
      console.log("[YJS] Connection closed:", event?.code || 'unknown', event?.reason || 'no reason');
      setIsConnected(false);
      setIsSynced(false);
    });

    return provider as any;
  }, []);

  // Cleanup effect
  useEffect(() => {
    console.log("[YJS] Component mounted for note:", noteId);
    
    return () => {
      console.log("[YJS] Component unmounting, cleaning up for note:", noteId);
      
      if (providerRef.current) {
        try {
          providerRef.current.disconnect();
          providerRef.current.destroy();
        } catch (e) {
          console.warn("[YJS] Error during cleanup:", e);
        }
        providerRef.current = null;
      }
      
      if (docRef.current) {
        try {
          docRef.current.destroy();
        } catch (e) {
          console.warn("[YJS] Error destroying doc:", e);
        }
        docRef.current = null;
      }
    };
  }, [noteId]);

  // Gestion des changements d'éditeur
  const handleEditorChange = useCallback((editorState: EditorState) => {
    if (onContentChange && !isReadOnly && isSynced) {
      editorState.read(() => {
        try {
          const root = $getRoot();
          const textContent = root.getTextContent();
          
          if (textContent.trim() === '') {
            onContentChange('');
          } else {
            const serializedState = JSON.stringify(editorState.toJSON());
            onContentChange(serializedState);
          }
        } catch (error) {
          console.error("[Editor] Error reading editor state:", error);
        }
      });
    }
  }, [onContentChange, isReadOnly, isSynced]);

  return (
    <div className="relative bg-fondcardNote text-textcardNote p-4 rounded-lg flex flex-col min-h-[calc(100dvh-120px)] h-fit overflow-auto">
      {/* Indicateur de connexion amélioré */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-10">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            isConnected && isSynced
              ? "bg-green-500"
              : isConnected
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        <span className="text-xs font-medium text-textcardNote">
          {isConnected && isSynced
            ? "Synchronisé"
            : isConnected
            ? "Connexion..."
            : "Hors ligne"}
        </span>
      </div>

      <LexicalComposer initialConfig={initialConfig}>
        {/* If we have a serialized initial state from the API, apply it once the editor is available */}
        {parsedInitialState && (
          <InitialContentLoader serializedState={parsedInitialState} />
        )}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-placeholder="Commencez à écrire..."
              placeholder={
                <p className="absolute top-4 left-4 text-textcardNote select-none pointer-events-none">
                  Commencez à écrire...
                </p>
              }
              className={`h-full focus:outline-none mt-8 ${isReadOnly ? "cursor-not-allowed" : ""
                }`}
              contentEditable={!isReadOnly}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Plugin de collaboration Yjs */}
        <CollaborationPlugin
          id={editorId}
          providerFactory={providerFactory}
          shouldBootstrap={true}
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

function InitialContentLoader({ serializedState }: { serializedState: any }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!serializedState) return;

    try {
      // Convert serialized JSON into an EditorState instance and set it
  // Create an EditorState instance from the serialized JSON via runtime API
  const state = LexicalRuntime.EditorState.fromJSON(serializedState);
  editor.setEditorState(state);
    } catch (e) {
      console.warn('[Editor] Could not create EditorState from JSON', e);
      // Fallback: try to populate simple text content
      try {
        editor.update(() => {
          const root = $getRoot();
          // If serializedState contains plain text in root.children, try to extract
          if (serializedState && serializedState.root && Array.isArray(serializedState.root.children)) {
            // attempt basic reconstruction: clear and do nothing else (Lexical nodes require full mapping)
            // A more complete fallback would transform the serialized structure into Lexical nodes.
          }
        });
      } catch (err) {
        console.error('[Editor] Fallback editor update failed', err);
      }
    }
  }, [editor, serializedState]);

  return null;
}