import React from "react";
import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";

export interface ImagePayload {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      (node as any).__key
    );
  }

  constructor(
    src: string,
    altText?: string,
    width?: number,
    height?: number,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText || "";
    this.__width = width;
    this.__height = height;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    if (this.__width) {
      element.setAttribute("width", String(this.__width));
    }
    if (this.__height) {
      element.setAttribute("height", String(this.__height));
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      type: "image",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode({
      src,
      altText,
      width,
      height,
    });
  }

  decorate(): React.ReactElement {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
          margin: "1rem 0",
          border: "2px dashed #ccc",
          borderRadius: "4px",
          padding: "4px",
          cursor: "pointer",
        }}
        width={this.__width}
        height={this.__height}
      />
    );
  }
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { src, alt, width, height } = domNode;
    const node = $createImageNode({
      src,
      altText: alt,
      width: width ? parseInt(String(width)) : undefined,
      height: height ? parseInt(String(height)) : undefined,
    });
    return { node };
  }
  return null;
}

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(
    payload.src,
    payload.altText,
    payload.width,
    payload.height,
    payload.key
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
