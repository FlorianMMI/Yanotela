import React, { useState, useEffect } from 'react';
import { FOLDER_COLORS } from '@/hooks/folderColors';
import { UpdateNoteTag, GetUserTags } from '@/loader/loader';
import { Tag } from '@/type/Tag';

interface TagNoteProps {
  noteId: string;
  currentTag?: string;
  onTagUpdated?: () => void;
}

export default function TagNote({ noteId, currentTag, onTagUpdated }: TagNoteProps) {
  const [selectedColor, setSelectedColor] = useState<string>(currentTag || 'var(--primary)');
  const [isUpdating, setIsUpdating] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Charger tous les tags (défaut + personnalisés)
  useEffect(() => {
    loadTags();
    
    // Écouter les événements de mise à jour des tags
    const handleTagsUpdated = () => {
      loadTags();
    };
    window.addEventListener('tagsUpdated', handleTagsUpdated);
    
    return () => {
      window.removeEventListener('tagsUpdated', handleTagsUpdated);
    };
  }, []);

  useEffect(() => {
    setSelectedColor(currentTag || 'var(--primary)');
  }, [currentTag]);

  const loadTags = async () => {
    setIsLoadingTags(true);
    const result = await GetUserTags();
    if ('error' in result) {
      console.error('Erreur lors du chargement des tags:', result.error);
      // Utiliser uniquement les tags par défaut en cas d'erreur
      setAllTags(FOLDER_COLORS.map(c => ({
        id: c.id,
        label: c.label,
        color: c.value,
        isDefault: true
      })));
    } else {
      setAllTags(result.tags);
    }
    setIsLoadingTags(false);
  };

  const handleColorChange = async (color: string) => {
    if (color === selectedColor) return;

    setSelectedColor(color);
    setIsUpdating(true);

    try {
      const result = await UpdateNoteTag(noteId, color);
      if (result.success) {
        if (onTagUpdated) {
          onTagUpdated();
        }
        // Déclencher un événement pour rafraîchir la liste des notes
        window.dispatchEvent(new Event('noteTagUpdated'));
      } else {
        console.error("Erreur lors de la mise à jour du tag:", result.error);
        alert(result.error || "Erreur lors de la mise à jour du tag");
        // Restaurer la couleur précédente en cas d'erreur
        setSelectedColor(currentTag || 'var(--primary)');
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du tag:", error);
      alert("Une erreur est survenue lors de la mise à jour du tag");
      // Restaurer la couleur précédente en cas d'erreur
      setSelectedColor(currentTag || 'var(--primary)');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingTags) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Séparer les tags par défaut et personnalisés
  const defaultTags = allTags.filter(tag => tag.isDefault);
  const customTags = allTags.filter(tag => !tag.isDefault);

  return (
    <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Choisissez un tag pour cette note :
        </p>

        {/* Tags par défaut */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Tags par défaut</h4>
          <div className="grid grid-cols-3 gap-3">
            {defaultTags.map((tag) => {
              const colorValue = tag.color === 'var(--primary)' ? '#882626' : tag.color;
              const isSelected = selectedColor === tag.color;
              
              return (
                <button
                  key={tag.id}
                  onClick={() => handleColorChange(tag.color)}
                  disabled={isUpdating}
                  className={`
                    relative flex flex-col items-center p-3 rounded-lg border-2 transition-all
                    ${isSelected 
                      ? 'border-primary shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
                  `}
                  title={tag.label}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm mb-2"
                    style={{ backgroundColor: colorValue }}
                  />
                  <span className="text-xs font-medium text-gray-700 text-center">
                    {tag.label}
                  </span>

                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                        <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags personnalisés */}
        {customTags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Mes tags personnalisés</h4>
            <div className="grid grid-cols-3 gap-3">
              {customTags.map((tag) => {
                const isSelected = selectedColor === tag.color;
                
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleColorChange(tag.color)}
                    disabled={isUpdating}
                    className={`
                      relative flex flex-col items-center p-3 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-primary shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
                    `}
                    title={tag.label}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm mb-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
                      {tag.label}
                    </span>

                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                          <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Aperçu du tag sélectionné */}
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu :</h4>
          <div className="flex items-center gap-3 p-2 bg-white rounded-lg border">
            <span className="text-sm text-gray-600">Tag de la note :</span>
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: selectedColor === 'var(--primary)' ? '#882626' : selectedColor }}
            />
            <span className="text-sm font-medium">
              {allTags.find(t => t.color === selectedColor)?.label || 'Couleur personnalisée'}
            </span>
          </div>
        </div>

        {isUpdating && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}