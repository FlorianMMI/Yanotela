import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { ToolbarButton } from './ToolbarButton';

export function BoldToolbar() {
    const [editor] = useLexicalComposerContext();

    const handleBold = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
    };

    return (
        <ToolbarButton onClick={handleBold} title="Gras (Ctrl+B)">
            <strong>B</strong>
        </ToolbarButton>
    );
}
