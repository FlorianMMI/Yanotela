import React, { useState, useEffect } from 'react';
import { GetUserTags, UpdateNoteTag } from '@/loader/loader';

interface Tag {
  id: string;
  nom: string;
  couleur: string;
}

interface TagNoteProps {
  noteId: string;
  currentTagId?: string | null;
  onTagUpdated?: () => void;
}

export default function TagNote({ noteId, currentTagId, onTagUpdated }: TagNoteProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(currentTagId || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    setSelectedTagId(currentTagId || null);
  }, [currentTagId]);

  // Écouter les mises à jour des tags
  useEffect(() => {
    const handleTagsUpdated = () => {
      loadTags();
    };

    window.addEventListener('tagsUpdated', handleTagsUpdated);
    return () => {
      window.removeEventListener('tagsUpdated', handleTagsUpdated);
    };
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await GetUserTags();
      if (result.success && result.tags) {
        setTags(result.tags);
      } else {
        setError(result.error || 'Erreur lors du chargement des tags');
      }
    } catch (err) {
      setError('Erreur lors du chargement des tags');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagChange = async (tagId: string | null) => {
    if (tagId === selectedTagId) return;

    setSelectedTagId(tagId);
    setIsUpdating(true);
    setError(null);

    try {
      const result = await UpdateNoteTag(noteId, tagId);
      if (result.success) {
        if (onTagUpdated) {
          onTagUpdated();
        }
        // Déclencher un événement pour rafraîchir la liste des notes
        window.dispatchEvent(new Event('noteTagUpdated'));
      } else {
        console.error("Erreur lors de la mise à jour du tag:", result.error);
        setError(result.error || "Erreur lors de la mise à jour du tag");
        // Restaurer le tag précédent en cas d'erreur
        setSelectedTagId(currentTagId || null);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du tag:", error);
      setError("Une erreur est survenue lors de la mise à jour du tag");
      // Restaurer le tag précédent en cas d'erreur
      setSelectedTagId(currentTagId || null);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {tags.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Vous n&apos;avez pas encore créé de tags personnalisés.
            </p>
            <p className="text-sm text-gray-400">
              Cliquez sur l&apos;icône de stylo à côté de &quot;Tag couleur&quot; pour en créer.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Choisissez un tag pour cette note :
            </p>

            <div className="space-y-2">
              {/* Option "Aucun tag" */}
              <button
                onClick={() => handleTagChange(null)}
                disabled={isUpdating}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                  ${selectedTagId === null
                    ? 'border-gray-400 bg-gray-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Aucun tag</span>
                </div>
                {selectedTagId === null && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 8 8">
                      <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/>
                    </svg>
                  </div>
                )}
              </button>

              {/* Tags personnalisés */}
              {tags.map((tag) => {
                const isSelected = selectedTagId === tag.id;

                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagChange(tag.id)}
                    disabled={isUpdating}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                      ${isSelected
                        ? 'border-gray-400 bg-gray-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {/* Aperçu de la couleur */}
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: tag.couleur }}
                    />

                    {/* Nom du tag */}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">{tag.nom}</span>
                    </div>

                    {/* Indicateur de sélection */}
                    {isSelected && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 8 8">
                          <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {isUpdating && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}