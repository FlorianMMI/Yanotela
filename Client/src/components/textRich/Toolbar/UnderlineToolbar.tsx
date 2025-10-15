import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { ToolbarButton } from './ToolbarButton';

export function UnderlineToolbar() {
    const [editor] = useLexicalComposerContext();

    const handleUnderline = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
    };

    return (
        <ToolbarButton onClick={handleUnderline} title="Souligné (Ctrl+U)">
            <u>U</u>
        </ToolbarButton>
    );
}
