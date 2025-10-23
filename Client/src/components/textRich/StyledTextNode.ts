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

export type SerializedStyledTextNode = Spread<
  {
    fontSize?: string;
    color?: string;
  },
  SerializedTextNode
>;

export class StyledTextNode extends TextNode {
  __fontSize?: string;
  __color?: string;

  static getType(): string {
    return 'styled-text';
  }

  static clone(node: StyledTextNode): StyledTextNode {
    const clonedNode = new StyledTextNode(node.__text, node.__fontSize, node.__color, node.__key);
    // Copier tous les attributs du TextNode parent
    clonedNode.__format = node.__format;
    clonedNode.__detail = node.__detail;
    clonedNode.__mode = node.__mode;
    clonedNode.__style = node.__style;
    return clonedNode;
  }

  constructor(text: string, fontSize?: string, color?: string, key?: NodeKey) {
    super(text, key);
    this.__fontSize = fontSize;
    this.__color = color;
  }

  createDOM(config: any, editor: any): HTMLElement {
    const element = super.createDOM(config, editor);
    if (this.__fontSize) {
      element.style.fontSize = this.__fontSize;
      element.classList.add(`editor-text-${this.__fontSize.replace('px', '')}px`);
    }
    if (this.__color) {
      element.style.color = this.__color;
    }
    return element;
  }

  updateDOM(
    prevNode: TextNode,
    dom: HTMLElement,
    config: any
  ): boolean {
    // @ts-expect-error - TypeScript limitation with generic 'this' type
    const isUpdated: boolean = super.updateDOM(prevNode, dom, config);
    
    if ($isStyledTextNode(prevNode)) {
      const prev = prevNode as StyledTextNode;
      
      // Mettre à jour la taille de police
      if (prev.__fontSize !== this.__fontSize) {
        if (prev.__fontSize) {
          dom.classList.remove(`editor-text-${prev.__fontSize.replace('px', '')}px`);
        }
        if (this.__fontSize) {
          dom.style.fontSize = this.__fontSize;
          dom.classList.add(`editor-text-${this.__fontSize.replace('px', '')}px`);
        } else {
          dom.style.fontSize = '';
        }
      }
      
      // Mettre à jour la couleur
      if (prev.__color !== this.__color) {
        if (this.__color) {
          dom.style.color = this.__color;
        } else {
          dom.style.color = '';
        }
      }
    }
    
    return isUpdated;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: Node) => ({
        conversion: convertStyledTextElement,
        priority: 1,
      }),
    };
  }

  exportJSON(): SerializedStyledTextNode {
    return {
      ...super.exportJSON(),
      fontSize: this.__fontSize,
      color: this.__color,
      type: 'styled-text',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedStyledTextNode): StyledTextNode {
    const { text, fontSize, color } = serializedNode;
    const node = $createStyledTextNode(text, fontSize, color);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  getFontSize(): string | undefined {
    return this.__fontSize;
  }

  setFontSize(fontSize: string | undefined): this {
    const writable = this.getWritable();
    writable.__fontSize = fontSize;
    return writable;
  }

  getColor(): string | undefined {
    return this.__color;
  }

  setColor(color: string | undefined): this {
    const writable = this.getWritable();
    writable.__color = color;
    return writable;
  }

  // Override setFormat pour préserver les styles lors des changements de format
  setFormat(format: number): this {
    const self = super.setFormat(format);
    return self;
  }

  // Override toggleFormat pour préserver les styles
  toggleFormat(type: TextFormatType): this {
    const self = super.toggleFormat(type);
    return self;
  }
}

function convertStyledTextElement(element: HTMLElement): DOMConversionOutput {
  const fontSize = element.style.fontSize;
  const color = element.style.color;
  
  if (fontSize || color) {
    const node = $createStyledTextNode(element.textContent || '', fontSize, color);
    return { node };
  }
  return { node: null };
}

export function $createStyledTextNode(text: string, fontSize?: string, color?: string): StyledTextNode {
  return $applyNodeReplacement(new StyledTextNode(text, fontSize, color));
}

export function $isStyledTextNode(node: LexicalNode | null | undefined): node is StyledTextNode {
  return node instanceof StyledTextNode;
}
