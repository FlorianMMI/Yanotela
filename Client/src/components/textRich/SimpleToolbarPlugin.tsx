import React, { useCallback, useEffect, useState } from 'react';
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
import { applyFontSizeToSelection } from './fontSizeUtils';
import { $createFontSizeNode } from './FontSizeNode';

const FONT_SIZES = [
    { label: 'Petit', value: '14px' },
    { label: 'Normal', value: '16px' },
    { label: 'Grand', value: '20px' },
    { label: 'Très Grand', value: '24px' },
];

interface ToolbarState {
    isBold: boolean;
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
        isItalic: false,
        isUnderline: false,
        isInBulletList: false,
        isInNumberedList: false,
        alignment: '',
    });
    const [fontSize, setFontSize] = useState('16px');
    
    // États pour les menus déroulants mobile
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [showListMenu, setShowListMenu] = useState(false);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Détecter si on est sur mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            // Méthode plus simple pour détecter les listes et l'alignement
            let isInBulletList = false;
            let isInNumberedList = false;
            let alignment: 'left' | 'center' | 'right' | 'justify' | '' = '';
            let currentFontSize = '16px'; // Taille par défaut
            
            try {
                const anchorNode = selection.anchor.getNode();
                // Parcourir les parents pour trouver un ListNode et récupérer l'alignement
                let currentNode = anchorNode;
                
                // Détecter la taille de police actuelle du nœud courant
                if (anchorNode.getType() === 'fontsize') {
                    // @ts-ignore - Accès à la propriété fontSize de FontSizeNode
                    currentFontSize = anchorNode.__fontSize || '16px';
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
                isItalic: selection.hasFormat('italic'),
                isUnderline: selection.hasFormat('underline'),
                isInBulletList,
                isInNumberedList,
                alignment,
            });
            
            // Mettre à jour la taille de police affichée dans le sélecteur
            setFontSize(currentFontSize);
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

    const formatText = (format: 'bold' | 'italic' | 'underline') => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
        
        // Mise à jour immédiate de l'état local pour un feedback instantané
        setActiveState(prev => ({
            ...prev,
            [format === 'bold' ? 'isBold' : format === 'italic' ? 'isItalic' : 'isUnderline']: !prev[format === 'bold' ? 'isBold' : format === 'italic' ? 'isItalic' : 'isUnderline']
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
        
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                if (selection.isCollapsed()) {
                    // Si pas de sélection, créer un petit nœud FontSize temporaire
                    // qui sera étendu quand l'utilisateur tape
                    const fontSizeNode = $createFontSizeNode('\u200B', newSize); // Zero-width space
                    selection.insertNodes([fontSizeNode]);
                    // Positionner le curseur à la fin du nœud
                    fontSizeNode.selectEnd();
                } else {
                    // Si il y a une sélection, utiliser la fonction existante
                    applyFontSizeToSelection(editor, newSize);
                }
            }
        });
        
        // Forcer la mise à jour immédiate de l'état
        setTimeout(() => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        }, 10);
    };

    // Toujours afficher la toolbar en bas de page avec des SVG
    return (
        <div className="fixed bottom-4 left-4 right-4 border-t shadow-lg p-2 z-50 rounded-2xl md:bottom-0 md:left-0 md:right-0 md:rounded-none md:bg-white md:border-t" 
             style={{ background: '#0000005c' }}>
            <div className="flex flex-wrap gap-3 justify-center items-center max-w-4xl mx-auto">
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
                            }}
                            className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-100 transition-colors"
                            title="Changer la taille du texte"
                        >
                            {FONT_SIZES.find(size => size.value === fontSize)?.label || fontSize}
                        </button>
                        {showFontSizeMenu && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                                {FONT_SIZES.map((size) => (
                                    <button
                                        key={size.value}
                                        onClick={() => {
                                            handleFontSizeChange(size.value);
                                            setShowFontSizeMenu(false);
                                        }}
                                        className={`px-3 py-2 rounded text-sm text-left hover:bg-gray-100 transition-colors ${
                                            fontSize === size.value ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                                        }`}
                                    >
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Version desktop avec select classique
                    <select
                        value={fontSize}
                        onChange={(e) => handleFontSizeChange(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm bg-white"
                        title="Changer la taille du texte sélectionné"
                    >
                        {FONT_SIZES.map((size) => (
                            <option key={size.value} value={size.value}>
                                {size.label}
                            </option>
                        ))}
                    </select>
                )}

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
                                }}
                                className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 transition-colors"
                                title="Formatage"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                                </svg>
                            </button>
                            {showFormatMenu && (
                                <div className="fixed bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex flex-col gap-2">
                                    <button
                                        onClick={() => formatText('bold')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.isBold 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title="Gras"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => formatText('italic')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.isItalic 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title="Italique"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => formatText('underline')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.isUnderline 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title="Souligné"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
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
                                }}
                                className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 transition-colors"
                                title="Alignement"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
                                </svg>
                            </button>
                            {showAlignMenu && (
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex flex-col gap-2">
                                    <button
                                        onClick={() => formatAlignment('left')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.alignment === 'left' 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title="Aligner à gauche"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => formatAlignment('center')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.alignment === 'center' 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title="Centrer"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => formatAlignment('right')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.alignment === 'right' 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title="Aligner à droite"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => formatAlignment('justify')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.alignment === 'justify' 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title="Justifier"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
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
                                }}
                                className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-700 transition-colors"
                                title="Listes"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                                </svg>
                            </button>
                            {showListMenu && (
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex flex-col gap-2">
                                    <button
                                        onClick={() => insertList('bullet')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.isInBulletList 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title={activeState.isInBulletList ? 'Retirer la liste à puces' : 'Liste à puces'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => insertList('number')}
                                        className={`p-2 rounded-lg transition-colors ${
                                            activeState.isInNumberedList 
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                        title={activeState.isInNumberedList ? 'Retirer la liste numérotée' : 'Liste numérotée'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Version Desktop (comme avant)
                    <>
                        {/* Text Formatting */}
                        <button
                            onClick={() => formatText('bold')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.isBold 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Gras"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => formatText('italic')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.isItalic 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Italique"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => formatText('underline')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.isUnderline 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Souligné"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
                            </svg>
                        </button>

                        {/* Separator */}
                        <div className="w-px h-6 bg-gray-300"></div>

                        {/* Alignment */}
                        <button
                            onClick={() => formatAlignment('left')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.alignment === 'left' 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Aligner à gauche"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => formatAlignment('center')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.alignment === 'center' 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Centrer"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => formatAlignment('right')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.alignment === 'right' 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Aligner à droite"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => formatAlignment('justify')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.alignment === 'justify' 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Justifier"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
                            </svg>
                        </button>

                        {/* Separator */}
                        <div className="w-px h-6 bg-gray-300"></div>

                        {/* Lists */}
                        <button
                            onClick={() => insertList('bullet')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.isInBulletList 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title={activeState.isInBulletList ? 'Retirer la liste à puces' : 'Liste à puces'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => insertList('number')}
                            className={`p-2 rounded-lg transition-colors ${
                                activeState.isInNumberedList 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title={activeState.isInNumberedList ? 'Retirer la liste numérotée' : 'Liste numérotée'}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}