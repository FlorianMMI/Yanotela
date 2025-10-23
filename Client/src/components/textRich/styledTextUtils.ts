import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  LexicalEditor,
  TextNode,
} from 'lexical';
import { $createStyledTextNode, $isStyledTextNode, StyledTextNode } from './StyledTextNode';
import { $isFontSizeNode, FontSizeNode } from './FontSizeNode';
import { $isColorNode, ColorNode } from './ColorNode';

export function $applyFontSize(fontSize: string): void {
  const selection = $getSelection();
  
  if (!$isRangeSelection(selection)) {
    return;
  }

  if (selection.isCollapsed()) {
    return;
  }

  const nodes = selection.getNodes();

  // Parcourir tous les nœuds et appliquer la taille
  nodes.forEach(node => {
    if (!$isTextNode(node)) {
      return;
    }

    const format = (node as TextNode).getFormat();
    let existingColor: string | undefined = undefined;
    
    // Récupérer la couleur existante de n'importe quel type de nœud
    if ($isStyledTextNode(node)) {
      existingColor = (node as StyledTextNode).getColor();
    } else if ($isColorNode(node)) {
      existingColor = (node as ColorNode).getColor();
    }
    
    // TOUJOURS créer un nouveau StyledTextNode (ne jamais modifier en place)
    const styledNode = $createStyledTextNode(
      node.getTextContent(),
      fontSize,
      existingColor
    );
    styledNode.setFormat(format);
    node.replace(styledNode);
  });
}

export function $applyColor(color: string): void {
  const selection = $getSelection();
  
  if (!$isRangeSelection(selection)) {
    return;
  }

  if (selection.isCollapsed()) {
    return;
  }

  const nodes = selection.getNodes();

  // Parcourir tous les nœuds et appliquer la couleur
  nodes.forEach(node => {
    if (!$isTextNode(node)) {
      return;
    }

    const format = (node as TextNode).getFormat();
    let existingFontSize: string | undefined = undefined;
    
    // Récupérer la taille existante de n'importe quel type de nœud
    if ($isStyledTextNode(node)) {
      existingFontSize = (node as StyledTextNode).getFontSize();
    } else if ($isFontSizeNode(node)) {
      existingFontSize = (node as FontSizeNode).getFontSize();
    }
    
    // TOUJOURS créer un nouveau StyledTextNode (ne jamais modifier en place)
    const styledNode = $createStyledTextNode(
      node.getTextContent(),
      existingFontSize,
      color
    );
    styledNode.setFormat(format);
    node.replace(styledNode);
  });
}

export function applyFontSizeToSelection(editor: LexicalEditor, fontSize: string): void {
  editor.update(() => {
    $applyFontSize(fontSize);
  });
}

export function applyColorToSelection(editor: LexicalEditor, color: string): void {
  editor.update(() => {
    $applyColor(color);
  });
}
