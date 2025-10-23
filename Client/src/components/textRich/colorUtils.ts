import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  LexicalEditor,
  TextNode,
} from 'lexical';
import { $createColorNode, $isColorNode, ColorNode } from './ColorNode';

export function $applyColor(color: string): void {
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
      if ($isColorNode(firstNode)) {
        (firstNode as ColorNode).setColor(color);
      } else {
        const colorNode = $createColorNode(textContent, color);
        colorNode.setFormat((firstNode as TextNode).getFormat());
        firstNode.replace(colorNode);
      }
    } else {
      // Diviser le nœud
      const splitNodes = (firstNode as TextNode).splitText(startOffset);
      const nodeToFormat = splitNodes[1] || splitNodes[0];
      
      if (nodeToFormat && $isTextNode(nodeToFormat)) {
        const colorNode = $createColorNode(
          nodeToFormat.getTextContent(),
          color
        );
        colorNode.setFormat(nodeToFormat.getFormat());
        nodeToFormat.replace(colorNode);
      }
    }
  }

  // Gérer les nœuds du milieu
  for (let i = firstIndex + 1; i < lastIndex; i++) {
    const node = nodes[i];
    if ($isTextNode(node)) {
      if ($isColorNode(node)) {
        (node as ColorNode).setColor(color);
      } else {
        const colorNode = $createColorNode(
          node.getTextContent(),
          color
        );
        colorNode.setFormat((node as TextNode).getFormat());
        node.replace(colorNode);
      }
    }
  }

  // Gérer le dernier nœud (si différent du premier)
  if (lastIndex > firstIndex && $isTextNode(lastNode)) {
    const endOffset = endPoint.offset;
    const textContent = lastNode.getTextContent();
    
    if (endOffset === textContent.length) {
      // Convertir le nœud entier
      if ($isColorNode(lastNode)) {
        (lastNode as ColorNode).setColor(color);
      } else {
        const colorNode = $createColorNode(textContent, color);
        colorNode.setFormat((lastNode as TextNode).getFormat());
        lastNode.replace(colorNode);
      }
    } else {
      // Diviser le nœud
      const splitNodes = (lastNode as TextNode).splitText(endOffset);
      const nodeToFormat = splitNodes[0];
      
      if (nodeToFormat && $isTextNode(nodeToFormat)) {
        const colorNode = $createColorNode(
          nodeToFormat.getTextContent(),
          color
        );
        colorNode.setFormat(nodeToFormat.getFormat());
        nodeToFormat.replace(colorNode);
      }
    }
  }
}

export function applyColorToSelection(editor: LexicalEditor, color: string): void {
  editor.update(() => {
    $applyColor(color);
  });
}
