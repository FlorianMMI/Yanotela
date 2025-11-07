'use client';

import { useEffect, useState } from 'react';

/**
 * Composant qui met à jour dynamiquement la meta theme-color
 * en fonction du thème actif de l'utilisateur
 */
export default function ThemeColorMeta() {
  const [themeColor, setThemeColor] = useState('#E9EBDB'); // light background par défaut

  useEffect(() => {
    // Fonction pour obtenir la couleur du thème actif
    const updateThemeColor = () => {
      const body = document.body;
      const theme = body.className.match(/\b(light|dark|blue|green|purple|night)\b/)?.[0] || 'light';
      
      const themeColors: Record<string, string> = {
        light: '#E9EBDB',   // --light-background
        dark: '#1a1a1a',    // --dark-background
        blue: '#e0e7ff',    // --blue-background
        green: '#dcfce7',   // --green-background
        purple: '#f3e8ff',  // --purple-background
        night: '#0f172a',   // --night-background
      };

      const color = themeColors[theme];
      setThemeColor(color);

      // Mettre à jour la meta tag existante
      let metaTag = document.querySelector('meta[name="theme-color"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', color);
    };

    // Initialiser la couleur
    updateThemeColor();

    // Observer les changements de classe sur body
    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return null; // Ce composant ne rend rien, il manipule juste le DOM
}
