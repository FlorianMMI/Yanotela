'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState } from 'react';
import { $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_NORMAL } from 'lexical';
import { YjsAwarenessProvider } from '@/services/yjsAwarenessProvider';
import type { AwarenessUserState, AwarenessState } from '@/services/yjsAwarenessProvider';
import { socketService } from '@/services/socketService';

interface CursorPluginProps {
  noteId: string;
  currentUserId: number;
  currentUserPseudo: string;
}

interface CursorPosition {
  x: number;
  y: number;
  height: number;
}

interface TypingUser {
  userId: number;
  pseudo: string;
}

export default function CursorPlugin({ noteId, currentUserId, currentUserPseudo }: CursorPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [remoteCursors, setRemoteCursors] = useState<Map<number, AwarenessUserState>>(new Map());
  const [cursorPositions, setCursorPositions] = useState<Map<number, CursorPosition>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingUser>>(new Map());
  const editorRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    editorRootRef.current = editor.getRootElement();
  }, [editor]);

  // ✅ NOUVEAU: Écouter les événements de frappe
  useEffect(() => {
    console.log('⌨️ CursorPlugin: Enregistrement du listener typing');
    
    const handleUserTyping = (data: { noteId: string; isTyping: boolean; userId: number; pseudo: string }) => {
      // Ignorer les événements d'autres notes
      if (data.noteId !== noteId) return;
      
      // ✅ CORRECTION: Ignorer nos propres événements en comparant l'userId
      if (data.userId === currentUserId) {
        console.log('[CursorPlugin] ⏭️ Événement typing ignoré (c\'est moi)', { myId: currentUserId, eventId: data.userId });
        return;
      }

      console.log(`⌨️ [CursorPlugin] ${data.pseudo} isTyping:`, data.isTyping);

      setTypingUsers((prev) => {
        const updated = new Map(prev);
        if (data.isTyping) {
          updated.set(data.userId, { userId: data.userId, pseudo: data.pseudo });
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
    };

    socketService.onUserTyping(handleUserTyping);

    return () => {
      console.log('⌨️ CursorPlugin: Nettoyage du listener typing');
      socketService.off('userTyping', handleUserTyping);
    };
  }, [noteId, currentUserPseudo, currentUserId]);

  useEffect(() => {
    console.log('🎯 CursorPlugin: Enregistrement des listeners awareness');
    
    const unsubscribe = YjsAwarenessProvider.onAwarenessChange(noteId, (state: AwarenessState) => {
      console.log('📍 [CursorPlugin] Awareness state reçu:', {
        userCount: state.userCount,
        users: Array.from(state.users.entries()).map(([id, user]) => ({
          id,
          name: user.name,
          color: user.color,
          hasCursor: !!user.cursor,
          cursorOffset: user.cursor?.anchor
        }))
      });
      
      const filtered = new Map<number, AwarenessUserState>();
      state.users.forEach((userState, clientId) => {
        console.log(`👤 User ${userState.name} (clientId: ${clientId}) - Mon pseudo: ${currentUserPseudo}`);
        if (userState.name !== currentUserPseudo) {
          filtered.set(clientId, userState);
          console.log(`✅ Curseur ajouté pour ${userState.name}`);
        } else {
          console.log(`⏭️ Curseur ignoré (c'est moi)`);
        }
      });
      
      console.log(`📊 Total curseurs distants: ${filtered.size}`);
      setRemoteCursors(filtered);
    });
    
    return () => {
      console.log('🎯 CursorPlugin: Nettoyage des listeners awareness');
      unsubscribe();
    };
  }, [noteId, currentUserPseudo]);

  useEffect(() => {
    const updateCursor = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection)) {
          YjsAwarenessProvider.setLocalState(noteId, { cursor: null });
          console.log('📤 [CursorPlugin] Curseur désactivé (pas de sélection)');
          return;
        }

        const anchor = selection.anchor;
        const focus = selection.focus;

        YjsAwarenessProvider.setLocalState(noteId, {
          cursor: {
            anchor: anchor.offset,
            head: focus.offset,
          }
        });
        console.log(`📤 [CursorPlugin] Curseur émis: offset ${anchor.offset}`);
      });
    };

    const unregister = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateCursor();
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );

    updateCursor();

    return unregister;
  }, [editor, noteId]);

  useEffect(() => {
    if (!editorRootRef.current || remoteCursors.size === 0) {
      setCursorPositions(new Map());
      return;
    }

    const positions = new Map<number, CursorPosition>();

    remoteCursors.forEach((userState, clientId) => {
      if (!userState.cursor) return;

      try {
        // Obtenir le nœud texte à partir de l'offset Yjs
        const editorRoot = editorRootRef.current!;
        const textContent = editorRoot.textContent || '';
        const offset = Math.min(userState.cursor.anchor, textContent.length);

        // Créer un range à partir de l'offset
        const range = document.createRange();
        let currentOffset = 0;
        let found = false;

        // Parcourir tous les nœuds texte pour trouver celui qui contient l'offset
        const walker = document.createTreeWalker(
          editorRoot,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        while ((node = walker.nextNode())) {
          const textNode = node as Text;
          const nodeLength = textNode.length;

          if (currentOffset + nodeLength >= offset) {
            // L'offset est dans ce nœud
            const localOffset = offset - currentOffset;
            range.setStart(textNode, Math.min(localOffset, nodeLength));
            range.setEnd(textNode, Math.min(localOffset, nodeLength));
            found = true;
            break;
          }

          currentOffset += nodeLength;
        }

        if (found) {
          const rect = range.getBoundingClientRect();
          const editorRect = editorRoot.getBoundingClientRect();

          positions.set(clientId, {
            x: rect.left - editorRect.left + editorRoot.scrollLeft,
            y: rect.top - editorRect.top + editorRoot.scrollTop,
            height: rect.height || 20,
          });

          console.log(`📍 Curseur ${userState.name} à l'offset ${offset}:`, {
            x: rect.left - editorRect.left,
            y: rect.top - editorRect.top,
          });
        }
      } catch (err) {
        console.warn('Erreur calcul position curseur:', err);
      }
    });

    setCursorPositions(positions);
  }, [remoteCursors]);

  // Recalculer les positions quand le contenu change
  useEffect(() => {
    if (remoteCursors.size === 0) return;

    const updatePositions = () => {
      if (!editorRootRef.current) return;

      const positions = new Map<number, CursorPosition>();

      remoteCursors.forEach((userState, clientId) => {
        if (!userState.cursor) return;

        try {
          const editorRoot = editorRootRef.current!;
          const textContent = editorRoot.textContent || '';
          const offset = Math.min(userState.cursor.anchor, textContent.length);

          const range = document.createRange();
          let currentOffset = 0;
          let found = false;

          const walker = document.createTreeWalker(
            editorRoot,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while ((node = walker.nextNode())) {
            const textNode = node as Text;
            const nodeLength = textNode.length;

            if (currentOffset + nodeLength >= offset) {
              const localOffset = offset - currentOffset;
              range.setStart(textNode, Math.min(localOffset, nodeLength));
              range.setEnd(textNode, Math.min(localOffset, nodeLength));
              found = true;
              break;
            }

            currentOffset += nodeLength;
          }

          if (found) {
            const rect = range.getBoundingClientRect();
            const editorRect = editorRoot.getBoundingClientRect();

            positions.set(clientId, {
              x: rect.left - editorRect.left + editorRoot.scrollLeft,
              y: rect.top - editorRect.top + editorRoot.scrollTop,
              height: rect.height || 20,
            });
          }
        } catch (err) {
          // Ignorer les erreurs silencieusement pour ne pas polluer la console
        }
      });

      setCursorPositions(positions);
    };

    // Écouter les changements d'éditeur
    const unregister = editor.registerUpdateListener(() => {
      // Throttle pour éviter trop de recalculs
      requestAnimationFrame(updatePositions);
    });

    return unregister;
  }, [editor, remoteCursors]);

  return (
    <>
      {Array.from(remoteCursors.entries()).map(([clientId, userState]) => {
        const position = cursorPositions.get(clientId);
        if (!userState.cursor || !position) return null;

        // Vérifier si cet utilisateur est en train de taper
        const isTyping = Array.from(typingUsers.values()).some(
          (typingUser) => typingUser.pseudo === userState.name
        );

        return (
          <div
            key={clientId}
            style={{
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '2px',
                height: `${position.height}px`,
                backgroundColor: userState.color,
                animation: 'cursor-blink 1s infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-24px',
                left: '4px',
                backgroundColor: userState.color,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{userState.name}</span>
              {isTyping && (
                <span style={{ display: 'flex', gap: '2px', marginLeft: '2px' }}>
                  <span
                    style={{
                      width: '3px',
                      height: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animation: 'typing-dot 1s infinite',
                      animationDelay: '0s',
                    }}
                  />
                  <span
                    style={{
                      width: '3px',
                      height: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animation: 'typing-dot 1s infinite',
                      animationDelay: '0.2s',
                    }}
                  />
                  <span
                    style={{
                      width: '3px',
                      height: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animation: 'typing-dot 1s infinite',
                      animationDelay: '0.4s',
                    }}
                  />
                </span>
              )}
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes cursor-blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
