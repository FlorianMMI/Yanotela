/**
 * Types pour le système de permissions
 * Définit les interfaces pour gérer les permissions des notes partagées
 */

/**
 * Interface représentant une permission d'accès à une note
 */
export interface Permission {
  /** ID de l'utilisateur ayant la permission */
  id_user: number;
  
  /** ID de la note concernée */
  id_note: string;
  
  /** Rôle de l'utilisateur (0=propriétaire, 1=admin, 2=éditeur, 3=lecteur) */
  role: number;
  
  /** Indique si l'utilisateur a accepté l'invitation */
  isAccepted: boolean;
  
  /** Informations optionnelles sur l'utilisateur */
  user?: {
    id: number;
    pseudo: string;
    email: string;
  };
}

/**
 * Rôles de permission disponibles
 */
export enum PermissionRole {
  /** Propriétaire - tous les droits */
  OWNER = 0,
  
  /** Administrateur - peut gérer les permissions */
  ADMIN = 1,
  
  /** Éditeur - peut modifier le contenu */
  EDITOR = 2,
  
  /** Lecteur - lecture seule */
  READER = 3,
}

/**
 * Helper pour vérifier si un rôle peut modifier une note
 */
export function canEdit(role: number): boolean {
  return role <= PermissionRole.EDITOR;
}

/**
 * Helper pour vérifier si un rôle peut gérer les permissions
 */
export function canManagePermissions(role: number): boolean {
  return role <= PermissionRole.ADMIN;
}

/**
 * Helper pour obtenir le label d'un rôle
 */
export function getRoleLabel(role: number): string {
  switch (role) {
    case PermissionRole.OWNER:
      return '👑 Propriétaire';
    case PermissionRole.ADMIN:
      return '⚙️ Admin';
    case PermissionRole.EDITOR:
      return '✏️ Éditeur';
    case PermissionRole.READER:
      return '👁️ Lecteur';
    default:
      return 'Inconnu';
  }
}
