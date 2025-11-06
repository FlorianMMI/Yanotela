"use client";
import React from "react";
import { useState, useEffect } from "react";
import { Note } from "@/type/Note";
import { GetDeletedNotes, RestoreNote } from "@/loader/loader";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import Icon from "@/ui/Icon";
import ReturnButton from "@/ui/returnButton";

export default function Corbeille() {
  const { isAuthenticated, loading: authLoading } = useAuthRedirect();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetchDeletedNotes();
  }, []);

  const fetchDeletedNotes = async () => {
    try {
      setLoading(true);
      const response = await GetDeletedNotes();
      setNotes(response.notes || []);
    } catch (error) {
      console.error("Erreur lors du chargement des notes supprimées:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (noteId: string) => {
    try {
      setRestoring(noteId);
      const response = await RestoreNote(noteId);
      
      if (response.success) {
        // Retirer la note de la liste
        setNotes(notes.filter(note => note.id !== noteId));
        // Fermer le modal si c'est la note sélectionnée
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      } else {
        alert(response.error || "Erreur lors de la restauration");
      }
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      alert("Une erreur est survenue lors de la restauration");
    } finally {
      setRestoring(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-fondpage">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-fondpage p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <ReturnButton />
        <div className="flex items-center gap-2">
          <Icon name="trash" size={24} className="text-clrprincipal" />
          <h1 className="text-2xl font-bold text-clrprincipal">Corbeille</h1>
        </div>
      </div>

      {/* Liste des notes */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="trash" size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune note dans la corbeille</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-clrprincipal line-clamp-1">
                  {note.Titre || "Sans titre"}
                </h3>
              </div>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {note.Content || "Aucun contenu"}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>
                  Supprimée le {new Date(note.deletedAt || "").toLocaleDateString('fr-FR')}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestore(note.id);
                }}
                disabled={restoring === note.id}
                className="mt-3 w-full px-3 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {restoring === note.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Restauration...
                  </>
                ) : (
                  <>
                    <Icon name="refresh" size={16} />
                    Restaurer
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de lecture */}
      {selectedNote && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 z-50"
            onClick={() => setSelectedNote(null)}
          />
          
          {/* Modal */}
          <div className="fixed inset-4 md:inset-10 lg:inset-20 bg-white rounded-lg shadow-xl z-50 flex flex-col">
            {/* Header du modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-clrprincipal">
                {selectedNote.Titre || "Sans titre"}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(selectedNote.id)}
                  disabled={restoring === selectedNote.id}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {restoring === selectedNote.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Restauration...
                    </>
                  ) : (
                    <>
                      <Icon name="refresh" size={16} />
                      Restaurer
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Icon name="close" size={24} className="text-clrprincipal" />
                </button>
              </div>
            </div>
            
            {/* Contenu du modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedNote.Content || "Aucun contenu"}
                </p>
              </div>
            </div>
            
            {/* Footer avec info */}
            <div className="p-4 border-t text-sm text-gray-500">
              Supprimée le {new Date(selectedNote.deletedAt || "").toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
