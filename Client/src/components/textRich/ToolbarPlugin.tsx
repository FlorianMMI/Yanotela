import React, { useCallback, useEffect, useState } from 'react';
// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
    FORMAT_TEXT_COMMAND, 
    UNDO_COMMAND, 
    REDO_COMMAND,
    $getSelection,
    $isRangeSelection,
    SELECTION_CHANGE_COMMAND,
    CAN_UNDO_COMMAND,
    CAN_REDO_COMMAND,
    $createParagraphNode,
} from 'lexical';
// @ts-ignore
import { $isListNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
// @ts-ignore
import { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';
// @ts-ignore
import { $getNearestNodeOfType, mergeRegister, $setBlocksType } from '@lexical/utils';

export default function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const [blockType, setBlockType] = useState('paragraph');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [fontSize, setFontSize] = useState('16px');

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            // Mise à jour des états de formatage
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsCode(selection.hasFormat('code'));

            // Détection du type de bloc (paragraph, h1, h2, liste, etc.)
            const anchorNode = selection.anchor.getNode();
            const element = anchorNode.getKey() === 'root' 
                ? anchorNode 
                : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);

            if (elementDOM !== null) {
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType(anchorNode, ListNode);
                    const type = parentList ? parentList.getListType() : element.getListType();
                    setBlockType(type);
                } else {
                    const type = $isHeadingNode(element) ? element.getTag() : element.getType();
                    setBlockType(type);
                }
            }
        }
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }: any) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload: any, _newEditor: any) => {
                    updateToolbar();
                    return false;
                },
                1
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload: boolean) => {
                    setCanUndo(payload);
                    return false;
                },
                1
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload: boolean) => {
                    setCanRedo(payload);
                    return false;
                },
                1
            )
        );
    }, [editor, updateToolbar]);

    const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };

    const formatParagraph = () => {
        if (blockType !== 'paragraph') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    // @ts-ignore
                    $setBlocksType(selection, () => $createParagraphNode());
                }
            });
        }
    };

    const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
        if (blockType !== headingSize) {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    // @ts-ignore
                    $setBlocksType(selection, () => $createHeadingNode(headingSize));
                }
            });
        }
    };

    const formatBulletList = () => {
        if (blockType !== 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    const formatNumberedList = () => {
        if (blockType !== 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    return (
        <div className="flex flex-wrap gap-1.5 p-2.5 border-b border-gray-300 bg-white shadow-sm sticky top-0 z-10 rounded-t-lg">
            {/* Taille de police / Type de bloc */}
            <select 
                className="px-3 py-1.5 rounded border border-gray-300 text-sm bg-white hover:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                value={blockType}
                onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'paragraph') formatParagraph();
                    else if (value === 'h1' || value === 'h2' || value === 'h3') formatHeading(value as 'h1' | 'h2' | 'h3');
                }}
            >
                <option value="paragraph">📝 Normal</option>
                <option value="h1">📌 Titre 1</option>
                <option value="h2">📍 Titre 2</option>
                <option value="h3">🔸 Titre 3</option>
            </select>

            <div className="w-px h-7 bg-gray-300 mx-1 self-center" />

            {/* Formatage de texte */}
            <button
                type="button"
                onClick={() => formatText('bold')}
                className={`px-3 py-1.5 rounded transition-all font-bold text-sm border ${
                    isBold 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Gras (Ctrl+B)"
            >
                <strong>B</strong>
            </button>
            <button
                type="button"
                onClick={() => formatText('italic')}
                className={`px-3 py-1.5 rounded transition-all italic text-sm border ${
                    isItalic 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Italique (Ctrl+I)"
            >
                <em>I</em>
            </button>
            <button
                type="button"
                onClick={() => formatText('underline')}
                className={`px-3 py-1.5 rounded transition-all underline text-sm border ${
                    isUnderline 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Souligné (Ctrl+U)"
            >
                <u>U</u>
            </button>
            <button
                type="button"
                onClick={() => formatText('strikethrough')}
                className={`px-3 py-1.5 rounded transition-all line-through text-sm border ${
                    isStrikethrough 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Barré"
            >
                S
            </button>
            <button
                type="button"
                onClick={() => formatText('code')}
                className={`px-3 py-1.5 rounded transition-all font-mono text-xs border ${
                    isCode 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Code"
            >
                {'</>'}
            </button>

            <div className="w-px h-7 bg-gray-300 mx-1 self-center" />

            {/* Listes */}
            <button
                type="button"
                onClick={formatBulletList}
                className={`px-3 py-1.5 rounded transition-all text-sm border ${
                    blockType === 'bullet' 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Liste à puces"
            >
                ☰ Liste
            </button>
            <button
                type="button"
                onClick={formatNumberedList}
                className={`px-3 py-1.5 rounded transition-all text-sm border ${
                    blockType === 'number' 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Liste numérotée"
            >
                ⓵ Liste
            </button>

            <div className="w-px h-7 bg-gray-300 mx-1 self-center" />

            {/* Annuler/Rétablir */}
            <button
                type="button"
                onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
                disabled={!canUndo}
                className={`px-3 py-1.5 rounded transition-all text-sm border ${
                    !canUndo 
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Annuler (Ctrl+Z)"
            >
                ↶ Annuler
            </button>
            <button
                type="button"
                onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
                disabled={!canRedo}
                className={`px-3 py-1.5 rounded transition-all text-sm border ${
                    !canRedo 
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200' 
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary'
                }`}
                title="Rétablir (Ctrl+Y)"
            >
                Rétablir ↷
            </button>
        </div>
    );
}
