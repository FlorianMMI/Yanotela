'use client';

import React, { useEffect, useState } from 'react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  width?: number;
  height?: number;
  strokeWidth?: number; // Ajout pour contrôler l'épaisseur du trait
}

const Icon = ({ name, className = "", size = 20, width, height, strokeWidth }: IconProps) => {
  const [svgContent, setSvgContent] = useState<string>('');
  if (!width) width = size;
  if (!height) height = size;
  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(`/${name}.svg`);
        if (response.ok) {
          const svg = await response.text();
          // Utiliser DOMParser pour manipuler le SVG proprement
          const parser = new window.DOMParser();
          const doc = parser.parseFromString(svg, "image/svg+xml");
          const svgEl = doc.documentElement;
          svgEl.setAttribute("width", String(width));
          svgEl.setAttribute("height", String(height));
          svgEl.setAttribute("style", "display: block;");

          // Harmoniser les couleurs
          const elements = svgEl.querySelectorAll('path, circle, rect, line, polyline, polygon');
          elements.forEach(el => {
            // Harmoniser fill
            if (el.getAttribute('fill') === '#000' || el.getAttribute('fill') === '#000000' || el.getAttribute('fill') === 'black') {
              el.setAttribute('fill', 'currentColor');
            }
            // Harmoniser stroke
            if (el.getAttribute('stroke') === '#000' || el.getAttribute('stroke') === '#000000' || el.getAttribute('stroke') === 'black') {
              el.setAttribute('stroke', 'currentColor');
            }
            // Appliquer strokeWidth si demandé
            if (typeof strokeWidth === 'number') {
              el.setAttribute('stroke-width', String(strokeWidth));
            }
          });

          // Générer le SVG final
          const serializer = new window.XMLSerializer();
          const finalSvg = serializer.serializeToString(svgEl);
          setSvgContent(finalSvg);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de l'icône ${name}:`, error);
      }
    };
    loadSvg();
  }, [name, size, strokeWidth, width, height]);

  if (!svgContent) {
    return <div className={className} role="img" style={{ width: width, height: height }} />;
  }

  return (
    <div 
      className={className}
      role="img"
      style={{ 
        width: width, 
        height: height, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        lineHeight: 0
      }}
    >
      {(() => {
        const InlineSvg: React.FC<{ content: string }> = ({ content }) => {
          const elRef = React.useRef<HTMLDivElement | null>(null);

          React.useEffect(() => {
            const container = elRef.current;
            if (!container) return;
            container.replaceChildren();
            if (!content) return;

            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(content, 'image/svg+xml');
              const svgEl = doc.documentElement;
              const node = document.importNode(svgEl, true);
              container.appendChild(node);
            } catch (err) {
              console.error('Failed to render SVG content', err);
            }

            return () => {
              if (container) container.replaceChildren();
            };
          }, [content]);

          return <div ref={elRef} style={{ width: '100%', height: '100%' }} aria-hidden />;
        };

        return <InlineSvg content={svgContent} />;
      })()}
    </div>
  );
};

export default Icon;
