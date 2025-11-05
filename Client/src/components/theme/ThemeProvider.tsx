"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useTheme as useThemeHook, ThemeType, Theme } from "@/hooks/useTheme";

interface ThemeContextType {
  currentTheme: ThemeType;
  theme: Theme;
  changeTheme: (theme: ThemeType) => void;
  themes: Theme[];
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider pour le système de thèmes
 * À placer dans le layout principal de l'application
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeHook = useThemeHook();

  return (
    <ThemeContext.Provider value={themeHook}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte de thème
 * Alternative à useTheme() pour les composants profondément imbriqués
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
}
