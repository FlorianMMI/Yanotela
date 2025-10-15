import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import { ToolbarButton } from './ToolbarButton';

export function UndoRedoToolbar() {
    const [editor] = useLexicalComposerContext();

    const handleUndo = () => {
        editor.dispatchCommand(UNDO_COMMAND, undefined);
    };

    const handleRedo = () => {
        editor.dispatchCommand(REDO_COMMAND, undefined);
    };

    return (
        <>
            <ToolbarButton onClick={handleUndo} title="Annuler (Ctrl+Z)">
                <span>↶</span>
            </ToolbarButton>
            <ToolbarButton onClick={handleRedo} title="Rétablir (Ctrl+Y)">
                <span>↷</span>
            </ToolbarButton>
        </>
    );
}
