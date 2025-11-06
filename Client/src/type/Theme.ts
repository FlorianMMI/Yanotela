/**
 * Types pour le système de thèmes
 * Centralise tous les types utilisés par le système de thèmes
 */

/**
 * Types de thèmes disponibles dans l'application
 * Ajoutez de nouveaux types ici lors de la création de nouveaux thèmes
 */
export type ThemeType = "light" | "dark" | "blue" | "green" | "purple";

/**
 * Interface définissant les couleurs d'un thème
 */
export interface ThemeColors {
  /** Couleur de fond principale de l'application */
  background: string;
  
  /** Couleur de fond des cartes et conteneurs */
  deskbackground: string;
  
  /** Couleur du texte principal */
  foreground: string;
  
  /** Couleur d'accentuation secondaire (zones désactivées, hover) */
  beigeFoncer: string;
  
  /** Couleur des éléments gris/secondaires */
  grisClair: string;
  
  /** Couleur primaire (boutons, liens, actions) */
  primary: string;
  
  /** Couleur primaire au survol */
  primaryHover: string;
  
  /** Couleur claire contextuelle (généralement blanc ou noir selon le thème) */
  light: string;
  
  /** Couleur sombre contextuelle (généralement noir ou blanc selon le thème) */
  dark: string;
  
  /** Couleur de fond des notes */
  lightNote: string;
  
  /** Couleur du texte dans les notes */
  textlightNote: string;
  
  /** Opacité du motif de fond (optionnel, défaut: 0.03) */
  motifOpacity?: string;
}

/**
 * Interface complète d'un thème
 */
export interface Theme {
  /** Identifiant unique du thème */
  id: ThemeType;
  
  /** Nom affiché à l'utilisateur */
  name: string;
  
  /** Palette de couleurs du thème */
  colors: ThemeColors;
}

/**
 * Props pour le composant ThemeSelector
 */
export interface ThemeSelectorProps {
  /** Classes CSS personnalisées */
  className?: string;
  
  /** Afficher uniquement l'icône (pas le texte) */
  iconOnly?: boolean;
  
  /** Fonction callback lors du changement de thème */
  onThemeChange?: (theme: ThemeType) => void;
}

/**
 * Hook useTheme - Type de retour
 */
export interface UseThemeReturn {
  /** ID du thème actuellement actif */
  currentTheme: ThemeType;
  
  /** Objet complet du thème actif */
  theme: Theme;
  
  /** Fonction pour changer de thème */
  changeTheme: (newTheme: ThemeType) => void;
  
  /** Liste de tous les thèmes disponibles */
  themes: Theme[];
  
  /** Indique si le thème a été chargé depuis le localStorage */
  isLoaded: boolean;
}

/**
 * Type pour les préférences de thème stockées
 */
export interface ThemePreferences {
  /** Thème sélectionné par l'utilisateur */
  selectedTheme: ThemeType;
  
  /** Timestamp de la dernière modification */
  lastModified: number;
  
  /** Version du schéma de thème (pour migrations futures) */
  version?: number;
}

/**
 * Enum pour les événements de thème personnalisés
 */
export enum ThemeEvent {
  THEME_CHANGED = "theme-changed",
  THEME_LOADED = "theme-loaded",
  THEME_ERROR = "theme-error",
}

/**
 * Type pour les événements de changement de thème
 */
export interface ThemeChangeEvent extends CustomEvent {
  detail: {
    previousTheme: ThemeType;
    currentTheme: ThemeType;
    timestamp: number;
  };
}

/**
 * Configuration du système de thèmes
 */
export interface ThemeSystemConfig {
  /** Thème par défaut */
  defaultTheme: ThemeType;
  
  /** Clé localStorage pour sauvegarder le thème */
  storageKey: string;
  
  /** Activer les transitions CSS */
  enableTransitions: boolean;
  
  /** Durée des transitions (en ms) */
  transitionDuration: number;
  
  /** Émettre des événements lors des changements */
  emitEvents: boolean;
}
