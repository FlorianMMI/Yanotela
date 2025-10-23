import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isTextNode, TextNode } from 'lexical';
import { useEffect } from 'react';
import { $createFontSizeNode, $isFontSizeNode, FontSizeNode } from './FontSizeNode';

/**
 * Plugin qui préserve les FontSizeNode quand des formats sont appliqués.
 * Ce plugin empêche Lexical de transformer les FontSizeNode en TextNode standards
 * lors de l'application de formats (bold, italic, etc.)
 */
export function FontSizePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Enregistrer une transformation de nœud pour préserver FontSizeNode
    return editor.registerNodeTransform(TextNode, (node: TextNode) => {
      // Si le nœud est déjà un FontSizeNode, ne rien faire
      if ($isFontSizeNode(node)) {
        return;
      }

      // Vérifier si le nœud parent ou précédent était un FontSizeNode
      const parent = node.getParent();
      const previousSibling = node.getPreviousSibling();
      const nextSibling = node.getNextSibling();

      // Si un sibling est un FontSizeNode avec la même taille, on fusionne
      if ($isFontSizeNode(previousSibling)) {
        const prevFontSize = (previousSibling as FontSizeNode).getFontSize();
        // Convertir ce nœud TextNode en FontSizeNode avec la même taille
        if (node.getTextContent().length > 0) {
          const fontSizeNode = $createFontSizeNode(
            node.getTextContent(),
            prevFontSize
          );
          fontSizeNode.setFormat(node.getFormat());
          fontSizeNode.setDetail(node.getDetail());
          fontSizeNode.setMode(node.getMode());
          fontSizeNode.setStyle(node.getStyle());
          node.replace(fontSizeNode);
        }
      } else if ($isFontSizeNode(nextSibling) && !previousSibling) {
        const nextFontSize = (nextSibling as FontSizeNode).getFontSize();
        // Convertir ce nœud TextNode en FontSizeNode avec la même taille
        if (node.getTextContent().length > 0) {
          const fontSizeNode = $createFontSizeNode(
            node.getTextContent(),
            nextFontSize
          );
          fontSizeNode.setFormat(node.getFormat());
          fontSizeNode.setDetail(node.getDetail());
          fontSizeNode.setMode(node.getMode());
          fontSizeNode.setStyle(node.getStyle());
          node.replace(fontSizeNode);
        }
      }
    });
  }, [editor]);

  return null;
}
