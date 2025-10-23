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

export type SerializedColorNode = Spread<
  {
    color: string;
  },
  SerializedTextNode
>;

export class ColorNode extends TextNode {
  __color: string;

  static getType(): string {
    return 'color';
  }

  static clone(node: ColorNode): ColorNode {
    const clonedNode = new ColorNode(node.__text, node.__color, node.__key);
    // Copier tous les attributs du TextNode parent
    clonedNode.__format = node.__format;
    clonedNode.__detail = node.__detail;
    clonedNode.__mode = node.__mode;
    clonedNode.__style = node.__style;
    return clonedNode;
  }

  constructor(text: string, color: string, key?: NodeKey) {
    super(text, key);
    this.__color = color;
  }

  createDOM(config: any, editor: any): HTMLElement {
    const element = super.createDOM(config, editor);
    element.style.color = this.__color;
    return element;
  }

  updateDOM(
    prevNode: TextNode,
    dom: HTMLElement,
    config: any
  ): boolean {
    // @ts-expect-error - TypeScript limitation with generic 'this' type
    const isUpdated: boolean = super.updateDOM(prevNode, dom, config);
    if ($isColorNode(prevNode) && (prevNode as ColorNode).__color !== this.__color) {
      dom.style.color = this.__color;
    }
    return isUpdated;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: Node) => ({
        conversion: convertColorElement,
        priority: 1,
      }),
    };
  }

  exportJSON(): SerializedColorNode {
    return {
      ...super.exportJSON(),
      color: this.__color,
      type: 'color',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedColorNode): ColorNode {
    const { text, color } = serializedNode;
    const node = $createColorNode(text, color);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  getColor(): string {
    return this.__color;
  }

  setColor(color: string): this {
    const writable = this.getWritable();
    writable.__color = color;
    return writable;
  }

  // Override setFormat pour préserver la couleur lors des changements de format
  setFormat(format: number): this {
    const self = super.setFormat(format);
    return self;
  }

  // Override toggleFormat pour préserver la couleur
  toggleFormat(type: TextFormatType): this {
    const self = super.toggleFormat(type);
    return self;
  }
}

function convertColorElement(element: HTMLElement): DOMConversionOutput {
  const color = element.style.color;
  if (color) {
    const node = $createColorNode(element.textContent || '', color);
    return { node };
  }
  return { node: null };
}

export function $createColorNode(text: string, color: string): ColorNode {
  return $applyNodeReplacement(new ColorNode(text, color));
}

export function $isColorNode(node: LexicalNode | null | undefined): node is ColorNode {
  return node instanceof ColorNode;
}
