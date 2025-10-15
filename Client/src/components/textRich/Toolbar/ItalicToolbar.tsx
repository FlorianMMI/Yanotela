import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { ToolbarButton } from './ToolbarButton';

export function ItalicToolbar() {
    const [editor] = useLexicalComposerContext();

    const handleItalic = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
    };

    return (
        <ToolbarButton onClick={handleItalic} title="Italique (Ctrl+I)">
            <em>I</em>
        </ToolbarButton>
    );
}
