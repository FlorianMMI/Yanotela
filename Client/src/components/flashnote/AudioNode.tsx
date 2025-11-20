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

export interface AudioPayload {
  src: string;
  altText?: string;
  key?: NodeKey;
}

export type SerializedAudioNode = Spread<
  {
    src: string;
    altText: string;
  },
  SerializedLexicalNode
>;

export class AudioNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;

  static getType(): string {
    return "audio";
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(
      node.__src,
      node.__altText,
      node.getKey()
    );
  }

  constructor(
    src: string,
    altText?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText || "";
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    const theme = config.theme;
    const className = theme.audio;
    if (className !== undefined) {
      div.className = className;
    }
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("audio");
    element.setAttribute("src", this.__src);
    element.setAttribute("controls", "true");
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      audio: () => ({
        conversion: convertAudioElement,
        priority: 0,
      }),
    };
  }

  exportJSON(): SerializedAudioNode {
    return {
      src: this.__src,
      altText: this.__altText,
      type: "audio",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedAudioNode): AudioNode {
    const { src, altText } = serializedNode;
    return $createAudioNode({
      src,
      altText,
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
        <audio
          src={this.__src}
          controls
          style={{
            width: "100%",
            maxWidth: "500px",
            display: "block",
            borderRadius: "8px",
            outline: "none",
            pointerEvents: "auto", // Allow interaction with audio controls
          }}
          preload="metadata"
        >
          Votre navigateur ne supporte pas l&apos;élément audio.
        </audio>
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

function convertAudioElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLAudioElement) {
    const { src } = domNode;
    const node = $createAudioNode({
      src,
      altText: "Audio",
    });
    return { node };
  }
  return null;
}

export function $createAudioNode(payload: AudioPayload): AudioNode {
  return new AudioNode(
    payload.src,
    payload.altText,
    payload.key
  );
}

export function $isAudioNode(
  node: LexicalNode | null | undefined
): node is AudioNode {
  return node instanceof AudioNode;
}
