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

export interface VideoPayload {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
  key?: NodeKey;
}

export type SerializedVideoNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

export class VideoNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;

  static getType(): string {
    return "video";
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.getKey()
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
    const div = document.createElement("div");
    const theme = config.theme;
    const className = theme.video;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("video");
    element.setAttribute("src", this.__src);
    element.setAttribute("controls", "true");
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
      video: () => ({
        conversion: convertVideoElement,
        priority: 0,
      }),
    };
  }

  exportJSON(): SerializedVideoNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      type: "video",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const { src, altText, width, height } = serializedNode;
    return $createVideoNode({
      src,
      altText,
      width,
      height,
    });
  }

  decorate(): React.ReactElement {
    return (
      <div
        style={{
          margin: "1rem 0",
          userSelect: "none",
        }}
      >
        <video
          src={this.__src}
          controls
          style={{
            width: this.__width ? `${this.__width}px` : "100%",
            maxWidth: "100%",
            height: "auto",
            display: "block",
            borderRadius: "8px",
            outline: "none",
            pointerEvents: "auto",
            backgroundColor: "#000",
          }}
          preload="metadata"
        >
          Votre navigateur ne supporte pas l&apos;élément vidéo.
        </video>
        {this.__altText && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#666",
              marginTop: "0.5rem",
              fontStyle: "italic",
              pointerEvents: "none",
            }}
          >
            {this.__altText}
          </p>
        )}
      </div>
    );
  }
}

function convertVideoElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLVideoElement) {
    const { src, width, height } = domNode;
    const node = $createVideoNode({
      src,
      altText: "Video",
      width: width ? parseInt(String(width)) : undefined,
      height: height ? parseInt(String(height)) : undefined,
    });
    return { node };
  }
  return null;
}

export function $createVideoNode(payload: VideoPayload): VideoNode {
  return new VideoNode(
    payload.src,
    payload.altText,
    payload.width,
    payload.height,
    payload.key
  );
}

export function $isVideoNode(
  node: LexicalNode | null | undefined
): node is VideoNode {
  return node instanceof VideoNode;
}
