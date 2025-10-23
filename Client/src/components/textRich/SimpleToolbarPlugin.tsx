import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Système de verrou global pour éviter les duplications
let desktopToolbarLock = false;

// @ts-ignore
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    FORMAT_TEXT_COMMAND,
    $getSelection,
    $isRangeSelection,
    SELECTION_CHANGE_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    $createTextNode,
    TextNode,
} from 'lexical';
// @ts-ignore
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { applyFontSizeToSelection, applyColorToSelection } from './styledTextUtils';
import { $createFontSizeNode, $isFontSizeNode, FontSizeNode } from './FontSizeNode';
import { $createColorNode, $isColorNode, ColorNode } from './ColorNode';
import { $createStyledTextNode, $isStyledTextNode, StyledTextNode } from './StyledTextNode';

const FONT_SIZES = [
    { label: 'Petit', value: '14px' },
    { label: 'Normal', value: '16px' },
    { label: 'Grand', value: '20px' },
    { label: 'Très Grand', value: '24px' },
];

const TEXT_COLORS = [
    { label: 'Noir', value: '#000000' },
    { label: 'Blanc', value: '#FFFFFF' },
    { label: 'Rouge', value: '#E53E3E' },
    { label: 'Bleu', value: '#3182CE' },
    { label: 'Vert', value: '#38A169' },
    { label: 'Jaune', value: '#D69E2E' },
    { label: 'Violet', value: '#805AD5' },
    { label: 'Orange', value: '#DD6B20' },
];

interface ToolbarState {
    isBold: boolean;
    isCode: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isInBulletList: boolean;
    isInNumberedList: boolean;
    alignment: 'left' | 'center' | 'right' | 'justify' | '';
}

