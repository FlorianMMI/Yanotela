/**
 * Configuration des thèmes de l'application Yanotela
 * 
 * Pour ajouter un nouveau thème :
 * 1. Ajoutez le nom du thème au type ThemeType
 * 2. Créez un nouvel objet Theme avec toutes les couleurs requises
 * 3. Ajoutez-le à l'objet themes ci-dessous
 * 
 * Structure d'un thème :
 * {
 *   id: string (identifiant unique du thème)
 *   name: string (nom affiché à l'utilisateur)
 *   colors: {
 *     background: string (couleur de fond principale)
 *     deskbackground: string (couleur de fond des cartes/conteneurs)
 *     foreground: string (couleur du texte principal)
 *     beigeFoncer: string (couleur d'accentuation secondaire)
 *     grisClair: string (couleur des éléments gris)
 *     primary: string (couleur primaire de l'app - boutons, liens)
 *     primaryHover: string (couleur primaire au survol)
 *     light: string (couleur claire - généralement blanc ou noir selon le thème)
 *     dark: string (couleur sombre - généralement noir ou blanc selon le thème)
 *     lightNote: string (couleur de fond des notes)
 *     textlightNote: string (couleur du texte dans les notes)
 *     motifOpacity?: string (opacité du motif de fond - optionnel, défaut: 0.03)
 *   }
 * }
 * 
 * Exemples d'utilisation :
 * - Pour un thème sombre : inverser light/dark, utiliser des couleurs sombres
 * - Pour un thème coloré : choisir une palette cohérente (ex: tons bleus, verts...)
 * - Toujours assurer un bon contraste entre foreground et background pour l'accessibilité
 */

import { Theme, ThemeType } from "./useTheme";

export const themeConfig: Record<ThemeType, Theme> = {
  light: {
    id: "light",
    name: "Clair",
    colors: {
      background: "#E9EBDB",
      deskbackground: "#EDEDED",
      foreground: "#171717",
      beigeFoncer: "#d5d7c3",
      grisClair: "#272727",
      primary: "#882626",
      primaryHover: "#ff0000",
      light: "white",
      dark: "black",
      lightNote: "white",
      textlightNote: "oklch(55.1% 0.027 264.364)",
      motifOpacity: "0.03",
    },
  },
  
  dark: {
    id: "dark",
    name: "Sombre",
    colors: {
      background: "#1a1a1a",
      deskbackground: "#2a2a2a",
      foreground: "#e5e5e5",
      beigeFoncer: "#333333",
      grisClair: "#d1d1d1",
      primary: "#ef4444",
      primaryHover: "#dc2626",
      light: "black",
      dark: "white",
      lightNote: "#2d2d2d",
      textlightNote: "#e0e0e0",
      motifOpacity: "0.01",
    },
  },
  
  blue: {
    id: "blue",
    name: "Bleu",
    colors: {
      background: "#e0e7ff",
      deskbackground: "#dbeafe",
      foreground: "#1e3a8a",
      beigeFoncer: "#c7d2fe",
      grisClair: "#3730a3",
      primary: "#4f46e5",
      primaryHover: "#4338ca",
      light: "white",
      dark: "#1e3a8a",
      lightNote: "white",
      textlightNote: "#312e81",
      motifOpacity: "0.03",
    },
  },
  
  green: {
    id: "green",
    name: "Vert",
    colors: {
      background: "#dcfce7",
      deskbackground: "#d1fae5",
      foreground: "#064e3b",
      beigeFoncer: "#bbf7d0",
      grisClair: "#065f46",
      primary: "#16a34a",
      primaryHover: "#15803d",
      light: "white",
      dark: "#064e3b",
      lightNote: "white",
      textlightNote: "#14532d",
      motifOpacity: "0.03",
    },
  },
  
  purple: {
    id: "purple",
    name: "Violet",
    colors: {
      background: "#f3e8ff",
      deskbackground: "#fae8ff",
      foreground: "#581c87",
      beigeFoncer: "#e9d5ff",
      grisClair: "#6b21a8",
      primary: "#9333ea",
      primaryHover: "#7e22ce",
      light: "white",
      dark: "#581c87",
      lightNote: "white",
      textlightNote: "#6b21a8",
      motifOpacity: "0.03",
    },
  },
};

/**
 * Liste des IDs de thèmes disponibles
 * Utilisé pour la validation et les types
 */
export const availableThemes: ThemeType[] = Object.keys(themeConfig) as ThemeType[];

/**
 * Thème par défaut de l'application
 */
export const defaultTheme: ThemeType = "light";

/**
 * Guide pour créer un nouveau thème :
 * 
 * 1. Ajoutez le type dans useTheme.ts :
 *    export type ThemeType = "light" | "dark" | "blue" | "green" | "purple" | "votre-nouveau-theme";
 * 
 * 2. Ajoutez la configuration ici :
 *    "votre-nouveau-theme": {
 *      id: "votre-nouveau-theme",
 *      name: "Nom Affiché",
 *      colors: { ... }
 *    }
 * 
 * 3. (Optionnel) Ajoutez une icône personnalisée dans themeSelector.tsx dans la fonction getThemeIcon
 * 
 * 4. Le nouveau thème sera automatiquement disponible dans le sélecteur !
 */
