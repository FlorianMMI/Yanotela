'use client';

import React, { useState, useEffect } from 'react';
import { GetUserTags, CreateTag, UpdateTag, DeleteTag } from '@/loader/loader';
import { FOLDER_COLORS } from '@/hooks/folderColors';
import { ModifIcon, TrashIcon, CloseIcon } from '@/libs/Icons';

interface Tag {
  id: string;
  nom: string;
  couleur: string;
}

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated?: () => void;
}

// Fonction pour récupérer la couleur primaire dynamique
const getPrimaryColor = (): string => {
  if (typeof window !== 'undefined') {
    const computed = getComputedStyle(document.documentElement);
    const primaryColor = computed.getPropertyValue('--primary').trim();
    return primaryColor || '#882626';
  }
  return '#882626';
};

export default function TagManagementModal({ isOpen, onClose, onTagsUpdated }: TagManagementModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(getPrimaryColor());
  const [error, setError] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>(getPrimaryColor());

  // Exclure la couleur primaire des options proposées
  const colorOptions = FOLDER_COLORS.slice(0, 6).filter(c => c.value !== 'var(--primary)');

  useEffect(() => {
    const updatePrimaryColor = () => {
      setPrimaryColor(getPrimaryColor());
    };

    const observer = new MutationObserver(updatePrimaryColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    window.addEventListener('storage', updatePrimaryColor);
    window.addEventListener('theme-changed', updatePrimaryColor);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updatePrimaryColor);
      window.removeEventListener('theme-changed', updatePrimaryColor);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

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
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setError('Le nom du tag est requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await CreateTag(newTagName.trim(), newTagColor);
      if (result.success) {
        await loadTags();
        setNewTagName('');
        setNewTagColor(primaryColor);
        if (onTagsUpdated) onTagsUpdated();
        window.dispatchEvent(new Event('tagsUpdated'));
      } else {
        setError(result.error || 'Erreur lors de la création du tag');
      }
    } catch (err) {
      setError('Erreur lors de la création du tag');
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTag = async (tagId: string, nom: string, couleur: string) => {
    if (!nom.trim()) {
      setError('Le nom du tag est requis');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await UpdateTag(tagId, nom.trim(), couleur);
      if (result.success) {
        await loadTags();
        setEditingTag(null);
        if (onTagsUpdated) onTagsUpdated();
        window.dispatchEvent(new Event('tagsUpdated'));
      } else {
        setError(result.error || 'Erreur lors de la modification du tag');
      }
    } catch (err) {
      setError('Erreur lors de la modification du tag');
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {

    setIsLoading(true);
    setError(null);
    try {
      const result = await DeleteTag(tagId);
      if (result.success) {
        await loadTags();
        if (onTagsUpdated) onTagsUpdated();
        window.dispatchEvent(new Event('tagsUpdated'));
      } else {
        setError(result.error || 'Erreur lors de la suppression du tag');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du tag');
      
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center bg-primary text-white justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-white">Gestion des tags</h2>
          <button
            onClick={onClose}
            className=" text-white hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
           <CloseIcon width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24"/>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Formulaire de création */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg ">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Créer un nouveau tag</h3>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Nom du tag</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Important, À faire, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Couleur</label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => {
                    const colorValue = color.value === 'var(--primary)' ? primaryColor : color.value;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setNewTagColor(colorValue)}
                        className={`w-8 h-8 rounded-full border-2 ${newTagColor === colorValue ? 'border-gray-600 ring-2 ring-gray-300' : 'border-gray-200'}`}
                        style={{ backgroundColor: colorValue }}
                        title={color.label}
                        disabled={isLoading}
                      />
                    );
                  })}
                </div>
              </div>
              <button
                onClick={handleCreateTag}
                disabled={isLoading || !newTagName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </div>

          {/* Liste des tags existants */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Mes tags</h3>
            {isLoading && tags.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tags.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun tag créé pour le moment</p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-primary text-primary hover:text-white bg-gray-50 transition-colors"
                  >
                    {editingTag?.id === tag.id ? (
                      <>
                        <div className="flex-1 flex gap-3 items-center">
                          <input
                            type="text"
                            value={editingTag.nom}
                            onChange={(e) => setEditingTag({ ...editingTag, nom: e.target.value })}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={isLoading}
                          />
                          <div className="flex gap-1">
                            {colorOptions.map((color) => {
                              const colorValue = color.value === 'var(--primary)' ? primaryColor : color.value;
                              return (
                                <button
                                  key={color.id}
                                  onClick={() => setEditingTag({ ...editingTag, couleur: colorValue })}
                                  className={`w-6 h-6 rounded-full border ${editingTag.couleur === colorValue ? 'border-gray-600 ring-2 ring-gray-300' : 'border-gray-200'}`}
                                  style={{ backgroundColor: colorValue }}
                                  title={color.label}
                                  disabled={isLoading}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUpdateTag(editingTag.id, editingTag.nom, editingTag.couleur)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: tag.couleur }}
                        />
                        <span className="flex-1 text-gray-900">{tag.nom}</span>
                        <button
                          onClick={() => setEditingTag(tag)}
                          disabled={isLoading}
                          className="p-2 text-gray-300 hover:text-gray-100 transition-colors"
                          title="Modifier"
                        >
                        <ModifIcon width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24"/>

                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          disabled={isLoading}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          
                        <TrashIcon width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24"/>

                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
