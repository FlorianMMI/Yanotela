export interface Folder {
  id: string;
  Nom: string;
  Description?: string;
  CouleurTag?: string; // Pour personnaliser visuellement le dossier
  CreatedAt: string;
  ModifiedAt: string;
  authorId?: number;
  noteCount?: number; // Nombre de notes dans le dossier
}
