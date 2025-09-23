'use client';

import { useEffect, useState } from 'react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

const Icon = ({ name, className = "", size = 20 }: IconProps) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(`/${name}.svg`);
        if (response.ok) {
          const svg = await response.text();
          // Remplace fill par currentColor pour permettre le styling CSS
          const modifiedSvg = svg
            .replace(/fill="[^"]*"/g, 'fill="currentColor"')
            .replace(/width="[^"]*"/g, '')
            .replace(/height="[^"]*"/g, '')
            .replace('<svg', `<svg width="${size}" height="${size}"`);
          setSvgContent(modifiedSvg);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de l'icône ${name}:`, error);
      }
    };

    loadSvg();
  }, [name, size]);

  if (!svgContent) {
    return <div className={className} style={{ width: size, height: size }} />;
  }

  return (
    <div 
      className={className}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default Icon;