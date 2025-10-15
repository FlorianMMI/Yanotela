import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// @ts-ignore
import { $createHeadingNode } from '@lexical/rich-text';
import { $getSelection, $isRangeSelection } from 'lexical';
import { ToolbarButton } from './ToolbarButton';

export function HeadingToolbar() {
    const [editor] = useLexicalComposerContext();

    const handleHeading = (tag: 'h1' | 'h2' | 'h3') => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                // @ts-ignore
                selection.insertNodes([$createHeadingNode(tag)]);
            }
        });
    };

    return (
        <>
            <ToolbarButton onClick={() => handleHeading('h1')} title="Titre 1">
                <span className="font-bold">H1</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => handleHeading('h2')} title="Titre 2">
                <span className="font-bold">H2</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => handleHeading('h3')} title="Titre 3">
                <span className="font-bold">H3</span>
            </ToolbarButton>
        </>
    );
}
