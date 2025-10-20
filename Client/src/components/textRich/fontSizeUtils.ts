import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  LexicalEditor,
  TextNode,
} from 'lexical';
import { $createFontSizeNode, $isFontSizeNode, FontSizeNode } from './FontSizeNode';

export function $applyFontSize(fontSize: string): void {
  const selection = $getSelection();
  
  if (!$isRangeSelection(selection)) {
    return;
  }

  if (selection.isCollapsed()) {
    // Si pas de sélection, ne rien faire pour l'instant
    return;
  }

  const nodes = selection.getNodes();
  const anchor = selection.anchor;
  const focus = selection.focus;
  const isBackward = selection.isBackward();
  const startPoint = isBackward ? focus : anchor;
  const endPoint = isBackward ? anchor : focus;

  let firstIndex = 0;
  let firstNode = nodes[0];
  let lastIndex = nodes.length - 1;
  let lastNode = nodes[lastIndex];

  // Gérer le premier nœud
  if ($isTextNode(firstNode)) {
    const startOffset = startPoint.offset;
    const textContent = firstNode.getTextContent();
    
    if (startOffset === 0) {
      // Convertir le nœud entier
      if ($isFontSizeNode(firstNode)) {
        (firstNode as FontSizeNode).setFontSize(fontSize);
      } else {
        const fontSizeNode = $createFontSizeNode(textContent, fontSize);
        fontSizeNode.setFormat((firstNode as TextNode).getFormat());
        firstNode.replace(fontSizeNode);
      }
    } else {
      // Diviser le nœud
      const splitNodes = (firstNode as TextNode).splitText(startOffset);
      const nodeToFormat = splitNodes[1] || splitNodes[0];
      
      if (nodeToFormat && $isTextNode(nodeToFormat)) {
        const fontSizeNode = $createFontSizeNode(
          nodeToFormat.getTextContent(),
          fontSize
        );
        fontSizeNode.setFormat(nodeToFormat.getFormat());
        nodeToFormat.replace(fontSizeNode);
      }
    }
  }

  // Gérer les nœuds du milieu
  for (let i = firstIndex + 1; i < lastIndex; i++) {
    const node = nodes[i];
    if ($isTextNode(node)) {
      if ($isFontSizeNode(node)) {
        (node as FontSizeNode).setFontSize(fontSize);
      } else {
        const fontSizeNode = $createFontSizeNode(
          node.getTextContent(),
          fontSize
        );
        fontSizeNode.setFormat((node as TextNode).getFormat());
        node.replace(fontSizeNode);
      }
    }
  }

  // Gérer le dernier nœud (si différent du premier)
  if (lastIndex > firstIndex && $isTextNode(lastNode)) {
    const endOffset = endPoint.offset;
    const textContent = lastNode.getTextContent();
    
    if (endOffset === textContent.length) {
      // Convertir le nœud entier
      if ($isFontSizeNode(lastNode)) {
        (lastNode as FontSizeNode).setFontSize(fontSize);
      } else {
        const fontSizeNode = $createFontSizeNode(textContent, fontSize);
        fontSizeNode.setFormat((lastNode as TextNode).getFormat());
        lastNode.replace(fontSizeNode);
      }
    } else {
      // Diviser le nœud
      const splitNodes = (lastNode as TextNode).splitText(endOffset);
      const nodeToFormat = splitNodes[0];
      
      if (nodeToFormat && $isTextNode(nodeToFormat)) {
        const fontSizeNode = $createFontSizeNode(
          nodeToFormat.getTextContent(),
          fontSize
        );
        fontSizeNode.setFormat(nodeToFormat.getFormat());
        nodeToFormat.replace(fontSizeNode);
      }
    }
  }
}

export function applyFontSizeToSelection(editor: LexicalEditor, fontSize: string): void {
  editor.update(() => {
    $applyFontSize(fontSize);
  });
}