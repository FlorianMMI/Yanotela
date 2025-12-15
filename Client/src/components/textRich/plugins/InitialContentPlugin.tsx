/**
 * Plugin pour initialiser le contenu de l'éditeur depuis le JSON Lexical
 * Utilisé uniquement si le document YJS est vide (première ouverture après transfert de flashnote)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";
import { $getRoot, $createParagraphNode, $createTextNode, $isElementNode } from "lexical";

interface InitialContentPluginProps {
  content: string | null;
  noteId: string;
}

export default function InitialContentPlugin({ content, noteId }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!content || hasInitialized) return;

    // Attendre un peu que le CollaborationPlugin se connecte et vérifie le Y.Doc
    const timeout = setTimeout(() => {
      editor.update(() => {
        const root = $getRoot();
        
        // Si le root n'est pas vide, le serveur YJS a déjà du contenu → ne rien faire
        if (root.getChildrenSize() > 0) {
          const firstChild = root.getFirstChild();
          // Vérifier si le contenu est vraiment vide (paragraph vide avec text vide)
          if (firstChild && $isElementNode(firstChild) && firstChild.getChildrenSize() > 0) {
            console.log(`[InitialContent] Document déjà rempli par YJS pour note ${noteId}`);
            setHasInitialized(true);
            return;
          }
        }

        // Le document est vide → charger depuis le Content JSON
        try {
          const parsedContent = JSON.parse(content);
          
          if (parsedContent.root && parsedContent.root.children) {
            console.log(`[InitialContent] Initialisation du contenu pour note ${noteId} (${content.length} chars)`);
            
            // Vider le root actuel
            root.clear();
            
            // Parcourir les children de root et les recréer
            parsedContent.root.children.forEach((childNode: any) => {
              try {
                if (childNode.type === "paragraph") {
                  const paragraph = $createParagraphNode();
                  
                  if (childNode.children && Array.isArray(childNode.children)) {
                    childNode.children.forEach((textNode: any) => {
                      if (textNode.type === "text" && textNode.text) {
                        const text = $createTextNode(textNode.text);
                        
                        // Appliquer le formatage si présent
                        if (textNode.format) {
                          if (textNode.format & 1) text.toggleFormat('bold');
                          if (textNode.format & 2) text.toggleFormat('italic');
                          if (textNode.format & 4) text.toggleFormat('underline');
                        }
                        
                        paragraph.append(text);
                      }
                    });
                  }
                  
                  root.append(paragraph);
                } else {
                  // Pour les autres types de nodes, créer un paragraph simple avec le texte
                  console.warn(`[InitialContent] Type de node non supporté: ${childNode.type}`);
                }
              } catch (nodeError) {
                console.error(`[InitialContent] Erreur lors de la création d'un node:`, nodeError);
              }
            });
            
            setHasInitialized(true);
          }
        } catch (error) {
          console.error(`[InitialContent] Erreur lors du parsing du contenu JSON:`, error);
          
          // Fallback: créer un paragraph vide
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          setHasInitialized(true);
        }
      });
    }, 500); // Attendre 500ms que YJS sync le document

    return () => clearTimeout(timeout);
  }, [editor, content, noteId, hasInitialized]);

  return null;
}
