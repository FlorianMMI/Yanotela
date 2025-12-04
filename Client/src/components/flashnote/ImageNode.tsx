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
import Image from "next/image";

export interface ImagePayload {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
  key?: NodeKey;
  isDrawing?: boolean; // Flag to identify drawings vs regular images
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
    isDrawing?: boolean;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;
  __isDrawing: boolean;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__isDrawing,
      node.getKey()
    );
  }

  constructor(
    src: string,
    altText?: string,
    width?: number,
    height?: number,
    isDrawing?: boolean,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText || "";
    this.__width = width;
    this.__height = height;
    this.__isDrawing = isDrawing || false;
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
      isDrawing: this.__isDrawing,
      type: "image",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height, isDrawing } = serializedNode;
    return $createImageNode({
      src,
      altText,
      width,
      height,
      isDrawing,
    });
  }

  decorate(): React.ReactElement {
    const baseStyle: React.CSSProperties = {
      maxWidth: "100%",
      height: "auto",
      display: "block",
      margin: "1rem 0",
      borderRadius: "4px",
      userSelect: "none",
      pointerEvents: "none", // Prevent drawing over images
    };

    const drawingStyle: React.CSSProperties = this.__isDrawing ? {
      border: "2px dashed #ccc",
      padding: "4px",
      cursor: "pointer",
    } : {};

    return (
      <Image
        src={this.__src}
        alt={this.__altText}
        style={{
          ...baseStyle,
          ...drawingStyle,
        }}
        width={this.__width || 800}
        height={this.__height || 600}
        draggable={false}
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
      isDrawing: false, // Imported images are not drawings
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
    payload.isDrawing,
    payload.key
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
