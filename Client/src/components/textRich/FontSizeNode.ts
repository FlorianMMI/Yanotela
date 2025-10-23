import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMConversionOutput,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
  TextNode,
  TextFormatType,
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
    const clonedNode = new FontSizeNode(node.__text, node.__fontSize, node.__key);
    // Copier tous les attributs du TextNode parent
    clonedNode.__format = node.__format;
    clonedNode.__detail = node.__detail;
    clonedNode.__mode = node.__mode;
    clonedNode.__style = node.__style;
    return clonedNode;
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
    prevNode: TextNode,
    dom: HTMLElement,
    config: any
  ): boolean {
    // @ts-expect-error - TypeScript limitation with generic 'this' type
    const isUpdated: boolean = super.updateDOM(prevNode, dom, config);
    if ($isFontSizeNode(prevNode) && (prevNode as FontSizeNode).__fontSize !== this.__fontSize) {
      dom.style.fontSize = this.__fontSize;
      // Supprimer l'ancienne classe
      dom.classList.remove(`editor-text-${(prevNode as FontSizeNode).__fontSize.replace('px', '')}px`);
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

  // Override setFormat pour préserver la taille de police lors des changements de format
  setFormat(format: number): this {
    const self = super.setFormat(format);
    return self;
  }

  // Override toggleFormat pour préserver la taille de police
  toggleFormat(type: TextFormatType): this {
    const self = super.toggleFormat(type);
    return self;
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