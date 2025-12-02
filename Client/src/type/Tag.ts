/**
 * Interface Tag pour les tags de notes
 * Les tags peuvent être par défaut (non modifiables) ou personnalisés
 */
export interface Tag {
  id: string;
  label: string;
  color: string;
  isDefault: boolean;
  userId?: number;
  createdAt?: string;
}

/**
 * Interface pour la réponse de l'API lors de la récupération des tags
 */
export interface GetTagsResponse {
  tags: Tag[];
}

/**
 * Interface pour la création d'un tag
 */
export interface CreateTagData {
  label: string;
  color: string;
}

/**
 * Interface pour la mise à jour d'un tag
 */
export interface UpdateTagData {
  label?: string;
  color?: string;
}
