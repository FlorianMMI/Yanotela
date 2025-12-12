"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { GetNoteById, GetFolderById, UpdateFolder } from '@/loader/loader';
import NoteMore from '@/components/noteMore/NoteMore';
import FolderMore from '@/components/folderMore/FolderMore';

import SaveFlashNoteButton from '../flashnote/SaveFlashNoteButton';
import ConnectedUsers from '../collaboration/ConnectedUsers';
import { yjsDocuments } from '@/collaboration/providers';
import { DocsIcon, FlashIcon, FolderIcon, MoreIcon, ProfileIcon, Comment } from '@/libs/Icons';

interface BreadcrumbProps {
  openCommentModal?: () => void;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  isNoteTitle?: boolean;
}

export default function Breadcrumb({ openCommentModal }: BreadcrumbProps) {
  const pathname = usePathname();
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [folderName, setFolderName] = useState<string>('');

  interface FolderData {
    Nom: string;
    Description?: string | null;
    CouleurTag?: string | null;
    ModifiedAt?: string | null;
    noteCount?: number;
    // allow other properties returned by the API without using `any`
    [key: string]: unknown;
  }

  const [folderData, setFolderData] = useState<FolderData | null>(null); // Pour stocker toutes les infos du dossier
  const [tempFolderName, setTempFolderName] = useState<string>('');
  const [showNoteMore, setShowNoteMore] = useState(false);
  const [showFolderMore, setShowFolderMore] = useState(false);
  const [tempTitle, setTempTitle] = useState<string>('');
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0); // Pour forcer le rechargement

  // États pour les notifications du titre
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Détecter si on est sur Flash Note
  const isFlashNote = pathname === '/flashnote';

  // Extraire l'ID de la note depuis l'URL
  const extractNoteId = (): string | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (pathname.startsWith('/notes/') && segments.length > 1) {
      return segments[1];
    }
    return null;
  };

  // Extraire l'ID du dossier depuis l'URL
  const extractFolderId = (): string | null => {
    const segments = pathname.split('/').filter(Boolean);
    if (pathname.startsWith('/dossiers/') && segments.length > 1) {
      return segments[1];
    }
    return null;
  };

  const noteId = extractNoteId();
  const folderId = extractFolderId();

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
      const loadFlashNoteTitle = () => {
        try {
          const savedTitle = localStorage.getItem("yanotela:flashnote:title");
          const title = savedTitle || "Flash:";
          setNoteTitle(title);
          setTempTitle(title);
        } catch (error) {
          
          setNoteTitle("Flash:");
          setTempTitle("Flash:");
        }
      };

      // Charger initialement
      loadFlashNoteTitle();

      // Écouter les changements dans localStorage (pour synchronisation avec la page Flash Note)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "yanotela:flashnote:title") {
          loadFlashNoteTitle();
        }
      };

      // Écouter aussi les événements custom pour la synchronisation
      const handleFlashNoteTitleUpdate = () => {
        loadFlashNoteTitle();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('flashnote-title-updated', handleFlashNoteTitleUpdate);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('flashnote-title-updated', handleFlashNoteTitleUpdate);
      };
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

  // Charger le nom du dossier
  useEffect(() => {
    const fetchFolderName = async () => {
      if (folderId) {
        try {
          const response = await GetFolderById(folderId);
          if (response && response.folder) {
            setFolderName(response.folder.Nom);
            setTempFolderName(response.folder.Nom);
            setFolderData(response.folder); // Stocker toutes les infos du dossier
          } else {
            setFolderName('Dossier');
            setTempFolderName('Dossier');
          }
        } catch (error) {
          
          setFolderName('Dossier');
        }
      }
    };

    // Écouter les mises à jour de titre depuis la page de dossier
    const handleFolderTitleUpdate = (event: CustomEvent) => {
      const { folderId: updatedFolderId, title } = event.detail;
      if (updatedFolderId === folderId) {
        setFolderName(title);
        setTempFolderName(title);
        // Recharger les données complètes du dossier
        if (folderId) {
          GetFolderById(folderId).then(response => {
            if (response && response.folder) {
              setFolderData(response.folder);
            }
          });
        }
      }
    };

    fetchFolderName();

    window.addEventListener('folderTitleUpdated', handleFolderTitleUpdate as EventListener);

    return () => {
      window.removeEventListener('folderTitleUpdated', handleFolderTitleUpdate as EventListener);
    };
  }, [folderId]);

  // Sauvegarder le titre modifié via WebSocket
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
        
        setError('Erreur lors de la sauvegarde du titre');
        setTimeout(() => setError(null), 3000);
      }
      return;
    }

    if (noteId) {
      const finalTitle = newTitle.trim() === '' ? 'Sans titre' : newTitle;
      setNoteTitle(finalTitle);
      setTempTitle(finalTitle);

      try {
        // ✅ Mettre à jour le titre dans YJS pour synchronisation temps réel
        const ydoc = yjsDocuments.get(noteId);
        if (ydoc) {
          const metadata = ydoc.getMap('metadata');
          metadata.set('title', finalTitle);
          
        } else {
          
        }

        // Émettre un événement pour synchroniser avec la page de note
        window.dispatchEvent(new CustomEvent('noteTitleUpdated', {
          detail: { noteId, title: finalTitle }
        }));
      } catch (error) {
        
        setError('Erreur de synchronisation');
        setTimeout(() => setError(null), 3000);
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

  // Sauvegarder le titre du dossier modifié
  const updateFolderTitle = async (newTitle: string) => {
    if (folderId) {
      if (!newTitle.trim()) {
        setError('Le nom du dossier ne peut pas être vide');
        setTimeout(() => setError(null), 3000);
        setTempFolderName(folderName); // Restaurer le titre précédent
        return;
      }

      if (newTitle.trim() === folderName.trim()) {
        // Pas de changement
        return;
      }

      setFolderName(newTitle);

      try {
        const response = await UpdateFolder(folderId, { Nom: newTitle.trim() });

        if (response.success) {
          setSuccess('Nom du dossier mis à jour');
          setTimeout(() => setSuccess(null), 2000);

          // Émettre un événement pour synchroniser avec la page de dossier
          window.dispatchEvent(new CustomEvent('folderTitleUpdated', {
            detail: { folderId, title: newTitle.trim() }
          }));
        } else {
          setError(response.error || 'Erreur lors de la mise à jour');
          setTimeout(() => setError(null), 3000);
          setTempFolderName(folderName); // Restaurer le titre précédent
        }
      } catch (error) {
        
        setError('Erreur de synchronisation');
        setTimeout(() => setError(null), 3000);
        setTempFolderName(folderName); // Restaurer le titre précédent
      }
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
      // Utiliser noteTitle s'il existe et n'est pas vide, sinon utiliser le fallback par défaut
      const displayTitle = noteTitle && noteTitle.trim() !== '' ? noteTitle : '';
      return [
        { label: 'Mes Notes', href: '/notes' },
        { label: displayTitle, isActive: true, isNoteTitle: true },
      ];
    }

    if (pathname === '/dossiers') {
      return [
        { label: 'Mes Dossiers', isActive: true },
      ];
    }

    if (pathname.startsWith('/dossiers/') && segments.length > 1) {
      const displayName = folderName || 'Dossier';
      return [
        { label: 'Mes Dossiers', href: '/dossiers' },
        { label: displayName, isActive: true, isNoteTitle: true }, // Marquer comme éditable
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

    if (pathname === '/corbeille') {
      return [
        { label: 'Profil', href: '/profil' },
        { label: 'Corbeille', isActive: true },
      ];
    }

    if (pathname === '/a2f') {
      return [
        { label: 'Authentification à deux facteurs', isActive: true },
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
        <div className="fixed top-4 right-4 z-50 max-w-md pl-4">
          {success && (
            <div
              onClick={() => setSuccess(null)}
              className="rounded-md bg-success-50 p-4 border border-success-200 cursor-pointer hover:bg-success-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-success-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-success-800">
                    {success}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <button className="inline-flex text-success-400 hover:text-success-600">
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
              className="rounded-md bg-dangerous-50 p-4 border border-dangerous-200 cursor-pointer hover:bg-dangerous-100 transition-colors shadow-lg"
            >
              <div className="flex">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-dangerous-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-dangerous-800">
                    {error}
                  </p>
                </div>
                <div className="ml-4 shrink-0">
                  <button className="inline-flex text-dangerous-400 hover:text-dangerous-600">
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

      <nav className="bg-background p-3">{/* Début de la section navigation */}
        <div className="flex items-center text-sm space-x-2 relative">
          {/* Icône de la page courante */}
          {(() => {
            if (pathname.includes('/notes')) {
              return <DocsIcon name="docs" width={20} height={20} strokeWidth={12} className="text-primary" />;
            }
            if (pathname.includes('/dossiers')) {
              return <FolderIcon width={20} height={20} className="text-primary" />;
            }
            if (pathname.includes('/profil')) {
              return <ProfileIcon width={20} height={20} strokeWidth={12} className="text-primary" />;
            }
            if (pathname === '/flashnote') {
              return <FlashIcon width={30} height={30} strokeWidth={12} className="text-primary" />;
            }
            return null;
          })()}
          
          {/* Fil d'Ariane */}
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <p className="text-2xl text-clrprincipal">/</p>
              )}
              {item.href && !item.isActive ? (
                <Link
                  href={item.href}
                  className="text-clrprincipal hover:text-primary-hover text-2xl transition-colors font-bold"
                >
                  {item.label}
                </Link>
              ) : item.isNoteTitle ? (
                // Input pour le titre de la note OU du dossier
                <div className="flex items-center space-x-2">
                  {isLoadingTitle ? (
                    <span className="text-clrprincipal text-2xl font-semibold animate-pulse">
                      Chargement...
                    </span>
                  ) : noteId ? (
                    // Input pour le titre de la note
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
                  ) : folderId ? (
                    // Input pour le titre du dossier
                    <input
                      type="text"
                      value={tempFolderName}
                      onChange={(e) => setTempFolderName(e.target.value)}
                      onBlur={(e) => updateFolderTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="text-clrprincipal text-2xl font-semibold bg-transparent border-none outline-none focus:bg-white focus:bg-opacity-20 rounded py-1 min-w-0 max-w-xs"
                      placeholder="Nom du dossier"
                    />
                  ) : null}
                  {/* Container pour pousser l'icône complètement à droite */}
                  {noteId && !isFlashNote && (
                    <div className="flex-1 flex justify-end min-w-0 absolute right-4 top-2">
                      <ConnectedUsers noteId={noteId} />

                      <button
                        onClick={() => {
                          if (openCommentModal) openCommentModal();
                        }}
                        className="ml-2"
                      >
                        <Comment 
                          width={30}
                          height={30}
                          className='text-primary cursor-pointer'
                        />
                      </button>

                      <span
                        onClick={() => setShowNoteMore((prev) => !prev)}
                        className="ml-2"
                      >
                        <MoreIcon
                          width={30}
                          height={30}
                          className="text-primary cursor-pointer"
                        />
                      </span>
                      {showNoteMore && (
                        <div className="absolute right-0 mt-10 z-100">
                          <NoteMore noteId={noteId!} onClose={() => setShowNoteMore(false)} />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Bouton More pour les dossiers */}
                  {folderId && (
                    <div className="flex-1 flex justify-end min-w-0 absolute right-4 top-2">
                      <span
                        onClick={() => setShowFolderMore((prev) => !prev)}
                        className="ml-2"
                      >
                        <MoreIcon
                          width={30}
                          height={30}
                          className="text-primary cursor-pointer"
                        />
                      </span>
                      {showFolderMore && folderData && (
                        <div className="absolute right-0 mt-10 z-100">
                          <FolderMore 
                            folder={{ ModifiedAt: folderData.ModifiedAt ?? "" }}
                            folderId={folderId!} 
                            folderName={folderData.Nom || folderName}
                            folderDescription={folderData.Description || ""}
                            folderColor={folderData.CouleurTag || "var(--primary)"}
                            noteCount={folderData.noteCount || 0}
                            onUpdate={async (name: string, description: string, color: string) => {
                              // La mise à jour sera gérée par la page dossiers/[id]
                              // On émet juste un événement pour synchroniser
                              window.dispatchEvent(new CustomEvent('folderUpdateRequested', {
                                detail: { folderId, name, description, color }
                              }));
                            }}
                            onDelete={() => {
                              // La suppression sera gérée par la page dossiers/[id]
                              window.dispatchEvent(new CustomEvent('folderDeleteRequested', {
                                detail: { folderId }
                              }));
                            }}
                            onClose={() => setShowFolderMore(false)} 
                          />
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

          {/* Bouton de sauvegarde pour Flash Note à droite (desktop uniquement) */}
          {isFlashNote && (
            <div className="absolute right-4 top-2 hidden md:block">
              <SaveFlashNoteButton 
                currentTitle={noteTitle}
                className="text-sm!"
              />
            </div>
          )}
        </div>
      </nav>

    </>
  );
}
