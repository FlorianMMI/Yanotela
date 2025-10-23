import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isTextNode, TextNode } from 'lexical';
import { useEffect } from 'react';
import { $createStyledTextNode, $isStyledTextNode, StyledTextNode } from './StyledTextNode';
import { $isFontSizeNode, FontSizeNode } from './FontSizeNode';
import { $isColorNode, ColorNode } from './ColorNode';

/**
 * Plugin qui préserve les StyledTextNode quand des formats sont appliqués.
 * Ce plugin empêche Lexical de transformer les StyledTextNode en TextNode standards
 * lors de l'application de formats (bold, italic, etc.)
 */
export function StyledTextPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Enregistrer des transformations pour convertir automatiquement les anciens nœuds
    const unregisterFontSize = editor.registerNodeTransform(FontSizeNode, (node: FontSizeNode) => {
      // Convertir FontSizeNode en StyledTextNode
      const styledNode = $createStyledTextNode(
        node.getTextContent(),
        node.getFontSize(),
        undefined
      );
      styledNode.setFormat(node.getFormat());
      styledNode.setDetail(node.getDetail());
      styledNode.setMode(node.getMode());
      styledNode.setStyle(node.getStyle());
      node.replace(styledNode);
    });

    const unregisterColor = editor.registerNodeTransform(ColorNode, (node: ColorNode) => {
      // Convertir ColorNode en StyledTextNode
      const styledNode = $createStyledTextNode(
        node.getTextContent(),
        undefined,
        node.getColor()
      );
      styledNode.setFormat(node.getFormat());
      styledNode.setDetail(node.getDetail());
      styledNode.setMode(node.getMode());
      styledNode.setStyle(node.getStyle());
      node.replace(styledNode);
    });

    const unregisterText = editor.registerNodeTransform(TextNode, (node: TextNode) => {
      // Si le nœud est déjà un StyledTextNode, FontSizeNode ou ColorNode, ne rien faire
      if ($isStyledTextNode(node) || $isFontSizeNode(node) || $isColorNode(node)) {
        return;
      }

      // Vérifier si le nœud parent ou précédent était un StyledTextNode
      const previousSibling = node.getPreviousSibling();
      const nextSibling = node.getNextSibling();

      // Si un sibling est un StyledTextNode avec les mêmes styles, on fusionne
      if ($isStyledTextNode(previousSibling)) {
        const prev = previousSibling as StyledTextNode;
        const prevFontSize = prev.getFontSize();
        const prevColor = prev.getColor();
        
        // Convertir ce nœud TextNode en StyledTextNode avec les mêmes styles
        if (node.getTextContent().length > 0) {
          const styledNode = $createStyledTextNode(
            node.getTextContent(),
            prevFontSize,
            prevColor
          );
          styledNode.setFormat(node.getFormat());
          styledNode.setDetail(node.getDetail());
          styledNode.setMode(node.getMode());
          styledNode.setStyle(node.getStyle());
          node.replace(styledNode);
        }
      } else if ($isStyledTextNode(nextSibling) && !previousSibling) {
        const next = nextSibling as StyledTextNode;
        const nextFontSize = next.getFontSize();
        const nextColor = next.getColor();
        
        // Convertir ce nœud TextNode en StyledTextNode avec les mêmes styles
        if (node.getTextContent().length > 0) {
          const styledNode = $createStyledTextNode(
            node.getTextContent(),
            nextFontSize,
            nextColor
          );
          styledNode.setFormat(node.getFormat());
          styledNode.setDetail(node.getDetail());
          styledNode.setMode(node.getMode());
          styledNode.setStyle(node.getStyle());
          node.replace(styledNode);
        }
      }
    });

    return () => {
      unregisterFontSize();
      unregisterColor();
      unregisterText();
    };
  }, [editor]);

  return null;
}
