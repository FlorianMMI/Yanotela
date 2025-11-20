/**
 * ToolbarPlugin - Barre d'outils riche pour l'éditeur Lexical
 * Basé sur les exemples officiels du Lexical Playground
 * Adapté pour Yanotela avec le design existant
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SELECTION_CHANGE_COMMAND, FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, $isTextNode, $insertNodes } from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';
import {BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, FontColorIcon, BackgroundColorIcon, ListUlIcon, ListOlIcon, TextLeftIcon, TextCenterIcon, TextRightIcon, TextJustifyIcon, MediaIcon, ModifIcon, } from '@/libs/Icons';
import { $createImageNode } from '@/components/flashnote/ImageNode';
import { $createAudioNode } from '@/components/flashnote/AudioNode';
import { $createVideoNode } from '@/components/flashnote/VideoNode';
import ExportPDFButton from '@/ui/exportpdfbutton';

import ColorPalette from './ColorPalette';

interface ToolbarPluginProps {
    onOpenDrawingBoard?: () => void;
    noteTitle?: string;
    editorContentRef?: React.RefObject<HTMLElement | null>;
}

export default function ToolbarPlugin({ onOpenDrawingBoard, noteTitle = "Sans titre", editorContentRef }: ToolbarPluginProps = {}) {
    const [editor] = useLexicalComposerContext();
    const toolbarRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const [showListMenu, setShowListMenu] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [fontSize, setFontSize] = useState('16px');
    const [fontFamily, setFontFamily] = useState('Gantari');
    const [fontColor, setFontColor] = useState('#727272');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [isInBulletList, setIsInBulletList] = useState(false);
    const [isInNumberedList, setIsInNumberedList] = useState(false);
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify' | ''>('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [viewportTop, setViewportTop] = useState(0);

    // Helper optimisé pour extraire les styles d'un nœud
    const extractNodeStyles = useCallback((rawStyle: unknown) => {
        const styles = { fontSize: '', fontFamily: '', fontColor: '', backgroundColor: '' };

        if (!rawStyle) return styles;

        if (typeof rawStyle === 'string') {
            rawStyle.split(';').forEach((decl: string) => {
                const [key, val] = decl.split(':').map(s => s?.trim());
                if (!key || !val) return;
                if (key === 'font-size') styles.fontSize = val;
                else if (key === 'font-family') styles.fontFamily = val;
                else if (key === 'color') styles.fontColor = val;
                else if (key === 'background-color') styles.backgroundColor = val;
            });
        } else if (typeof rawStyle === 'object') {
            const styleObj = rawStyle as Record<string, unknown>;
            styles.fontSize = (styleObj['font-size'] ?? styleObj['fontSize'] ?? '') as string;
            styles.fontFamily = (styleObj['font-family'] ?? styleObj['fontFamily'] ?? '') as string;
            styles.fontColor = (styleObj['color'] ?? '') as string;
            styles.backgroundColor = (styleObj['background-color'] ?? styleObj['backgroundColor'] ?? '') as string;
        }

        return styles;
    }, []);

    const $updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if (!selection) {
            setIsBold(false);
            setIsItalic(false);
            setIsUnderline(false);
            setIsStrikethrough(false);
            return;
        }

        // Collecter les styles de tous les nœuds sélectionnés
        const fontSizes = new Set<string>();
        const fontFamilies = new Set<string>();
        const fontColors = new Set<string>();
        const backgroundColors = new Set<string>();

        let nodes: unknown[] = [];
        try {
            if ($isRangeSelection(selection)) {
                nodes = selection.getNodes();
            }
        } catch {
            nodes = [];
        }

        if (nodes.length === 0) {
            try {
                const anchorNode = (selection as { anchor?: { getNode?: () => unknown } }).anchor?.getNode?.();
                if (anchorNode) nodes = [anchorNode];
            } catch {
                nodes = [];
            }
        }

        nodes.forEach((node) => {
            if ($isTextNode(node as never)) {
                const rawStyle = (node as { getStyle?: () => unknown }).getStyle?.();
                const { fontSize, fontFamily, fontColor, backgroundColor } = extractNodeStyles(rawStyle);
                if (fontSize) fontSizes.add(fontSize);
                if (fontFamily) fontFamilies.add(fontFamily);
                if (fontColor) fontColors.add(fontColor);
                if (backgroundColor) backgroundColors.add(backgroundColor);
            }
        });

        // Mettre à jour les états de la toolbar
        setFontSize(fontSizes.size === 1 ? Array.from(fontSizes)[0] : fontSizes.size > 1 ? '' : '16px');
        setFontFamily(fontFamilies.size === 1 ? Array.from(fontFamilies)[0] : fontFamilies.size > 1 ? '' : 'Gantari');
        if (fontColors.size === 1) setFontColor(Array.from(fontColors)[0]);
        if (backgroundColors.size === 1) setBackgroundColor(Array.from(backgroundColors)[0]);

        // Format toggles
        const sel = selection as { hasFormat?: (format: string) => boolean };
        setIsBold(sel.hasFormat?.('bold') ?? false);
        setIsItalic(sel.hasFormat?.('italic') ?? false);
        setIsUnderline(sel.hasFormat?.('underline') ?? false);
        setIsStrikethrough(sel.hasFormat?.('strikethrough') ?? false);

        // Détecter les listes et alignement
        try {
            if ($isRangeSelection(selection)) {
                const anchorNode = (selection as { anchor?: { getNode?: () => unknown } }).anchor?.getNode?.() as {
                    getType?: () => string;
                    getParent?: () => unknown;
                    __tag?: string;
                    _tag?: string;
                    __format?: number;
                    _format?: number;
                } | undefined;

                let isBullet = false;
                let isNumber = false;
                let align: 'left' | 'center' | 'right' | 'justify' | '' = '';

                let currentNode = anchorNode;
                while (currentNode) {
                    const type = currentNode.getType?.();

                    if (type === 'list') {
                        const listType = currentNode.__tag || currentNode._tag;
                        isBullet = listType === 'ul';
                        isNumber = listType === 'ol';
                    }

                    if (type === 'paragraph' || type === 'heading' || type === 'listitem') {
                        const format = currentNode.__format ?? currentNode._format ?? 0;
                        const alignmentBits = format & 0xF;
                        if (alignmentBits === 1) align = 'left';
                        else if (alignmentBits === 2) align = 'center';
                        else if (alignmentBits === 3) align = 'right';
                        else if (alignmentBits === 4) align = 'justify';
                    }

                    const parent = currentNode.getParent?.();
                    if (!parent) break;
                    currentNode = parent as typeof currentNode;
                }

                setIsInBulletList(isBullet);
                setIsInNumberedList(isNumber);
                setAlignment(align);
            } else {
                setIsInBulletList(false);
                setIsInNumberedList(false);
                setAlignment('');
            }
        } catch {
            setIsInBulletList(false);
            setIsInNumberedList(false);
            setAlignment('');
        }
    }, [extractNodeStyles]);

    useEffect(() => {
        // Mettre à jour la toolbar immédiatement au montage
        editor.getEditorState().read(() => {
            $updateToolbar();
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }: { editorState: { read: (fn: () => void) => void } }) => {
                editorState.read(() => {
                    $updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
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
                        const viewportHeight = window.visualViewport.height;
                        const windowHeight = window.innerHeight;
                        const offsetTop = window.visualViewport.offsetTop || 0;

                        // Calculer la hauteur du clavier
                        const calculatedKeyboardHeight = Math.max(0, windowHeight - viewportHeight);

                        // Mettre à jour la position du viewport (pour suivre le scroll)
                        setViewportTop(offsetTop);

                        // Mettre à jour seulement si c'est significatif (> 100px)
                        if (calculatedKeyboardHeight > 100) {
                            setKeyboardHeight(calculatedKeyboardHeight);
                        } else {
                            setKeyboardHeight(0);
                            setViewportTop(0); // Reset quand pas de clavier
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Écouter les changements de focus
        const handleFocusIn = () => {
            setTimeout(handleViewportChange, 350);
        };

        const handleFocusOut = () => {
            setTimeout(() => {
                setKeyboardHeight(0);
                setViewportTop(0);
            }, 350);
        };

        // Écouter resize ET scroll pour suivre le clavier
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
            document.addEventListener('focusin', handleFocusIn);
            document.addEventListener('focusout', handleFocusOut);
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

    // Application instantanée et réactive des styles
    const applyStyleText = useCallback(
        (styles: Record<string, string>) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    // Cela enregistre le style dans la sélection pour que les futurs caractères l'héritent
                    $patchStyleText(selection, styles);
                }
            });
        },
        [editor]
    );

    // Handlers optimisés pour changement instantané des couleurs
    const handleFontColorChange = useCallback((color: string) => {
        setFontColor(color);
        applyStyleText({ color });
    }, [applyStyleText]);

    const handleBackgroundColorChange = useCallback((color: string) => {
        setBackgroundColor(color);
        applyStyleText({ 'background-color': color });
    }, [applyStyleText]);

    const handleFontSizeChange = useCallback((size: string) => {
        setFontSize(size);
        applyStyleText({ 'font-size': size });
    }, [applyStyleText]);

    const handleFontFamilyChange = useCallback((family: string) => {
        setFontFamily(family);
        applyStyleText({ 'font-family': family });
    }, [applyStyleText]);

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

    const handleImageImport = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if file is an image, audio, or video
        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3');
        const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|ogg)$/i);

        if (!isImage && !isAudio && !isVideo) {
            alert('Veuillez sélectionner un fichier image, audio (MP3) ou vidéo (MP4, WebM)');
            return;
        }

        // Check file size (max 50MB for video, 10MB for audio, 5MB for images)
        const maxSize= 10 * 1024 * 1024;
        const maxSizeLabel= '10MB';
       if (file.size > maxSize) {
            alert(`Le fichier est trop volumineux (max ${maxSizeLabel})`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src) {
                editor.update(() => {
                    if (isImage) {
                        const imageNode = $createImageNode({
                            src,
                            altText: file.name,
                            isDrawing: false, // Imported images are not drawings
                        });
                        $insertNodes([imageNode]);
                    } else if (isAudio) {
                        const audioNode = $createAudioNode({
                            src,
                            altText: file.name,
                        });
                        $insertNodes([audioNode]);
                    } else if (isVideo) {
                        const videoNode = $createVideoNode({
                            src,
                            altText: file.name,
                        });
                        $insertNodes([videoNode]);
                    }
                });
            }
        };
        reader.readAsDataURL(file);

        // Reset input value to allow re-uploading the same file
        event.target.value = '';
    }, [editor]);

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
                    <BoldIcon />

                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isItalic ? 'bg-background' : 'hover:bg-gray-100'}`}
                    aria-label="Italique"
                    title="Italique (Ctrl+I)">
                    <ItalicIcon />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isUnderline ? 'bg-background' : 'hover:bg-gray-100'}`}
                    aria-label="Souligner"
                    title="Souligner (Ctrl+U)">
                    <UnderlineIcon />

                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isStrikethrough ? 'bg-background' : 'hover:bg-gray-100'}`}
                    aria-label="Barré"
                    title="Barré">
                    <StrikethroughIcon />

                </button>

                <span className="inline-block w-px h-7 mx-2 bg-gray-300 opacity-80" />
                
                {/* Selection de la police d'écriture */}
                <select
                    value={fontFamily || ''}
                    onChange={(e) => handleFontFamilyChange(e.target.value)}
                    title="Police d'écriture"
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none transition-colors duration-200"
                    style={{ fontFamily: fontFamily || 'Gantari' }}>
                    <option value="" hidden>Mixte</option>
                    <option value="Gantari" style={{ fontFamily: 'Gantari' }}>Gantari</option>
                    <option value="Geologica" style={{ fontFamily: 'Geologica' }}>Geologica</option>
                    <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
                    <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
                    <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
                    <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                    <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</option>
                    <option value="Comic Sans MS" style={{ fontFamily: 'Comic Sans MS' }}>Comic Sans MS</option>
                    <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
                </select>

                {/* Taille et couleur */}
                <select
                    value={fontSize || ''}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
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

                <div className="relative flex items-center gap-2">
                    <ColorPalette value={fontColor} onChange={handleFontColorChange} asButton small buttonIcon={<FontColorIcon />} />
                </div>

                <div className="relative flex items-center gap-2">
                    <ColorPalette value={backgroundColor} onChange={handleBackgroundColorChange} asButton small buttonIcon={<BackgroundColorIcon />} />
                </div>

                <span className="inline-block w-px h-7 mx-2 bg-gray-300 opacity-80" />

                {/* Listes */}
                <button
                    onClick={() => formatList('bullet')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isInBulletList ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Liste à puces">
                    <ListUlIcon />
                </button>
                <button
                    onClick={() => formatList('number')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${isInNumberedList ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Liste numérotée">
                    <ListOlIcon />
                </button>

                <span className="inline-block w-px h-7 mx-2 bg-gray-300 opacity-80" />

                {/* Alignement */}
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'left' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Aligner à gauche">
                    <TextLeftIcon />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'center' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Centrer">
                    <TextCenterIcon />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'right' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Aligner à droite">
                    <TextRightIcon />
                </button>
                <button
                    onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
                    className={`flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 ${alignment === 'justify' ? 'bg-background' : 'hover:bg-gray-100'}`}
                    title="Justifier">
                    <TextJustifyIcon />
                </button>

                <span className="inline-block w-px h-7 mx-2 bg-gray-300 opacity-80" />

                {/* Media import button */}
                <button
                    onClick={handleImageImport}
                    className="flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 hover:bg-gray-100"
                    aria-label="Importer un média"
                    title="Importer un média (image, audio ou vidéo)">
                    <MediaIcon />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,audio/*,video/*,.mp3,.mp4,.webm"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Drawing Board button */}
                {onOpenDrawingBoard && (
                    <>
                        <div className="w-px h-6 bg-gray-200 mx-1" /> {/* Separator */}
                        <button
                            onClick={onOpenDrawingBoard}
                            className="flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-200 hover:bg-gray-100"
                            aria-label="Ouvrir le tableau de dessin"
                            title="Tableau de dessin">
                            <ModifIcon />
                        </button>
                    </>
                )}

                {/* Export PDF button */}
                <div className="w-px h-6 bg-gray-200 mx-1" /> {/* Separator */}
                <ExportPDFButton
                    noteTitle={noteTitle}
                    editorRef={editorContentRef}
                    compact={true}
                />
            </div>

            {/* MOBILE TOOLBAR - Bottom fixed bar with submenus */}
            <div
                className="md:hidden fixed left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
                style={{
                    bottom: `${keyboardHeight}px`,
                    transform: viewportTop > 0 ? `translateY(${viewportTop}px)` : 'none',
                    transition: 'bottom 0.3s ease-out, transform 0.1s linear'
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
                            <BoldIcon />
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
                                        <BoldIcon />
                                        <span>Gras</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                                            setShowFormatMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isItalic ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <ItalicIcon />
                                        <span>Italique</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
                                            setShowFormatMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isUnderline ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <UnderlineIcon />
                                        <span>Souligner</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
                                            setShowFormatMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isStrikethrough ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <StrikethroughIcon />
                                        <span>Barré</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Options submenu (Size, Color, Export) */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowSizeMenu(!showSizeMenu);
                                setShowFormatMenu(false);
                                setShowListMenu(false);
                                setShowAlignMenu(false);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${showSizeMenu ? 'bg-background' : 'hover:bg-gray-100'}`}
                            aria-label="Options">
                            <FontColorIcon />
                            <span className="text-xs">Options</span>
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
                                            onChange={(e) => handleFontSizeChange(e.target.value)}
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
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Police</label>
                                        <select
                                            value={fontFamily || ''}
                                            onChange={(e) => handleFontFamilyChange(e.target.value)}
                                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none"
                                            style={{ fontFamily: fontFamily || 'Gantari' }}>
                                            <option value="" hidden>Mixte</option>
                                            <option value="Gantari" style={{ fontFamily: 'Gantari' }}>Gantari</option>
                                            <option value="Geologica" style={{ fontFamily: 'Geologica' }}>Geologica</option>
                                            <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
                                            <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times</option>
                                            <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier</option>
                                            <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                                            <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</option>
                                            <option value="monospace" style={{ fontFamily: 'monospace' }}>Mono</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Couleur texte</label>
                                            <ColorPalette
                                                value={fontColor}
                                                onChange={handleFontColorChange}
                                                asButton
                                                buttonIcon={<span style={{ display: 'inline-block', width: 18, height: 18, background: fontColor, borderRadius: 2 }} />}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 mb-1 block">Fond</label>
                                            <ColorPalette
                                                value={backgroundColor}
                                                onChange={handleBackgroundColorChange}
                                                asButton
                                                buttonIcon={<span style={{ display: 'inline-block', width: 18, height: 18, background: backgroundColor, borderRadius: 2 }} />}
                                            />
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                        <label className="text-xs text-gray-600 mb-2 block">Export</label>
                                        <ExportPDFButton
                                            noteTitle={noteTitle}
                                            editorRef={editorContentRef}
                                            compact={false}
                                            className="w-full justify-center"
                                        />
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
                            <ListUlIcon />
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
                                        <ListUlIcon />
                                        <span>Liste à puces</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            formatList('number');
                                            setShowListMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${isInNumberedList ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <ListOlIcon />
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
                            <TextLeftIcon />
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
                                        <TextLeftIcon />
                                        <span>Gauche</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
                                            setShowAlignMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${alignment === 'center' ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <TextCenterIcon />
                                        <span>Centre</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
                                            setShowAlignMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${alignment === 'right' ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <TextRightIcon />
                                        <span>Droite</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
                                            setShowAlignMenu(false);
                                        }}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${alignment === 'justify' ? 'bg-background' : 'hover:bg-gray-100'}`}>
                                        <TextJustifyIcon />
                                        <span>Justifier</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Media import button for mobile */}
                    <button
                        onClick={handleImageImport}
                        className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100"
                        aria-label="Importer un média">
                        <MediaIcon />
                        <span className="text-xs">Média</span>
                    </button>

                    {/* Drawing Board button for mobile */}
                    {onOpenDrawingBoard && (
                        <button
                            onClick={onOpenDrawingBoard}
                            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100"
                            aria-label="Ouvrir le tableau de dessin">
                            <ModifIcon />
                            <span className="text-xs">Dessin</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
