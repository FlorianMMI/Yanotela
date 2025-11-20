"use client";
import { useEffect, useState } from "react";
import { ThemeType } from "@/type/Theme";

export interface Theme {
  id: ThemeType;
  name: string;
}

// Configuration des thèmes disponibles
export const themes: Theme[] = [
  { id: "light", name: "Clair" },
  { id: "dark", name: "Sombre" },
  { id: "blue", name: "Bleu" },
  { id: "green", name: "Vert" },
  { id: "purple", name: "Violet" },
  { id: "night", name: "Nuit" },
];

const defaultTheme: ThemeType = "light";

// Helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === "undefined") return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Apply theme to body element
function applyThemeToBody(theme: ThemeType) {
  if (typeof document === "undefined") return;
  
  const body = document.body;
  // Remove all theme classes
  themes.forEach(t => body.classList.remove(t.id));
  // Add the new theme class
  body.classList.add(theme);
}

// Sync theme with backend
async function syncThemeWithBackend(theme: ThemeType): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${apiUrl}/user/theme`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ theme }),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Failed to sync theme with backend:", error);
    return false;
  }
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme on mount
  useEffect(() => {
    // Priority: cookie > default
    const cookieTheme = getCookie("user-theme") as ThemeType;
    const initialTheme = cookieTheme && themes.some(t => t.id === cookieTheme)
      ? cookieTheme
      : defaultTheme;
    
    setCurrentTheme(initialTheme);
    applyThemeToBody(initialTheme);
    setIsLoaded(true);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!isLoaded) return;
    applyThemeToBody(currentTheme);
  }, [currentTheme, isLoaded]);

  const changeTheme = async (newTheme: ThemeType) => {
    if (!themes.some(t => t.id === newTheme)) {
      console.error(`Invalid theme: ${newTheme}`);
      return;
    }

    // Update state
    setCurrentTheme(newTheme);
    
    // Update cookie
    setCookie("user-theme", newTheme);
    
    // Apply to body
    applyThemeToBody(newTheme);
    
    // Sync with backend (non-blocking)
    syncThemeWithBackend(newTheme);
  };

  // Function to load theme from user data (called after login)
  const loadThemeFromUser = (userTheme: ThemeType) => {
    if (themes.some(t => t.id === userTheme) && userTheme !== currentTheme) {
      setCurrentTheme(userTheme);
      setCookie("user-theme", userTheme);
      applyThemeToBody(userTheme);
    }
  };

  return {
    currentTheme,
    theme: themes.find(t => t.id === currentTheme) || themes[0],
    changeTheme,
    loadThemeFromUser,
    themes,
    isLoaded,
  };
}