export default function SimpleToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [activeState, setActiveState] = useState<ToolbarState>({
        isBold: false,
        isCode: false,
        isItalic: false,
        isUnderline: false,
        isInBulletList: false,
        isInNumberedList: false,
        alignment: '',
    });
    const [fontSize, setFontSize] = useState('16px');
    const [textColor, setTextColor] = useState('#000000');

    // États pour les menus déroulants mobile
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [showListMenu, setShowListMenu] = useState(false);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [desktopContainer, setDesktopContainer] = useState<HTMLElement | null>(null);
    const [isDesktopToolbarOwner, setIsDesktopToolbarOwner] = useState(false);

    // Détecter si on est sur mobile et trouver le conteneur desktop
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Chercher le conteneur desktop et gérer le verrou
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        if (!isMobile) {
            const findContainer = () => {
                const container = document.getElementById('desktop-toolbar-container');
                if (container && !desktopToolbarLock) {
                    // Prendre le verrou
                    desktopToolbarLock = true;
                    setDesktopContainer(container);
                    setIsDesktopToolbarOwner(true);
                } else if (!container) {
                    // Réessayer après un court délai si le conteneur n'est pas encore monté
                    timeoutId = setTimeout(findContainer, 100);
                }
            };
            findContainer();
        } else {
            // Reset quand on passe en mobile
            if (isDesktopToolbarOwner) {
                desktopToolbarLock = false;
                setIsDesktopToolbarOwner(false);
            }
            setDesktopContainer(null);
        }

        // Nettoyer au démontage
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // Libérer le verrou si cette instance l'avait
            if (isDesktopToolbarOwner) {
                desktopToolbarLock = false;
            }
        };
    }, [isMobile, isDesktopToolbarOwner]);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            // Méthode plus simple pour détecter les listes et l'alignement
            let isInBulletList = false;
            let isInNumberedList = false;
            let alignment: 'left' | 'center' | 'right' | 'justify' | '' = '';
            let currentFontSize = '16px'; // Taille par défaut
            let currentColor = '#000000'; // Couleur par défaut

            try {
                const anchorNode = selection.anchor.getNode();
                // Parcourir les parents pour trouver un ListNode et récupérer l'alignement
                let currentNode = anchorNode;

                // Détecter la taille de police et la couleur actuelle du nœud courant
                if (anchorNode.getType() === 'fontsize') {
                    // @ts-ignore - Accès à la propriété fontSize de FontSizeNode
                    currentFontSize = anchorNode.__fontSize || '16px';
                }
                if (anchorNode.getType() === 'color') {
                    // @ts-ignore - Accès à la propriété color de ColorNode
                    currentColor = anchorNode.__color || '#000000';
                }
                if (anchorNode.getType() === 'styled-text') {
                    // @ts-ignore - Accès aux propriétés de StyledTextNode
                    currentFontSize = anchorNode.__fontSize || '16px';
                    // @ts-ignore
                    currentColor = anchorNode.__color || '#000000';
                }

                while (currentNode) {
                    if (currentNode.getType() === 'list') {
                        // @ts-ignore - Accès direct à la propriété pour éviter les conflits de types
                        const listType = currentNode.__tag || currentNode._tag;
                        isInBulletList = listType === 'ul';
                        isInNumberedList = listType === 'ol';
                    }

                    // Vérifier la taille de police sur les nœuds parents aussi
                    if (currentNode.getType() === 'fontsize') {
                        // @ts-ignore - Accès à la propriété fontSize de FontSizeNode
                        currentFontSize = currentNode.__fontSize || currentFontSize;
                    }

                    // Vérifier la couleur sur les nœuds parents aussi
                    if (currentNode.getType() === 'color') {
                        // @ts-ignore - Accès à la propriété color de ColorNode
                        currentColor = currentNode.__color || currentColor;
                    }

                    // Vérifier StyledTextNode
                    if (currentNode.getType() === 'styled-text') {
                        // @ts-ignore
                        currentFontSize = currentNode.__fontSize || currentFontSize;
                        // @ts-ignore
                        currentColor = currentNode.__color || currentColor;
                    }

                    // Détecter l'alignement depuis les nœuds éléments (inclus listitem)
                    if (currentNode.getType() === 'paragraph' || currentNode.getType() === 'heading' || currentNode.getType() === 'listitem') {
                        try {
                            // @ts-ignore - Accès direct aux propriétés internes
                            const format = currentNode.__format || currentNode._format || 0;

                            // Vérification des bits d'alignement selon la documentation Lexical
                            // Les constantes Lexical: LEFT=1, CENTER=2, RIGHT=3, JUSTIFY=4
                            const alignmentBits = format & 0xF; // Les 4 premiers bits

                            switch (alignmentBits) {
                                case 1: alignment = 'left'; break;
                                case 2: alignment = 'center'; break;
                                case 3: alignment = 'right'; break;
                                case 4: alignment = 'justify'; break;
                                default: alignment = ''; break;
                            }
                        } catch (error) {
                            // En cas d'erreur, ne pas changer l'alignement
                            console.warn('Erreur détection alignement:', error);
                        }
                    }

                    const parent = currentNode.getParent();
                    if (!parent) break;
                    currentNode = parent;
                }
            } catch (error) {
                // En cas d'erreur, on considère qu'on n'est pas dans une liste
                console.warn('Erreur lors de la détection de liste/alignement:', error);
            }

            setActiveState({
                isBold: selection.hasFormat('bold'),
                isCode: selection.hasFormat('code'),
                isItalic: selection.hasFormat('italic'),
                isUnderline: selection.hasFormat('underline'),
                isInBulletList,
                isInNumberedList,
                alignment,
            });

            // Mettre à jour la taille de police et la couleur affichées dans les sélecteurs
            setFontSize(currentFontSize);
            setTextColor(currentColor);
        } else {
            // Si pas de sélection range, garder l'état actuel mais vérifier les formats pendants
            const selection = $getSelection();
            if (selection) {
                // Essayer de détecter les formats même sans sélection range
                setActiveState(prev => ({
                    ...prev,
                    // Garder les états de formatage actuels si pas de sélection
                }));
            }
        }
    }, []);

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            () => {
                updateToolbar();
                return false;
            },
            1
        );
    }, [editor, updateToolbar]);

    const formatText = (format: 'bold' | 'italic' | 'underline' | 'code') => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                if (selection.isCollapsed()) {
                    // Pour un curseur vide, on utilise toggleFormat normalement
                    selection.toggleFormat(format);
                } else {
                    // Pour du texte sélectionné, on parcourt les nœuds pour préserver les FontSizeNode et ColorNode
                    const nodes = selection.getNodes();

                    nodes.forEach(node => {
                        if ($isStyledTextNode(node)) {
                            // Si c'est un StyledTextNode, on toggle le format sans perdre les styles
                            (node as StyledTextNode).toggleFormat(format);
                        } else if ($isFontSizeNode(node)) {
                            // Si c'est un FontSizeNode, on toggle le format sans perdre la taille
                            (node as FontSizeNode).toggleFormat(format);
                        } else if ($isColorNode(node)) {
                            // Si c'est un ColorNode, on toggle le format sans perdre la couleur
                            (node as ColorNode).toggleFormat(format);
                        } else if (node instanceof TextNode) {
                            // Pour les TextNode normaux, on utilise toggleFormat
                            node.toggleFormat(format);
                        }
                    });
                }
            }
        });

        // Mise à jour immédiate de l'état local pour un feedback instantané
        setActiveState(prev => ({
            ...prev,
            [format === 'bold' ? 'isBold' : format === 'italic' ? 'isItalic' : format === 'underline' ? 'isUnderline' : 'isCode']: !prev[format === 'bold' ? 'isBold' : format === 'italic' ? 'isItalic' : format === 'underline' ? 'isUnderline' : 'isCode']
        }));

        // Forcer la mise à jour complète après pour synchroniser
        setTimeout(() => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        }, 10);
    };

    const formatAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);

        // Mise à jour immédiate de l'état local pour un feedback instantané
        setActiveState(prev => ({
            ...prev,
            alignment: alignment
        }));

        // Forcer la mise à jour complète après pour synchroniser
        setTimeout(() => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        }, 10);
    };

    const insertList = (listType: 'bullet' | 'number') => {
        const wasInList = listType === 'bullet' ? activeState.isInBulletList : activeState.isInNumberedList;

        if (listType === 'bullet') {
            if (activeState.isInBulletList) {
                // Si on est déjà dans une liste à puces, la supprimer
                editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            } else {
                // Sinon, créer une liste à puces
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }
        } else {
            if (activeState.isInNumberedList) {
                // Si on est déjà dans une liste numérotée, la supprimer
                editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            } else {
                // Sinon, créer une liste numérotée
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }
        }

        // Mise à jour immédiate de l'état local pour un feedback instantané
        setActiveState(prev => ({
            ...prev,
            isInBulletList: listType === 'bullet' ? !wasInList : prev.isInBulletList,
            isInNumberedList: listType === 'number' ? !wasInList : prev.isInNumberedList,
        }));

        // Forcer la mise à jour complète après pour synchroniser
        setTimeout(() => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        }, 10);
    };

    const handleFontSizeChange = (newSize: string) => {
        setFontSize(newSize);

        try {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    if (selection.isCollapsed()) {
                        // Si pas de sélection, créer un petit nœud StyledText temporaire
                        // IMPORTANT : préserver la couleur actuelle du textColor state
                        const styledNode = $createStyledTextNode('\u200B', newSize, textColor);
                        selection.insertNodes([styledNode]);
                        styledNode.selectEnd();
                    } else {
                        // Si il y a une sélection, utiliser la fonction existante
                        applyFontSizeToSelection(editor, newSize);
                    }
                }
            });
        } catch (error) {
            console.error('Error applying font size:', error);
            if (process.env.NODE_ENV === 'development') {
                console.warn('Hot reload detected. Please refresh the page (Ctrl+Shift+R) to use font size changes.');
            }
        }

        // Forcer la mise à jour immédiate de l'état
        setTimeout(() => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        }, 10);
    };

    const handleColorChange = (newColor: string) => {
        setTextColor(newColor);

        try {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    if (selection.isCollapsed()) {
                        // Si pas de sélection, créer un petit nœud StyledText temporaire
                        // IMPORTANT : préserver la taille actuelle du fontSize state
                        const styledNode = $createStyledTextNode('\u200B', fontSize, newColor);
                        selection.insertNodes([styledNode]);
                        styledNode.selectEnd();
                    } else {
                        // Si il y a une sélection, utiliser la fonction existante
                        applyColorToSelection(editor, newColor);
                    }
                }
            });
        } catch (error) {
            console.error('Error applying color:', error);
            if (process.env.NODE_ENV === 'development') {
                console.warn('Hot reload detected. Please refresh the page (Ctrl+Shift+R) to use color changes.');
            }
        }

        // Forcer la mise à jour immédiate de l'état
        setTimeout(() => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        }, 10);
    };

    // Contenu de la toolbar à réutiliser
    const toolbarContent = (
        <div className={isMobile ?
            "flex flex-row gap-3 justify-center items-center max-w-4xl mx-auto" :
            "flex gap-2 items-center"
        }>
            {/* Font Size Selector */}
            {isMobile ? (
                // Version mobile avec menu déroulant vers le haut
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowFontSizeMenu(!showFontSizeMenu);
                            setShowFormatMenu(false);
                            setShowAlignMenu(false);
                            setShowListMenu(false);
                            setShowColorMenu(false);
                        }}
                        className="px-3 py-2 border rounded-lg text-sm bg-none text-white hover:bg-gray-800 transition-colors"
                        title="Changer la taille du texte"
                    >
                        {FONT_SIZES.find(size => size.value === fontSize)?.label || fontSize}
                    </button>
                    {showFontSizeMenu && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-2 flex flex-col gap-1 max-h-48 overflow-y-auto z-50">
                            {FONT_SIZES.map((size) => (
                                <button
                                    key={size.value}
                                    onClick={() => {
                                        handleFontSizeChange(size.value);
                                        setShowFontSizeMenu(false);
                                    }}
                                    className={`px-3 py-2 rounded text-sm text-left hover:bg-gray-600 transition-colors ${fontSize === size.value ? 'bg-primary text-white' : 'text-white bg-gray-700'
                                        }`}
                                >
                                    {size.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Version desktop inline (sélecteur simple)
                <select
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="px-2 py-1 border rounded text-xs text-white bg-none"
                    title="Taille"
                >
                    {FONT_SIZES.map((size) => (
                        <option key={size.value} value={size.value} className='text-black'>
                            {size.label}
                        </option>
                    ))}
                </select>
            )}

            {/* Color Selector */}
           
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowColorMenu(!showColorMenu);
                            setShowFormatMenu(false);
                            setShowAlignMenu(false);
                            setShowListMenu(false);
                            setShowFontSizeMenu(false);
                        }}
                        className="px-3 py-1 border rounded text-sm bg-none text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
                        title="Couleur du texte"
                    >
                        <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: textColor }}
                        />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                    {showColorMenu && (
                        <div className="absolute bottom-12 bg-foreground/80 rounded-2xl grid grid-cols-4 p-1 gap-2 shadow-lg w-max">
                            {TEXT_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => {
                                        handleColorChange(color.value);
                                        setShowColorMenu(false);
                                    }}
                                    className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                                    style={{ 
                                        backgroundColor: color.value,
                                        }}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    )}
                </div>
            

            {isMobile ? (
                // Version Mobile avec menus déroulants
                <>
                    {/* Menu Formatage */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowFormatMenu(!showFormatMenu);
                                setShowAlignMenu(false);
                                setShowListMenu(false);
                                setShowFontSizeMenu(false);
                                setShowColorMenu(false);
                            }}
                            className="p-2 rounded-lg bg-none hover:bg-gray-800 text-white transition-colors"
                            title="Formatage"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                            </svg>
                        </button>
                        {showFormatMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-2 flex flex-col gap-2 z-50">
                                <button
                                    onClick={() => formatText('bold')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.isBold
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Gras"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => formatText('italic')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.isItalic
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Italique"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => formatText('underline')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.isUnderline
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Souligné"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => formatText('code')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.isCode
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Code"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                        <polyline points="7 7 3 12 7 17" />
                                        <polyline points="17 7 21 12 17 17" />
                                        <path d="M10 18L14 6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Menu Alignement */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowAlignMenu(!showAlignMenu);
                                setShowFormatMenu(false);
                                setShowListMenu(false);
                                setShowFontSizeMenu(false);
                                setShowColorMenu(false);
                            }}
                            className="p-2 rounded-lg bg-none hover:bg-gray-800 text-white transition-colors"
                            title="Alignement"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
                            </svg>
                        </button>
                        {showAlignMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-2 flex flex-col gap-2 z-50">
                                <button
                                    onClick={() => formatAlignment('left')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.alignment === 'left'
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Aligner à gauche"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => formatAlignment('center')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.alignment === 'center'
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Centrer"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => formatAlignment('right')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.alignment === 'right'
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Aligner à droite"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => formatAlignment('justify')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.alignment === 'justify'
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title="Justifier"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Menu Listes */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowListMenu(!showListMenu);
                                setShowFormatMenu(false);
                                setShowAlignMenu(false);
                                setShowFontSizeMenu(false);
                                setShowColorMenu(false);
                            }}
                            className="p-2 rounded-lg bg-none hover:bg-gray-800 text-white transition-colors"
                            title="Listes"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
                            </svg>
                        </button>
                        {showListMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-2 flex flex-col gap-2 z-50">
                                <button
                                    onClick={() => insertList('bullet')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.isInBulletList
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title={activeState.isInBulletList ? 'Retirer la liste à puces' : 'Liste à puces'}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => insertList('number')}
                                    className={`p-2 rounded-lg transition-colors ${activeState.isInNumberedList
                                            ? 'bg-primary text-white hover:bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                    title={activeState.isInNumberedList ? 'Retirer la liste numérotée' : 'Liste numérotée'}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // Version Desktop inline pour ItemBar (boutons compacts)
                <>
                    {/* Text Formatting */}
                    <button
                        onClick={() => formatText('bold')}
                        className={`p-1 rounded transition-colors ${activeState.isBold
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Gras"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => formatText('italic')}
                        className={`p-1 rounded transition-colors ${activeState.isItalic
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Italique"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => formatText('underline')}
                        className={`p-1 rounded transition-colors ${activeState.isUnderline
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Souligné"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => formatText('code')}
                        className={`p-1 rounded transition-colors ${activeState.isCode
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Code"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="7 7 3 12 7 17" />
                            <polyline points="17 7 21 12 17 17" />
                            <path d="M10 18L14 6" />
                        </svg>
                    </button>

                    {/* Separator */}
                    <div className="w-px h-4 bg-none/30"></div>

                    {/* Alignment - compact */}
                    <button
                        onClick={() => formatAlignment('left')}
                        className={`p-1 rounded transition-colors ${activeState.alignment === 'left'
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Aligner à gauche"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => formatAlignment('center')}
                        className={`p-1 rounded transition-colors ${activeState.alignment === 'center'
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Centrer"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => formatAlignment('right')}
                        className={`p-1 rounded transition-colors ${activeState.alignment === 'right'
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Aligner à droite"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => formatAlignment('justify')}
                        className={`p-1 rounded transition-colors ${activeState.alignment === 'justify'
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title="Justifier"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" />
                        </svg>
                    </button>

                    {/* Separator */}
                    <div className="w-px h-4 bg-none/30"></div>

                    {/* Lists - compact */}
                    <button
                        onClick={() => insertList('bullet')}
                        className={`p-1 rounded transition-colors ${activeState.isInBulletList
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title={activeState.isInBulletList ? 'Retirer la liste à puces' : 'Liste à puces'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => insertList('number')}
                        className={`p-1 rounded transition-colors ${activeState.isInNumberedList
                                ? 'bg-gray-800 text-white'
                                : 'text-white hover:bg-gray-800 hover:text-white'
                            }`}
                        title={activeState.isInNumberedList ? 'Retirer la liste numérotée' : 'Liste numérotée'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );

    // Retour conditionnel : portail pour desktop, affichage normal pour mobile
    if (isMobile) {
        // Version mobile : toolbar fixe en bas
        return (
            <div className="fixed w-fit bottom-4 left-1/2 transform -translate-x-1/2 border-t shadow-lg p-2 z-50 rounded-2xl md:bottom-0 md:left-0 md:right-0 md:rounded-none md:bg-none md:border-t"
                style={{ background: '#000000cc' }}>
                {toolbarContent}
            </div>
        );
    } else {
        // Version desktop : UNIQUEMENT portail vers ItemBar si on possède le verrou
        if (desktopContainer && isDesktopToolbarOwner) {
            return createPortal(toolbarContent, desktopContainer);
        } else {
            // Pas de conteneur ou pas le propriétaire du verrou, ne rien afficher
            return null;
        }
    }
}