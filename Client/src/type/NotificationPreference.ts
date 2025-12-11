/**
 * Types pour les préférences de notifications (architecture relationnelle)
 */

/**
 * Type de notification (référence de la table notification_type)
 */
export interface NotificationType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Préférence utilisateur pour un type de notification
 * (référence de la table user_notification_preference)
 */
export interface UserNotificationPreference {
  id: number;
  userId: number;
  notificationTypeId: number;
  appEnabled: boolean;
  mailEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Format de réponse de l'API GET /notification-preference/get
 * Combine les informations du type et des préférences utilisateur
 */
export interface NotificationPreferenceResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  appEnabled: boolean;
  mailEnabled: boolean;
}

/**
 * Format pour l'interface utilisateur (état local du composant)
 */
export interface NotificationSetting {
  code: string;
  name: string;
  description: string;
  appnotif: boolean;
  mailnotif: boolean;
}

/**
 * Format pour la mise à jour des préférences
 * Body de PUT /notification-preference/update
 */
export interface NotificationPreferenceUpdate {
  code: string;
  appEnabled: boolean;
  mailEnabled: boolean;
}

