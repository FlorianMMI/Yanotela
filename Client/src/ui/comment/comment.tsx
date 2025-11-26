import { TrashIcon } from "@/libs/Icons";
import { DeleteComment } from "@/loader/loader";
import { useState } from "react";

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

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const result = await DeleteComment(id);
    setDeleting(false);
    if (result.success && onDelete) {
      onDelete(id);
    } else if (!result.success) {
      alert(result.error || "Erreur lors de la suppression du commentaire.");
    }
  };
  console.log(userId, authorId, userRole)

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
            {id && (
              userRole === 0 // propriétaire de la note : bouton pour tous les commentaires
              || userId === authorId // auteur du commentaire
              || userRole === 1 // admin
            ) && (
              <button onClick={handleDelete} disabled={deleting} title="Supprimer le commentaire">
                <TrashIcon className={`w-3 h-3 text-red-500 hover:text-red-700 cursor-pointer mt-2 ${deleting ? 'opacity-50' : ''}`} />
              </button>
            )
            }
          </div>
        </div>
      </div>
    </section>
  );
}

