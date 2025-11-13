import React, { useState, useEffect } from 'react';
import { FOLDER_COLORS } from '@/hooks/folderColors';
import { UpdateNoteTag } from '@/loader/loader';

interface TagNoteProps {
  noteId: string;
  currentTag?: string;
  onTagUpdated?: () => void;
}

export default function TagNote({ noteId, currentTag, onTagUpdated }: TagNoteProps) {
  const [selectedColor, setSelectedColor] = useState<string>(currentTag || 'var(--primary)');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelectedColor(currentTag || 'var(--primary)');
  }, [currentTag]);

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
        window.dispatchEvent(new Event('auth-refresh'));
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

  return (
    <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Choisissez une couleur pour le tag de cette note :
        </p>

        <div className="grid grid-cols-3 gap-3">
          {FOLDER_COLORS.map((color) => {
            const colorValue = color.value === 'var(--primary)' ? '#882626' : color.value;
            const isSelected = selectedColor === color.value;
            
            return (
              <button
                key={color.id}
                onClick={() => handleColorChange(color.value)}
                disabled={isUpdating}
                className={`
                  relative flex flex-col items-center p-3 rounded-lg border-2 transition-all
                  ${isSelected 
                    ? 'border-gray-400 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
                `}
                title={color.label}
              >
                {/* Aperçu de la couleur */}
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm mb-2"
                  style={{ backgroundColor: colorValue }}
                />
                
                {/* Nom de la couleur */}
                <span className="text-xs font-medium text-gray-700">
                  {color.label}
                </span>

                {/* Indicateur de sélection */}
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
              {FOLDER_COLORS.find(c => c.value === selectedColor)?.label || 'Couleur personnalisée'}
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