/**
 * ToolbarPlugin - Barre d'outils riche pour l'éditeur Lexical
 * Basé sur les exemples officiels du Lexical Playground
 * Adapté pour Yanotela avec le design existant
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SELECTION_CHANGE_COMMAND, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, $isTextNode } from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';
import Icons from '@/ui/Icon';

interface ToolbarPluginProps {
    onOpenDrawingBoard?: () => void;
}

export default function ToolbarPlugin({ onOpenDrawingBoard }: ToolbarPluginProps = {}) {
    const [editor] = useLexicalComposerContext();
    const toolbarRef = useRef(null);
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const [showListMenu, setShowListMenu] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [fontSize, setFontSize] = useState('16px');
    const [fontColor, setFontColor] = useState('#727272');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [isInBulletList, setIsInBulletList] = useState(false);
    const [isInNumberedList, setIsInNumberedList] = useState(false);
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify' | ''>('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [toolbarBottom, setToolbarBottom] = useState(0);

    const $updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if (!selection) {
            // No selection available - reset toggles
            setIsBold(false);
            setIsItalic(false);
            setIsUnderline(false);
            setIsStrikethrough(false);
            // setIsList(false); // supprimé
            return;
        }

        // Collect values across nodes to detect "mixed" styles
        const fontSizes = new Set<string>();
        const fontColors = new Set<string>();
        const backgroundColors = new Set<string>();

        // Helper to extract styles from a node's rawStyle
        const extractStyles = (rawStyle: any) => {
            let nodeFontSize: string | undefined;
            let nodeFontColor: string | undefined;
            let nodeBackgroundColor: string | undefined;

            if (rawStyle == null) {
                // nothing
            } else if (typeof rawStyle.get === 'function') {
                nodeFontSize = rawStyle.get('font-size');
                nodeFontColor = rawStyle.get('color');
                nodeBackgroundColor = rawStyle.get('background-color');
            } else if (typeof rawStyle === 'string') {
                rawStyle.split(';').forEach((decl: string) => {
                    const [k, v] = decl.split(':').map((s) => s && s.trim());
                    if (!k || !v) return;
                    if (k === 'font-size') nodeFontSize = v;
                    if (k === 'color') nodeFontColor = v;
                    if (k === 'background-color') nodeBackgroundColor = v;
                });
            } else if (typeof rawStyle === 'object') {
                nodeFontSize = rawStyle['font-size'] ?? rawStyle.fontSize;
                nodeFontColor = rawStyle['color'] ?? rawStyle.color;
                nodeBackgroundColor = rawStyle['background-color'] ?? rawStyle.backgroundColor;
            }

            return { nodeFontSize, nodeFontColor, nodeBackgroundColor };
        };

        // Get nodes for the selection; when collapsed there may be no nodes, so fall back to anchor
        let nodes: any[] = [];
        try {
            if ($isRangeSelection(selection)) {
                nodes = selection.getNodes();
            }
        } catch (e) {
            nodes = [];
        }
        if (!nodes || nodes.length === 0) {
            try {
                const anchorNode = (selection as any).anchor?.getNode?.();
                if (anchorNode) nodes = [anchorNode];
            } catch (e) {
                nodes = [];
            }
        }

        nodes.forEach((node: any) => {
            if ($isTextNode(node)) {
                const rawStyle = node.getStyle();
                const { nodeFontSize, nodeFontColor, nodeBackgroundColor } = extractStyles(rawStyle);
                if (nodeFontSize) fontSizes.add(nodeFontSize);
                if (nodeFontColor) fontColors.add(nodeFontColor);
                if (nodeBackgroundColor) backgroundColors.add(nodeBackgroundColor);
            }
        });

        if (fontSizes.size === 1) {
            setFontSize(Array.from(fontSizes)[0]);
        } else if (fontSizes.size > 1) {
            setFontSize('');
        } else {
            setFontSize('16px');
        }

        if (fontColors.size === 1) {
            setFontColor(Array.from(fontColors)[0]);
        }

        if (backgroundColors.size === 1) {
            setBackgroundColor(Array.from(backgroundColors)[0]);
        }

        setIsBold(typeof (selection as any).hasFormat === 'function' ? (selection as any).hasFormat('bold') : false);
        setIsItalic(typeof (selection as any).hasFormat === 'function' ? (selection as any).hasFormat('italic') : false);
        setIsUnderline(typeof (selection as any).hasFormat === 'function' ? (selection as any).hasFormat('underline') : false);
        setIsStrikethrough(typeof (selection as any).hasFormat === 'function' ? (selection as any).hasFormat('strikethrough') : false);

        // Detect list type and alignment by walking up from the anchor node (older approach)
        try {
            if ($isRangeSelection(selection)) {
                const anchorNode = (selection as any).anchor?.getNode?.();
                let isBullet = false;
                let isNumber = false;
                let align: 'left' | 'center' | 'right' | 'justify' | '' = '';

                if (anchorNode) {
                    let currentNode: any = anchorNode;
                    while (currentNode) {
                        const type = typeof currentNode.getType === 'function' ? currentNode.getType() : null;

                        if (type === 'list') {
                            // internal tag may be __tag or _tag
                            // @ts-ignore
                            const listType = currentNode.__tag || currentNode._tag;
                            isBullet = listType === 'ul';
                            isNumber = listType === 'ol';
                        }

                        // Detect alignment from paragraph/heading/listitem nodes via internal format
                        if (type === 'paragraph' || type === 'heading' || type === 'listitem') {
                            try {
                                // @ts-ignore
                                const format = currentNode.__format ?? currentNode._format ?? 0;
                                const alignmentBits = format & 0xF;
                                switch (alignmentBits) {
                                    case 1: align = 'left'; break;
                                    case 2: align = 'center'; break;
                                    case 3: align = 'right'; break;
                                    case 4: align = 'justify'; break;
                                    default: break;
                                }
                            } catch (err) {
                                // ignore
                            }
                        }

                        const parent = currentNode.getParent && currentNode.getParent();
                        if (!parent) break;
                        currentNode = parent;
                    }
                }

                setIsInBulletList(isBullet);
                setIsInNumberedList(isNumber);
                setAlignment(align);
            } else {
                // not a range selection -> clear list/alignment
                setIsInBulletList(false);
                setIsInNumberedList(false);
                setAlignment('');
                // setIsList(false); // supprimé
            }
        } catch (e) {
            setIsInBulletList(false);
            setIsInNumberedList(false);
            setAlignment('');
            // setIsList(false); // supprimé
        }
    }, [editor]);

    useEffect(() => {
        // Mettre à jour la toolbar immédiatement au montage
        editor.getEditorState().read(() => {
            $updateToolbar();
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }: any) => {
                editorState.read(() => {
                    $updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload: any, _newEditor: any) => {
                    // Lire l'état de l'éditeur pour mettre à jour la toolbar
                    editor.getEditorState().read(() => {
                        $updateToolbar();
                    });
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor, $updateToolbar]);

    // Détecter l'apparition du clavier sur mobile et ajuster la position de la toolbar
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let ticking = false;
        
        const handleViewportChange = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.visualViewport) {
                        // Sur mobile, quand le clavier s'ouvre, visualViewport.height diminue
                        const viewportHeight = window.visualViewport.height;
                        const viewportOffsetTop = window.visualViewport.offsetTop || 0;
                        const viewportOffsetLeft = window.visualViewport.offsetLeft || 0;
                        const windowHeight = window.innerHeight;
                        
                        // Calculer la hauteur du clavier
                        const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
                        
                        // Calculer la position absolue du bas du viewport visible
                        // Cette position change quand on scroll
                        const absoluteBottom = viewportOffsetTop + viewportHeight - keyboardHeight;
                        
                        // Mettre à jour seulement si c'est significatif (> 100px pour éviter les faux positifs)
                        if (keyboardHeight > 100) {
                            setKeyboardHeight(keyboardHeight);
                            setToolbarBottom(absoluteBottom);
                        } else {
                            setKeyboardHeight(0);
                            setToolbarBottom(0);
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Écouter les changements de focus pour détecter quand l'utilisateur commence à taper
        const handleFocusIn = () => {
            // Petit délai pour laisser le clavier s'ouvrir
            setTimeout(handleViewportChange, 300);
        };

        const handleFocusOut = () => {
            // Petit délai pour laisser le clavier se fermer
            setTimeout(() => {
                setKeyboardHeight(0);
                setToolbarBottom(0);
            }, 300);
        };

        // Utiliser visualViewport si disponible (meilleure détection du clavier)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
            document.addEventListener('focusin', handleFocusIn);
            document.addEventListener('focusout', handleFocusOut);
            // Appeler une fois au montage pour initialiser
            handleViewportChange();
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
                window.visualViewport.removeEventListener('scroll', handleViewportChange);
                document.removeEventListener('focusin', handleFocusIn);
                document.removeEventListener('focusout', handleFocusOut);
            }
        };
    }, []);

    const applyStyleText = useCallback(
        (styles: Record<string, string>) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, styles);
                }
            });
        },
        [editor]
    );

    const applyBackgroundColor = useCallback(
        (color: string) => {
            setBackgroundColor(color);
            applyStyleText({ 'background-color': color });
        },
        [applyStyleText]
    );

    const formatList = (listType: 'bullet' | 'number') => {
        if (isInBulletList || isInNumberedList) {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
            if (listType === 'bullet') {
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            } else {
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }
        }
    };

    const getContrastColor = (hex: string) => {
        try {
            const h = hex.replace('#', '');
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 200 ? '#727272' : '#ffffff';
        } catch {
            return '#000000';
        }
    };

    return (
        <>
            {/* DESKTOP TOOLBAR - Top sticky bar with all buttons */}
            <div
                role="toolbar"
                aria-label="Editor toolbar"
                ref={toolbarRef}
                className="hidden md:flex flex-wrap items-center gap-1 bg-white rounded-lg sticky top-4 z-10 p-2 mb-1 shadow-sm"
            >
                {/* Formatage */}
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isBold ? 'bg-background' : 'hover:bg-gray-100'}`}
                    aria-label="Gras"
                    title="Gras (Ctrl+B)">
                    <Icons name="bold" />
                    
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isItalic ? 'bg-background' : 'hover:bg-gray-100'}`}
                    aria-label="Italique"
                    title="Italique (Ctrl+I)">
                    <Icons name="italic" />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isUnderline ? 'bg-background' : 'hover:bg-gray-100'}`}
                    aria-label="Souligner"
                    title="Souligner (Ctrl+U)">
                    <Icons name="underline" />
                    
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isStrikethrough ? 'bg-background' : 'hover:bg-gray-100'}`}
                    aria-label="Barré"
                    title="Barré">
                    <Icons name="strikethrough" />
         
                </button>

                <span className="inline-block w-px h-7 mx-2 bg-gray-300 opacity-80" />

                {/* Taille et couleur */}
                <select
                    value={fontSize || ''}
                    onChange={(e) => {
                        setFontSize(e.target.value);
                        applyStyleText({ 'font-size': e.target.value });
                    }}
                    title="Taille de police"
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none transition-colors duration-200">
                    <option value="" hidden>Mixte</option>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="36px">36px</option>
                </select>

                <label className="relative cursor-pointer flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: fontColor }}>
                        <Icons name="fontColor" />
                    </span>
                    <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => {
                            setFontColor(e.target.value);
                            applyStyleText({ color: e.target.value });
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </label>

                <label className="relative cursor-pointer flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: backgroundColor }}>
                        <Icons name="backgroundColor" />
                    </span>
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => {
                            setBackgroundColor(e.target.value);
                            applyBackgroundColor(e.target.value);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </label>

                <span className="inline-block w-px h-7 mx-2 bg-gray-300 opacity-80" />

                {/* Listes */}
                <button
                    onClick={() => formatList('bullet')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isInBulletList ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Liste à puces">
                    <Icons name="list-ul" />
                </button>
                <button
                    onClick={() => formatList('number')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isInNumberedList ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Liste numérotée">
                    <Icons name="list-ol" />
                </button>

                <span className="inline-block w-px h-7 mx-2 bg-gray-300 opacity-80" />

                {/* Alignement */}
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'left' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Aligner à gauche">
                    <Icons name="text-left" />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'center' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Centrer">
                    <Icons name="text-center" />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'right' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Aligner à droite">
                    <Icons name="text-right" />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'justify' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Justifier">
                    <Icons name="text-justify" />
                </button>

                {/* Drawing Board button */}
                {onOpenDrawingBoard && (
                    <>
                        <div className="w-px h-6 bg-gray-200 mx-1" /> {/* Separator */}
                        <button
                            onClick={onOpenDrawingBoard}
                            className="flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 hover:bg-gray-100"
                            aria-label="Ouvrir le tableau de dessin"
                            title="Tableau de dessin">
                            <Icons name="modif" />
                        </button>
                    </>
                )}
            </div>

            {/* MOBILE TOOLBAR - Bottom fixed bar with submenus */}
            <div 
                className="md:hidden bg-white border-t border-gray-200 shadow-lg z-50 mobile-toolbar-sticky"
                style={{ 
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    transition: 'transform 0.2s ease-out',
                    willChange: 'transform'
                }}
            >
                <div className="flex items-center justify-around p-3 gap-2">
                    {/* Format submenu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowFormatMenu(!showFormatMenu);
                                setShowSizeMenu(false);
                                setShowListMenu(false);
                                setShowAlignMenu(false);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${showFormatMenu ? 'bg-background' : 'hover:bg-gray-100'}`}
                            aria-label="Formatage">
                            <Icons name="bold" />
                            <span className="text-xs">Format</span>
                        </button>
                        
                        {showFormatMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowFormatMenu(false)}
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl p-2 flex flex-col gap-1 z-50 border border-gray-200">
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                                            setShowFormatMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isBold ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="bold" />
                                        <span>Gras</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                                            setShowFormatMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isItalic ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="italic" />
                                        <span>Italique</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                                            setShowFormatMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isUnderline ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="underline" />
                                        <span>Souligner</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
                                            setShowFormatMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isStrikethrough ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="strikethrough" />
                                        <span>Barré</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Size & Color submenu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowSizeMenu(!showSizeMenu);
                                setShowFormatMenu(false);
                                setShowListMenu(false);
                                setShowAlignMenu(false);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${showSizeMenu ? 'bg-background' : 'hover:bg-gray-100'}`}
                            aria-label="Taille et couleur">
                            <Icons name="fontColor" />
                            <span className="text-xs">Taille</span>
                        </button>
                        
                        {showSizeMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowSizeMenu(false)}
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl p-3 flex flex-col gap-3 z-50 border border-gray-200">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Taille</label>
                                        <select
                                            value={fontSize || ''}
                                            onChange={(e) => {
                                                setFontSize(e.target.value);
                                                applyStyleText({ 'font-size': e.target.value });
                                            }}
                                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none">
                                            <option value="" hidden>Mixte</option>
                                            <option value="12px">12px</option>
                                            <option value="14px">14px</option>
                                            <option value="16px">16px</option>
                                            <option value="18px">18px</option>
                                            <option value="20px">20px</option>
                                            <option value="24px">24px</option>
                                            <option value="28px">28px</option>
                                            <option value="36px">36px</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Couleur texte</label>
                                            <input
                                                type="color"
                                                value={fontColor}
                                                onChange={(e) => {
                                                    setFontColor(e.target.value);
                                                    applyStyleText({ color: e.target.value });
                                                }}
                                                className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Fond</label>
                                            <input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => {
                                                    setBackgroundColor(e.target.value);
                                                    applyBackgroundColor(e.target.value);
                                                }}
                                                className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* List submenu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowListMenu(!showListMenu);
                                setShowFormatMenu(false);
                                setShowSizeMenu(false);
                                setShowAlignMenu(false);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${showListMenu ? 'bg-background' : 'hover:bg-gray-100'}`}
                            aria-label="Listes">
                            <Icons name="list-ul" className="mb-1" />
                            <span className="text-xs">Listes</span>
                        </button>
                        
                        {showListMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowListMenu(false)}
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl p-2 flex flex-col gap-1 z-50 border border-gray-200">
                                    <button
                                        onClick={() => {
                                            formatList('bullet');
                                            setShowListMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isInBulletList ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="list-ul" />
                                        <span>Liste à puces</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            formatList('number');
                                            setShowListMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isInNumberedList ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="list-ol" />
                                        <span>Liste numérotée</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Alignment submenu */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowAlignMenu(!showAlignMenu);
                                setShowFormatMenu(false);
                                setShowSizeMenu(false);
                                setShowListMenu(false);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${showAlignMenu ? 'bg-background' : 'hover:bg-gray-100'}`}
                            aria-label="Alignement">
                            <Icons name="text-left" className="mb-1" />
                            <span className="text-xs">Aligner</span>
                        </button>
                        
                        {showAlignMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowAlignMenu(false)}
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl p-2 flex flex-col gap-1 z-50 border border-gray-200">
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
                                            setShowAlignMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${alignment === 'left' ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="text-left" />
                                        <span>Gauche</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
                                            setShowAlignMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${alignment === 'center' ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="text-center" />
                                        <span>Centre</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
                                            setShowAlignMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${alignment === 'right' ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="text-right" />
                                        <span>Droite</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
                                            setShowAlignMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${alignment === 'justify' ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <Icons name="text-justify" />
                                        <span>Justifier</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Drawing Board button for mobile */}
                    {onOpenDrawingBoard && (
                        <button
                            onClick={onOpenDrawingBoard}
                            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100"
                            aria-label="Ouvrir le tableau de dessin">
                            <Icons name="modif" className="mb-1" />
                            <span className="text-xs">Dessin</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
