import React from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// @ts-ignore
import { $createHeadingNode, $setBlocksType } from '@lexical/rich-text';
import { $getSelection, $isRangeSelection } from 'lexical';
import { ToolbarButton } from './ToolbarButton';

export function HeadingToolbar() {
    const [editor] = useLexicalComposerContext();
    const [fontSize, setFontSize] = React.useState(16);


    // Applique la taille de police sur le bloc courant (heading ou paragraphe)
    const applyFontSize = (size: number) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const nodes = selection.getNodes();
                nodes.forEach(node => {
                    if (typeof node.setStyle === 'function') {
                        node.setStyle(`font-size: ${size}px;`);
                    }
                });
            }
        });
    };

    const handleFontSizeChange = (delta: number) => {
        setFontSize(prev => {
            let newSize = prev + delta;
            if (newSize < 12) newSize = 12;
            if (newSize > 36) newSize = 36;
            applyFontSize(newSize);
            return newSize;
        });
    };

    return (
        <div className="flex items-center gap-2">
            <span className="font-bold">Taille :</span>
            <button
                type="button"
                className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                onClick={() => handleFontSizeChange(-2)}
                disabled={fontSize <= 12}
            >
                -
            </button>
            <span className="w-8 text-center">{fontSize}px</span>
            <button
                type="button"
                className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                onClick={() => handleFontSizeChange(2)}
                disabled={fontSize >= 36}
            >
                +
            </button>
        </div>
    );
}
