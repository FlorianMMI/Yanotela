"use client";
import { useEffect, useState } from "react";
import { themeConfig, defaultTheme } from "./themeConfig";

export type ThemeType = "light" | "dark" | "blue" | "green" | "purple";

export interface Theme {
  id: ThemeType;
  name: string;
  colors: {
    background: string;
    deskbackground: string;
    foreground: string;
    beigeFoncer: string;
    grisClair: string;
    primary: string;
    primaryHover: string;
    light: string;
    dark: string;
    lightNote: string;
    textlightNote: string;
    motifOpacity?: string;
  };
}

// Exporter les thèmes depuis la configuration
export const themes: Record<ThemeType, Theme> = themeConfig;

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le thème sauvegardé au montage
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as ThemeType;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    setIsLoaded(true);
  }, []);

  // Appliquer le thème au document
  useEffect(() => {
    if (!isLoaded) return;

    const theme = themes[currentTheme];
    const root = document.documentElement;

    // Appliquer toutes les variables CSS
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Sauvegarder dans localStorage
    localStorage.setItem("app-theme", currentTheme);

    // Ajouter une classe pour faciliter le ciblage CSS
    root.setAttribute("data-theme", currentTheme);
  }, [currentTheme, isLoaded]);

  const changeTheme = (newTheme: ThemeType) => {
    if (themes[newTheme]) {
      setCurrentTheme(newTheme);
    }
  };

  return {
    currentTheme,
    theme: themes[currentTheme],
    changeTheme,
    themes: Object.values(themes),
    isLoaded,
  };
}
