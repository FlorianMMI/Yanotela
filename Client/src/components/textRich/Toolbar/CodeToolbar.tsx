import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import { ToolbarButton } from './ToolbarButton';

export function CodeToolbar() {
    const [editor] = useLexicalComposerContext();

    const handleCode = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
    };

    return (
        <ToolbarButton onClick={handleCode} title="Code">
            <code>{'<>'}</code>
        </ToolbarButton>
    );
}
