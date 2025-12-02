"use client";

import React, { useState, useEffect } from 'react';
import { Tag } from '@/type/Tag';
import { GetUserTags, CreateTag, UpdateTag, DeleteTag } from '@/loader/loader';
import { motion, AnimatePresence } from 'framer-motion';

interface TagManagerProps {
  onClose: () => void;
}

export default function TagManager({ onClose }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ label: '', color: '#D4AF37' });
  const [error, setError] = useState<string | null>(null);

  // Charger les tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    const result = await GetUserTags();
    if ('error' in result) {
      setError(result.error);
    } else {
      // Filtrer uniquement les tags personnalisés (non par défaut)
      setTags(result.tags.filter(tag => !tag.isDefault));
    }
    setIsLoading(false);
  };

  const handleCreateTag = async () => {
    if (!formData.label.trim()) {
      setError('Le nom du tag est requis');
      return;
    }

    const result = await CreateTag(formData);
    if (result.success && result.tag) {
      setTags([...tags, result.tag]);
      setFormData({ label: '', color: '#D4AF37' });
      setIsCreating(false);
      setError(null);
      // Émettre un événement pour rafraîchir les tags dans les autres composants
      window.dispatchEvent(new Event('tagsUpdated'));
    } else {
      setError(result.error || 'Erreur lors de la création du tag');
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    const result = await UpdateTag(editingTag.id, formData);
    if (result.success && result.tag) {
      setTags(tags.map(tag => tag.id === editingTag.id ? result.tag! : tag));
      setEditingTag(null);
      setFormData({ label: '', color: '#D4AF37' });
      setError(null);
      // Émettre un événement pour rafraîchir les tags dans les autres composants
      window.dispatchEvent(new Event('tagsUpdated'));
    } else {
      setError(result.error || 'Erreur lors de la mise à jour du tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) return;

    const result = await DeleteTag(tagId);
    if (result.success) {
      setTags(tags.filter(tag => tag.id !== tagId));
      setError(null);
      // Émettre un événement pour rafraîchir les tags dans les autres composants
      window.dispatchEvent(new Event('tagsUpdated'));
    } else {
      setError(result.error || 'Erreur lors de la suppression du tag');
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ label: tag.label, color: tag.color });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setIsCreating(false);
    setFormData({ label: '', color: '#D4AF37' });
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-primary to-primary-hover p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gérer mes tags</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Bouton créer un nouveau tag */}
              {!isCreating && !editingTag && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full mb-6 py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer un nouveau tag
                </button>
              )}

              {/* Formulaire de création/édition */}
              <AnimatePresence>
                {(isCreating || editingTag) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 rounded-lg p-4 mb-6"
                  >
                    <h3 className="text-lg font-semibold mb-4">
                      {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du tag
                        </label>
                        <input
                          type="text"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          placeholder="Ex: Urgent, Important..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Couleur
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            placeholder="#RRGGBB"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                            pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={editingTag ? handleUpdateTag : handleCreateTag}
                          className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                        >
                          {editingTag ? 'Mettre à jour' : 'Créer'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Liste des tags personnalisés */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Mes tags personnalisés ({tags.length})
                </h3>
                {tags.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Vous n'avez pas encore de tags personnalisés.
                    <br />
                    Créez-en un pour commencer !
                  </p>
                ) : (
                  tags.map((tag) => (
                    <motion.div
                      key={tag.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-gray-800">{tag.label}</span>
                        <span className="text-xs text-gray-500 font-mono">{tag.color}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(tag)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
