"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/ui/Icon';
import { GetNoteById, SaveNote, CreateNote } from '@/loader/loader';
import NoteMore from '@/components/noteMore/NoteMore';
import Icons from '@/ui/Icon';
import { useRouter } from 'next/navigation';


interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  isNoteTitle?: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [tempTitle, setTempTitle] = useState<string>(''); // Titre temporaire pour l'input
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0); // Pour forcer le rechargement
  
  // États pour les notifications du titre
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États pour le popup de sauvegarde Flash Note
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasFlashContent, setHasFlashContent] = useState(false);

  // Détecter si on est sur Flash Note
  const isFlashNote = pathname === '/flashnote';

  // Fonction helper pour extraire le texte du contenu Lexical
  const extractTextFromLexicalContent = (contentObj: any): boolean => {
    if (!contentObj || !contentObj.root || !contentObj.root.children) {
      return false;
    }
    
    const extractTextRecursive = (node: any): string => {
      let text = '';
      if (node.text) {
        text += node.text;
      }
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          text += extractTextRecursive(child);
        }
      }
      return text;
    };
    
    const fullText = extractTextRecursive(contentObj.root);
    return fullText.trim().length > 0;
  };

  // Extraire l'ID de la note depuis l'URL
  const extractNoteId = (): string | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (pathname.startsWith('/notes/') && segments.length > 1) {
      return segments[1];
    }
    return null;
  };

  const noteId = extractNoteId();

  // Hook pour détecter les changements de taille d'écran et synchroniser les données
  useEffect(() => {
    const handleResize = () => {
      // Force le rechargement des données quand on change de taille d'écran
      setLastFetchTime(Date.now());
    };

    // Écouter les mises à jour de titre depuis la page de note
    const handleTitleUpdate = (event: CustomEvent) => {
      const { noteId: updatedNoteId, title } = event.detail;
      if (updatedNoteId === noteId) {
        setNoteTitle(title);
        setTempTitle(title);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('noteTitleUpdated', handleTitleUpdate as EventListener);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('noteTitleUpdated', handleTitleUpdate as EventListener);
    };
  }, [noteId]);

  // Charger le titre de la note ou Flash Note
  useEffect(() => {
    if (isFlashNote) {
      // Pour Flash Note, charger depuis localStorage
      try {
        const savedTitle = localStorage.getItem("yanotela:flashnote:title");
        const title = savedTitle || "Flash:";
        setNoteTitle(title);
        setTempTitle(title);
      } catch (error) {
        console.error('Erreur lors du chargement du titre Flash Note:', error);
        setNoteTitle("Flash:");
        setTempTitle("Flash:");
      }
      return;
    }

    const fetchNoteTitle = async () => {
      if (noteId) {
        setIsLoadingTitle(true);

        try {
          const note = await GetNoteById(noteId);
          if (note && !('error' in note)) {
            const title = note.Titre || 'Sans titre'; // Même fallback que page.tsx
            setNoteTitle(title);
            setTempTitle(title); // Synchroniser le titre temporaire
          } else {
            const errorTitle = 'Erreur de chargement';
            setNoteTitle(errorTitle);
            setTempTitle(errorTitle);
          }
        } catch (error) {
          console.error('Erreur lors du chargement du titre:', error);
          const errorTitle = 'Erreur de chargement';
          setNoteTitle(errorTitle);
          setTempTitle(errorTitle);
        } finally {
          setIsLoadingTitle(false);
        }
      }
    };

    fetchNoteTitle();
  }, [noteId, lastFetchTime, isFlashNote]); // Ajouter isFlashNote comme dépendance

  // Vérifier le contenu de Flash Note pour activer/désactiver le bouton de sauvegarde
  useEffect(() => {
    if (isFlashNote) {
      const checkFlashContent = () => {
        const flashContent = localStorage.getItem("yanotela:flashnote:content") || '';
        if (!flashContent.trim()) {
          setHasFlashContent(false);
          return;
        }

        try {
          const contentObj = JSON.parse(flashContent);
          const hasContent = extractTextFromLexicalContent(contentObj);
          setHasFlashContent(hasContent);
        } catch (e) {
          setHasFlashContent(flashContent.trim().length > 0);
        }
      };

      // Vérifier au chargement
      checkFlashContent();

      // Vérifier périodiquement (toutes les 500ms)
      const interval = setInterval(checkFlashContent, 500);

      return () => clearInterval(interval);
    }
  }, [isFlashNote]);

  // Sauvegarder le titre modifié
  const updateNoteTitle = async (newTitle: string) => {
    if (isFlashNote) {
      // Pour Flash Note, sauvegarder dans localStorage
      const finalTitle = newTitle.trim() === '' ? 'Flash:' : newTitle;
      setNoteTitle(finalTitle);
      setTempTitle(finalTitle);
      
      try {
        localStorage.setItem("yanotela:flashnote:title", finalTitle);
        setSuccess('Titre Flash Note sauvegardé localement');
        setTimeout(() => setSuccess(null), 2000);
      } catch (error) {
        console.error('Erreur localStorage titre Flash Note:', error);
        setError('Erreur lors de la sauvegarde du titre');
        setTimeout(() => setError(null), 3000);
      }
      return;
    }

    if (noteId) {
      setNoteTitle(newTitle);
      setTempTitle(newTitle);

      try {
        // D'abord récupérer la note complète pour préserver le contenu
        const note = await GetNoteById(noteId);
        if (note) {
          // Sauvegarder avec le nouveau titre et l'ancien contenu
          const success = await SaveNote(noteId, {
            Titre: newTitle,
            Content: 'Content' in note ? note.Content || '' : '' // Préserver le contenu existant
          });

          if (success) {
            setSuccess('Titre sauvegardé avec succès');
            setTimeout(() => setSuccess(null), 3000);
            // Émettre un événement pour synchroniser avec la page de note
            window.dispatchEvent(new CustomEvent('noteTitleUpdated', { 
              detail: { noteId, title: newTitle } 
            }));
          } else {
            setError('Erreur lors de la sauvegarde du titre');
            setTimeout(() => setError(null), 5000);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du titre:', error);
        setError('Erreur lors de la sauvegarde du titre');
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const handleTitleSave = async (newTitle: string) => {
    if (isFlashNote) {
      // Pour Flash Note, utiliser "Flash:" comme fallback
      if (newTitle.trim() === '') {
        const fallbackTitle = 'Flash:';
        setTempTitle(fallbackTitle);
        await updateNoteTitle(fallbackTitle);
      } else if (newTitle !== noteTitle) {
        await updateNoteTitle(newTitle);
      }
    } else {
      // Pour les notes normales
      if (newTitle.trim() === '') {
        const fallbackTitle = 'Titre de la note';
        setTempTitle(fallbackTitle);
        await updateNoteTitle(fallbackTitle);
      } else if (newTitle !== noteTitle) {
        await updateNoteTitle(newTitle);
      }
    }
  };

  // Fonction pour sauvegarder Flash Note comme note normale
  const handleSaveFlashNote = async () => {
    if (!saveTitle.trim()) {
      setError('Le titre ne peut pas être vide');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Récupérer le contenu de Flash Note depuis localStorage
    const flashContent = localStorage.getItem("yanotela:flashnote:content") || '';
    
    // Vérifier si le contenu n'est pas vide
    if (!flashContent.trim()) {
      setError('Impossible de sauvegarder une Flash Note vide');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Vérifier si le contenu JSON a du texte réel
    try {
      const contentObj = JSON.parse(flashContent);
      // Extraire le texte du contenu Lexical pour vérifier s'il y a du contenu réel
      const hasRealContent = extractTextFromLexicalContent(contentObj);
      if (!hasRealContent) {
        setError('Impossible de sauvegarder une Flash Note vide');
        setTimeout(() => setError(null), 3000);
        return;
      }
    } catch (e) {
      // Si ce n'est pas du JSON, vérifier directement le texte
      if (!flashContent.trim()) {
        setError('Impossible de sauvegarder une Flash Note vide');
        setTimeout(() => setError(null), 3000);
        return;
      }
    }

    setIsSaving(true);
    
    try {
      
      // Créer une nouvelle note
      const result = await CreateNote();

      if (result.note && result.note.id) {
        // Mettre à jour la note avec le titre et contenu de Flash Note
        const updateSuccess = await SaveNote(result.note.id, {
          Titre: saveTitle.trim(),
          Content: flashContent
        });

        if (updateSuccess) {
          // Vider Flash Note localStorage
          localStorage.removeItem("yanotela:flashnote:title");
          localStorage.removeItem("yanotela:flashnote:content");
          
          setSuccess('Flash Note sauvegardée avec succès !');
          setTimeout(() => setSuccess(null), 3000);
          
          // Fermer le popup
          setShowSavePopup(false);
          setSaveTitle('');
          
          // Rediriger vers la nouvelle note
          router.push(`/notes/${result.note.id}`);
        } else {
          setError('Erreur lors de la sauvegarde du contenu');
          setTimeout(() => setError(null), 5000);
        }
      } else {
        setError('Erreur lors de la création de la note');
        setTimeout(() => setError(null), 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde Flash Note:', error);
      setError('Erreur lors de la sauvegarde');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);

    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
      return [{ label: 'Accueil', isActive: true }];
    }

    if (pathname === '/notes') {
      return [
        { label: 'Mes Notes', isActive: true },
      ];
    }

    if (pathname.startsWith('/notes/') && segments.length > 1) {
      const noteId = segments[1];
      // Utiliser noteTitle s'il existe et n'est pas vide, sinon utiliser le fallback par défaut
      const displayTitle = noteTitle && noteTitle.trim() !== '' ? noteTitle : '';
      return [
        { label: 'Mes Notes', href: '/notes' },
        { label: displayTitle, isActive: true, isNoteTitle: true },
      ];
    }

    if (pathname === '/flashnote') {
      return [
        { label: 'Flash Note', isActive: true },
      ];
    }

    if (pathname === '/forgot-password') {
      return [
        { label: 'Mot de passe oublié', isActive: true },
      ];
    }

    if (pathname.startsWith('/forgot-password/') && segments.length > 1) {
      return [
        { label: 'Mot de passe oublié', href: '/forgot-password' },
        { label: 'Réinitialisation', isActive: true },
      ];
    }
    if (pathname === '/profil') {
      return [
        { label: 'Mon Profil', isActive: true },
      ];
    }

    // Fallback pour les autres routes
    return [
      { label: 'Accueil', href: '/' },
      { label: 'Page courante', isActive: true },
    ];
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <>
      {/* Zone de notifications pour le titre */}
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          {success && (
            <div 
              onClick={() => setSuccess(null)}
              className="rounded-md bg-green-50 p-4 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-800">
                    {success}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex text-green-400 hover:text-green-600">
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div 
              onClick={() => setError(null)}
              className="rounded-md bg-red-50 p-4 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex text-red-400 hover:text-red-600">
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Popup de sauvegarde Flash Note */}
      {showSavePopup && (
        <div className="fixed inset-0 bg-[#00000050] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-clrprincipal mb-4">
              Sauvegarder Flash Note
            </h3>
            <p className="text-gray-600 mb-4">
              Donnez un titre à votre Flash Note pour la sauvegarder comme note normale :
            </p>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Titre de la note..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSaving) {
                  handleSaveFlashNote();
                }
                if (e.key === 'Escape') {
                  setShowSavePopup(false);
                  setSaveTitle('');
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSavePopup(false);
                  setSaveTitle('');
                }}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveFlashNote}
                disabled={isSaving || !saveTitle.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-background p-3">
        <div className="flex justify-between items-center text-sm space-x-2 relative">
          <div>
          {/* Déterminer l'icône selon la page courante */}
          {(() => {
            if (pathname.includes('/notes')) {
              return <Icon name="docs" size={20} className="text-primary" />;
            }
            if (pathname.includes('/profil')) {
              return <Icon name="profile" size={20} className="text-primary" />;
            }
            if (pathname === '/flashnote') {
              return <Icon name="flash" size={30} className="text-primary stroke-[10]" />;
            }
          })()}
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <p className="text-2xl text-clrprincipal">/</p>
              )}
              {item.href && !item.isActive ? (
                <Link
                  href={item.href}
                  className="text-clrprincipal hover:text-rouge-hover text-2xl transition-colors font-bold"
                >
                  {item.label}
                </Link>
              ) : item.isNoteTitle ? (
                // Input pour le titre de la note
                <div className="flex items-center space-x-2">
                  {isLoadingTitle ? (
                    <span className="text-clrprincipal text-2xl font-semibold animate-pulse">
                      Chargement...
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={(e) => handleTitleSave(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="text-clrprincipal text-2xl font-semibold bg-transparent border-none outline-none focus:bg-white focus:bg-opacity-20 rounded py-1 min-w-0 max-w-xs"
                      placeholder=""
                    />
                  )}
                      {/* Menu kebab seulement pour les notes normales, pas Flash Note */}
                      {!isFlashNote && (
                        <div className="flex-1 flex justify-end min-w-0 absolute right-4 top-2">
                          <span
                            onClick={() => setShowNoteMore((prev) => !prev)}
                            className="ml-2"
                          >
                            <Icons
                              name="more"
                              size={30}
                              className="text-primary cursor-pointer"
                            />
                          </span>
                          {showNoteMore && (
                            <div className="absolute right-0 mt-10 z-20">
                              <NoteMore noteId={noteId!} onClose={() => setShowNoteMore(false)} />
                            </div>
                          )}
                        </div>
                      )}
                </div>
              ) : (
                <span
                  className={`${item.isActive
                    ? 'text-clrprincipal text-2xl font-semibold'
                    : 'text-gray-500'
                    } `}
                >
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
          {/* Bouton de sauvegarde pour Flash Note à droite */}
          {isFlashNote && (
            <div>
              <button
                onClick={() => hasFlashContent && setShowSavePopup(true)}
                disabled={!hasFlashContent}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  hasFlashContent 
                    ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={hasFlashContent ? "Sauvegarder Flash Note" : "Aucun contenu à sauvegarder"}
              >
                <Icon name="save" size={16} className={hasFlashContent ? "text-white" : "text-gray-500"} />
                <span className="text-sm font-medium">Sauvegarder</span>
              </button>
            </div>
          )}
        </div>

      </nav>

    </>
  );
}