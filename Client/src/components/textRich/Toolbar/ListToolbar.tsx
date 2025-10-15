import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// @ts-ignore
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { ToolbarButton } from './ToolbarButton';

export function ListToolbar() {
    const [editor] = useLexicalComposerContext();

    const handleBulletList = () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    };

    const handleNumberedList = () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    };

    return (
        <>
            <ToolbarButton onClick={handleBulletList} title="Liste à puces">
                <span>• Liste</span>
            </ToolbarButton>
            <ToolbarButton onClick={handleNumberedList} title="Liste numérotée">
                <span>1. Liste</span>
            </ToolbarButton>
        </>
    );
}
