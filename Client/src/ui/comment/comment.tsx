import { TrashIcon } from "@/libs/Icons";

interface CommentProps {
  variant?: "user" | "member";
  author: { pseudo: string } | string;
  date: string;
  text: string;
  id?: string;
  authorId?: number;
  userId?: number;
  userRole?: number;
  onDelete?: (id: string) => void;
}

export default function Comment({ variant = "user", author, date, text, id, authorId, userId, userRole, onDelete }: CommentProps) {
  // Définir la classe selon le variant
  let divClass = "w-full flex";
  if (variant === "user") {
    divClass += " justify-end";
  } else if (variant === "member") {
    divClass += " justify-start";
  }

  // Formatage date
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

  const handleDelete = () => {
    if (!id || !onDelete) return;
    
    // Debug: afficher les valeurs pour comprendre le problème

    onDelete(id);
  };

  // Calculer si l'utilisateur peut supprimer ce commentaire
  // - Propriétaire de la note (role 0) : peut supprimer tous les commentaires
  // - Admin de la note (role 1) : peut supprimer tous les commentaires
  // - Auteur du commentaire : peut supprimer son propre commentaire
  const canDelete = Boolean(
    id && 
    onDelete && 
    (
      userRole === 0 || 
      userRole === 1 || 
      (userId !== undefined && authorId !== undefined && userId === authorId)
    )
  );

  // Debug pour voir pourquoi le bouton n'apparaît pas
  console.log('[Comment] Calcul canDelete:', {
    id,
    userId,
    authorId,
    userRole,
    canDelete,
    hasId: Boolean(id),
    hasOnDelete: Boolean(onDelete),
    isOwner: userRole === 0,
    isAdmin: userRole === 1,
    isAuthor: userId !== undefined && authorId !== undefined && userId === authorId
  });

  return (
    <section className={divClass}>
      <div className="bg-background rounded-xl shadow-sm border w-80 p-2 md:p-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-primary text-sm">{typeof author === 'string' ? author : author?.pseudo}</span>
            <span className="text-xs text-gray-400">{dateStr}</span>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-sm whitespace-pre-line">{text}</p>
            {canDelete && (
              <button onClick={handleDelete} title="Supprimer le commentaire">
                <TrashIcon className="w-3 h-3 text-red-500 hover:text-red-700 cursor-pointer mt-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

