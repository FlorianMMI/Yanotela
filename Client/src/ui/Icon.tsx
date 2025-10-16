'use client';

import React, { useEffect, useState } from 'react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  width?: number;
  height?: number;
}

const Icon = ({ name, className = "", size = 20, width, height }: IconProps) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  if (!width) width = size;
  if (!height) height = size;
  useEffect(() => {
    const loadSvg = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/${name}.svg`);
        if (response.ok) {
          const svg = await response.text();
          
          // Extraire les dimensions originales du SVG
          const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
          let scaleFactor = 1;
          
          if (viewBoxMatch) {
            const viewBoxValues = viewBoxMatch[1].split(' ');
            const originalWidth = parseFloat(viewBoxValues[2]);
            const originalHeight = parseFloat(viewBoxValues[3]);
            if (originalWidth > 0 && originalHeight > 0) {
              scaleFactor = Math.min(width! / originalWidth, height! / originalHeight);
            }
          }
          
          // Ne remplace que les fill="currentColor" ou fill="none" ou fill="#000" ou fill="black"
          // Préserve les couleurs spécifiques comme #ff0000, #blue, etc.
          let modifiedSvg = svg
            .replace(/fill="currentColor"/g, 'fill="currentColor"')
            .replace(/fill="none"/g, 'fill="none"')
            .replace(/fill="#000000"/g, 'fill="currentColor"')
            .replace(/fill="#000"/g, 'fill="currentColor"')
            .replace(/fill="black"/g, 'fill="currentColor"')
            .replace(/width="[^"]*"/g, '')
            .replace(/height="[^"]*"/g, '')
            .replace('<svg', `<svg width="${width}" height="${height}" style="display: block;"`);
          
          // Adapter les stroke-width proportionnellement
          modifiedSvg = modifiedSvg.replace(/stroke-width="([^"]+)"/g, (match, strokeWidth) => {
            const originalStrokeWidth = parseFloat(strokeWidth);
            const newStrokeWidth = originalStrokeWidth * scaleFactor;
            return `stroke-width="${newStrokeWidth}"`;
          });
          
          setSvgContent(modifiedSvg);
        } else {
          // Response pas OK, mais pas une erreur de réseau
          setSvgContent('');
        }
      } catch (error) {
        // Gestion d'erreur plus silencieuse en environnement de test
        if (process.env.NODE_ENV !== 'test') {
          console.error(`Erreur lors du chargement de l'icône ${name}:`, error);
        }
        setSvgContent('');
      } finally {
        setIsLoading(false);
      }
    };

    loadSvg();
  }, [name, size]);

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
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default Icon;
