"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

interface ImageClickPluginProps {
  onClick: (src: string, nodeKey?: string) => void;
}

export default function ImageClickPlugin({ onClick }: ImageClickPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // Common handler for both click and touch events
    const handleInteraction = (event: Event) => {
      let target: HTMLElement;
      
      // Get the correct target based on event type
      if (event instanceof TouchEvent) {
        // For touch events, get the element at the touch point
        if (event.changedTouches && event.changedTouches.length > 0) {
          const touch = event.changedTouches[0];
          target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
        } else {
          return;
        }
      } else {
        target = event.target as HTMLElement;
      }
      
      if (!target) return;
      
      // Check if the clicked/touched element is an image
      if (target.tagName === "IMG") {
        const imgElement = target as HTMLImageElement;
        const src = imgElement.src;
        
        // Only handle images that are drawings (data URLs)
        if (src && src.startsWith("data:")) {
          // Prevent default behavior and stop propagation
          event.preventDefault();
          event.stopPropagation();
          
          // Try to find the node key from the parent span element
          let nodeKey: string | undefined;
          let parent: HTMLElement | null = imgElement.parentElement;
          
          // Walk up the DOM to find the decorator node
          while (parent && !nodeKey) {
            // Define a local typed interface to access the internal Lexical key without using `any`
            interface LexicalKeyElement {
              __lexicalKey?: string;
            }
            const key = (parent as unknown as LexicalKeyElement).__lexicalKey;
            if (typeof key === "string" && key.length > 0) {
              nodeKey = key;
              break;
            }
            parent = parent.parentElement as HTMLElement | null;
          }
          
          onClick(src, nodeKey);
        }
      }
    };

    rootElement.addEventListener("click", handleInteraction);
    rootElement.addEventListener("touchend", handleInteraction, { passive: false });

    return () => {
      rootElement.removeEventListener("click", handleInteraction);
      rootElement.removeEventListener("touchend", handleInteraction);
    };
  }, [editor, onClick]);

  return null;
}
