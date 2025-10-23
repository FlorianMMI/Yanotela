import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isTextNode, TextNode } from 'lexical';
import { useEffect } from 'react';
import { $createColorNode, $isColorNode, ColorNode } from './ColorNode';

/**
 * Plugin qui préserve les ColorNode quand des formats sont appliqués.
 * Ce plugin empêche Lexical de transformer les ColorNode en TextNode standards
 * lors de l'application de formats (bold, italic, etc.)
 */
export function ColorPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Enregistrer une transformation de nœud pour préserver ColorNode
    return editor.registerNodeTransform(TextNode, (node: TextNode) => {
      // Si le nœud est déjà un ColorNode, ne rien faire
      if ($isColorNode(node)) {
        return;
      }

      // Vérifier si le nœud parent ou précédent était un ColorNode
      const previousSibling = node.getPreviousSibling();
      const nextSibling = node.getNextSibling();

      // Si un sibling est un ColorNode avec la même couleur, on fusionne
      if ($isColorNode(previousSibling)) {
        const prevColor = (previousSibling as ColorNode).getColor();
        // Convertir ce nœud TextNode en ColorNode avec la même couleur
        if (node.getTextContent().length > 0) {
          const colorNode = $createColorNode(
            node.getTextContent(),
            prevColor
          );
          colorNode.setFormat(node.getFormat());
          colorNode.setDetail(node.getDetail());
          colorNode.setMode(node.getMode());
          colorNode.setStyle(node.getStyle());
          node.replace(colorNode);
        }
      } else if ($isColorNode(nextSibling) && !previousSibling) {
        const nextColor = (nextSibling as ColorNode).getColor();
        // Convertir ce nœud TextNode en ColorNode avec la même couleur
        if (node.getTextContent().length > 0) {
          const colorNode = $createColorNode(
            node.getTextContent(),
            nextColor
          );
          colorNode.setFormat(node.getFormat());
          colorNode.setDetail(node.getDetail());
          colorNode.setMode(node.getMode());
          colorNode.setStyle(node.getStyle());
          node.replace(colorNode);
        }
      }
    });
  }, [editor]);

  return null;
}
