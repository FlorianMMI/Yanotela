import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMConversionOutput,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
  TextNode,
} from 'lexical';

export type SerializedFontSizeNode = Spread<
  {
    fontSize: string;
  },
  SerializedTextNode
>;

export class FontSizeNode extends TextNode {
  __fontSize: string;

  static getType(): string {
    return 'fontsize';
  }

  static clone(node: FontSizeNode): FontSizeNode {
    return new FontSizeNode(node.__text, node.__fontSize, node.__key);
  }

  constructor(text: string, fontSize: string, key?: NodeKey) {
    super(text, key);
    this.__fontSize = fontSize;
  }

  createDOM(config: any, editor: any): HTMLElement {
    const element = super.createDOM(config, editor);
    element.style.fontSize = this.__fontSize;
    element.classList.add(`editor-text-${this.__fontSize.replace('px', '')}px`);
    return element;
  }

  updateDOM(
    prevNode: FontSizeNode,
    dom: HTMLElement,
    config: any
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__fontSize !== this.__fontSize) {
      dom.style.fontSize = this.__fontSize;
      // Supprimer l'ancienne classe
      dom.classList.remove(`editor-text-${prevNode.__fontSize.replace('px', '')}px`);
      // Ajouter la nouvelle classe
      dom.classList.add(`editor-text-${this.__fontSize.replace('px', '')}px`);
    }
    return isUpdated;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: Node) => ({
        conversion: convertFontSizeElement,
        priority: 1,
      }),
    };
  }

  exportJSON(): SerializedFontSizeNode {
    return {
      ...super.exportJSON(),
      fontSize: this.__fontSize,
      type: 'fontsize',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedFontSizeNode): FontSizeNode {
    const { text, fontSize } = serializedNode;
    const node = $createFontSizeNode(text, fontSize);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  getFontSize(): string {
    return this.__fontSize;
  }

  setFontSize(fontSize: string): this {
    const writable = this.getWritable();
    writable.__fontSize = fontSize;
    return writable;
  }
}

function convertFontSizeElement(element: HTMLElement): DOMConversionOutput {
  const fontSize = element.style.fontSize;
  if (fontSize) {
    const node = $createFontSizeNode(element.textContent || '', fontSize);
    return { node };
  }
  return { node: null };
}

export function $createFontSizeNode(text: string, fontSize: string): FontSizeNode {
  return $applyNodeReplacement(new FontSizeNode(text, fontSize));
}

export function $isFontSizeNode(node: LexicalNode | null | undefined): node is FontSizeNode {
  return node instanceof FontSizeNode;
}